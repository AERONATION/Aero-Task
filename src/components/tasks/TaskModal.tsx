import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MultiUserSelect } from '@/components/ui/MultiUserSelect';
import { Task, TaskPriority, ChecklistItem } from '@/types/task';
import { UserProfile, TEAMS } from '@/types/user';
import { createTask, updateTask } from '@/services/taskService';
import { getAllUsers } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { toDate } from '@/utils/date';
import { format } from 'date-fns';
import { parseApiJson, downloadSampleApiJson } from '@/utils/jsonParser';
import { getMethodBadgeClass } from '@/components/tasks/ApiChecklist';
import {
  UploadCloud,
  FileJson,
  Download,
  Plus,
  Trash2,
  Code2,
  CheckCircle2,
  Layers,
  X,
  Users,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null; // If provided, edit mode
  users?: UserProfile[]; // Provided in admin mode or teammate list
  onSuccess?: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  users = [],
  onSuccess,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(users);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [team, setTeam] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual endpoint addition state
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newMethod, setNewMethod] = useState('GET');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newEndpointTitle, setNewEndpointTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure users list is populated even if not passed via props
  useEffect(() => {
    if (users && users.length > 0) {
      setAvailableUsers(users);
    } else {
      getAllUsers()
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setAvailableUsers(fetched);
          }
        })
        .catch((err) => {
          console.warn('Could not load user roster for assignment:', err);
        });
    }
  }, [users, isOpen]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setAssignedTo(
        Array.isArray(task.assignedTo)
          ? task.assignedTo
          : task.assignedTo
          ? [task.assignedTo]
          : []
      );
      setTeam(task.team || '');
      setChecklist(Array.isArray(task.checklist) ? [...task.checklist] : []);

      if (task.deadline) {
        const d = toDate(task.deadline);
        setDeadline(format(d, 'yyyy-MM-dd'));
      }
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo(user?.uid ? [user.uid] : []);
      setTeam(profile?.team || '');
      setChecklist([]);

      // Default deadline to 3 days from now
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 3);
      setDeadline(format(defaultDeadline, 'yyyy-MM-dd'));
    }
    setShowManualAdd(false);
  }, [task, isOpen, user, profile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedItems = parseApiJson(content);
        if (parsedItems.length === 0) {
          error('No API endpoints or test items found in the JSON file');
          return;
        }
        setChecklist((prev) => [...prev, ...parsedItems]);
        success(`Successfully imported ${parsedItems.length} API test items from JSON!`);
      } catch (err: any) {
        console.error('JSON parse error:', err);
        error(err.message || 'Failed to parse JSON file');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndpoint.trim() && !newEndpointTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: 'chk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      title: newEndpointTitle.trim() || `${newMethod} ${newEndpoint.trim()}`,
      method: newMethod,
      endpoint: newEndpoint.trim() || undefined,
      completed: false,
    };

    setChecklist((prev) => [...prev, newItem]);
    setNewEndpoint('');
    setNewEndpointTitle('');
    setShowManualAdd(false);
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const isAssignerOrAdmin = Boolean(
    isAdmin || (task && (task.createdBy === user?.uid || task.assignedBy === user?.uid))
  );
  const isRestrictedEdit = Boolean(task && !isAssignerOrAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const finalAssignees = assignedTo.length > 0 ? assignedTo : [user.uid];

    setLoading(true);
    try {
      if (task) {
        // Edit mode
        if (isRestrictedEdit) {
          // Regular user without assigner rights can only view or adjust
          await updateTask(
            task.id,
            {
              assignedTo: finalAssignees,
            },
            user.uid,
            profile?.name || user.displayName || 'User'
          );
          success('Assigned team members updated successfully');
        } else {
          // Assigner or Admin full edit
          if (!title.trim()) {
            error('Please enter a task title');
            setLoading(false);
            return;
          }
          if (!deadline) {
            error('Please specify a task deadline');
            setLoading(false);
            return;
          }
          const deadlineDate = new Date(`${deadline}T23:59:59`);
          await updateTask(
            task.id,
            {
              title: title.trim(),
              description: description.trim(),
              priority,
              deadline: deadlineDate,
              assignedTo: finalAssignees,
              team: (team as any) || null,
              checklist,
            },
            user.uid,
            profile?.name || user.displayName || (isAdmin ? 'Admin' : 'Assigner')
          );
          success('Task updated successfully');
        }
      } else {
        // Create mode
        if (!title.trim()) {
          error('Please enter a task title');
          setLoading(false);
          return;
        }
        if (!deadline) {
          error('Please specify a task deadline');
          setLoading(false);
          return;
        }
        const deadlineDate = new Date(`${deadline}T23:59:59`);
        await createTask({
          title: title.trim(),
          description: description.trim(),
          createdBy: user.uid,
          assignedTo: finalAssignees,
          assignedBy: finalAssignees.some((id) => id !== user.uid) ? user.uid : null,
          team: (team as any) || profile?.team || null,
          priority,
          deadline: deadlineDate,
          creatorName: profile?.name || user.displayName || 'Teammate',
          checklist,
        });
        success('Task created successfully with assignees and API checklist!');
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Task submission error:', err);
      error(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? (isRestrictedEdit ? 'Manage Assignees' : 'Edit Task') : 'Create & Assign Task'}
      description={
        task
          ? isRestrictedEdit
            ? 'Add, remove, or reassign team members for this task.'
            : 'Update task parameters, manage multiple assignees, and edit API test endpoints.'
          : 'Define a task, assign to one or multiple team members, and upload API JSON test endpoints.'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left pb-2">
        {/* Member Permission Notice */}
        {isRestrictedEdit && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
            <Users className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="leading-relaxed">
              <strong>Assignee Access:</strong> You can add or remove assigned team members. Other task details (Title, Deadline, Priority, Department, API Endpoints) can only be modified by Administrators.
            </span>
          </div>
        )}
        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., Test and Verify Microservice Authentication Endpoints"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isRestrictedEdit}
          required={!isRestrictedEdit}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Provide clear instructions, testing parameters, or acceptance criteria..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isRestrictedEdit}
        />

        {/* Deadline & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isRestrictedEdit}
            required={!isRestrictedEdit}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={isRestrictedEdit}
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        {/* Multiple Assignees Selector & Department (ALWAYS VISIBLE) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="sm:col-span-2">
            <MultiUserSelect
              label="Assign To (Multiple Users Allowed)"
              users={
                availableUsers.length > 0
                  ? availableUsers
                  : user
                  ? [
                      {
                        uid: user.uid,
                        name: profile?.name || user.displayName || 'You',
                        email: user.email || '',
                        systemRole: profile?.systemRole || 'user',
                        team: profile?.team,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastLoginAt: new Date(),
                      },
                    ]
                  : []
              }
              selectedUids={assignedTo}
              onChange={(uids) => {
                setAssignedTo(uids);
                if (!team && uids.length > 0 && !isRestrictedEdit) {
                  const firstUser = availableUsers.find((u) => u.uid === uids[0]);
                  if (firstUser?.team) setTeam(firstUser.team);
                }
              }}
              placeholder="Select one or more team members..."
            />
          </div>

          <div className="sm:col-span-1">
            <Select
              label="Department"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              disabled={isRestrictedEdit}
            >
              <option value="">Select department...</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* API Checklist & JSON Upload Section */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>API Checklist / Test Endpoints ({checklist.length})</span>
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isRestrictedEdit
                  ? 'Configured API test endpoints (view-only).'
                  : 'Upload Postman/OpenAPI JSON or add endpoints for assignees to test and tick off.'}
              </p>
            </div>

            {!isRestrictedEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSampleApiJson}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  title="Download JSON sample format"
                >
                  <Download className="w-3 h-3" />
                  <span>Sample JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualAdd(!showManualAdd)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Endpoint</span>
                </button>
              </div>
            )}
          </div>

          {/* JSON File Upload Dropzone */}
          {!isRestrictedEdit && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand-400 dark:hover:border-brand-600 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer text-center transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Click to upload JSON file (Postman Collection, Swagger/OpenAPI, or Endpoint Array)
                </p>
                <p className="text-[11px] text-zinc-400">
                  Automatically transforms your API collection into an interactive todo checklist
                </p>
              </div>
            </div>
          )}

          {/* Manual Add Form */}
          {!isRestrictedEdit && showManualAdd && (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5 animate-in fade-in-50 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <span>Add API Endpoint Manually</span>
                <button
                  type="button"
                  onClick={() => setShowManualAdd(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="CUSTOM">OTHER</option>
                </select>

                <input
                  type="text"
                  placeholder="/api/v1/resource"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  className="sm:col-span-3 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Summary / Title (e.g., Test endpoint with invalid payload)"
                  value={newEndpointTitle}
                  onChange={(e) => setNewEndpointTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <Button type="button" size="sm" onClick={handleAddManualItem}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Checklist Items Preview List */}
          {checklist.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {checklist.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.method && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getMethodBadgeClass(
                          item.method
                        )}`}
                      >
                        {item.method}
                      </span>
                    )}
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
                      {item.endpoint || item.title}
                    </span>
                    {item.endpoint && item.title && item.title !== item.endpoint && (
                      <span className="text-[11px] text-zinc-400 truncate">
                        ({item.title})
                      </span>
                    )}
                  </div>

                  {!isRestrictedEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : isRestrictedEdit ? (
            <p className="text-xs text-zinc-400 italic py-1">No API checklist items attached to this task.</p>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading}>
            {task ? 'Update Task' : 'Create & Assign Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
