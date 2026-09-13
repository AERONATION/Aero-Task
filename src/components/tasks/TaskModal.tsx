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
  CheckSquare,
  ListTodo,
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

  // Checklist & To-Do builder state
  const [checklistMode, setChecklistMode] = useState<'todo' | 'api'>('todo');
  const [simpleTodoTitle, setSimpleTodoTitle] = useState('');
  const [bulkTodoText, setBulkTodoText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

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

  const handleAddSimpleTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simpleTodoTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: 'chk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      title: simpleTodoTitle.trim(),
      completed: false,
    };

    setChecklist((prev) => [...prev, newItem]);
    setSimpleTodoTitle('');
  };

  const handleAddBulkTodos = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lines = bulkTodoText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d.)\]\s]+/, '')) // strip bullet points/numbering
      .filter(Boolean);

    if (lines.length === 0) {
      error('Please enter at least one to-do item');
      return;
    }

    const newItems: ChecklistItem[] = lines.map((line) => ({
      id: 'chk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      title: line,
      completed: false,
    }));

    setChecklist((prev) => [...prev, ...newItems]);
    setBulkTodoText('');
    setShowBulkAdd(false);
    success(`Added ${newItems.length} to-do items!`);
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

        {/* To-Do & API Checklist Section */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Task To-Do & Checklist ({checklist.length})</span>
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isRestrictedEdit
                  ? 'Attached to-do items and test checklists (view-only).'
                  : 'Assign actionable to-do items or API test endpoints for assignees to tick off.'}
              </p>
            </div>

            {!isRestrictedEdit && (
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setChecklistMode('todo')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    checklistMode === 'todo'
                      ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>To-Do List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistMode('api')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    checklistMode === 'api'
                      ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>API / JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* MODE 1: GENERAL TO-DO LIST BUILDER */}
          {!isRestrictedEdit && checklistMode === 'todo' && (
            <div className="space-y-2.5">
              {/* Quick Single Item Add */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a to-do item and press Add (e.g. Design banner, fix responsive layout)..."
                  value={simpleTodoTitle}
                  onChange={(e) => setSimpleTodoTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSimpleTodo();
                    }
                  }}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleAddSimpleTodo}
                  disabled={!simpleTodoTitle.trim()}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                  className="px-2.5 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  title="Paste multiple items at once"
                >
                  {showBulkAdd ? 'Hide Bulk' : '📋 Bulk Paste'}
                </button>
              </div>

              {/* Bulk Multi-Line Paste Box */}
              {showBulkAdd && (
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2 animate-in fade-in-50 duration-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Paste Multiple To-Do Items (1 per line)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    placeholder={"1. Complete user profile design\n2. Integrate authentication API\n3. Write test cases\n4. Deploy to staging"}
                    value={bulkTodoText}
                    onChange={(e) => setBulkTodoText(e.target.value)}
                    className="w-full text-xs rounded-lg p-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleAddBulkTodos}
                      disabled={!bulkTodoText.trim()}
                    >
                      Add All Lines
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: API & JSON ENDPOINTS BUILDER */}
          {!isRestrictedEdit && checklistMode === 'api' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Upload API schema or manually add HTTP endpoints
                </span>
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
              </div>

              {/* JSON File Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand-400 dark:hover:border-brand-600 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer text-center transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Upload JSON Collection (Postman / Swagger / OpenAPI / Endpoints)
                  </p>
                </div>
              </div>

              {/* Manual Endpoint Form */}
              {showManualAdd && (
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2 animate-in fade-in-50 duration-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    <span>Add API Endpoint</span>
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
                      placeholder="Summary / Title (e.g. Test user registration with invalid email)"
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
            </div>
          )}

          {/* Unified Items Preview List */}
          {checklist.length > 0 ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {checklist.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.method ? (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getMethodBadgeClass(
                          item.method
                        )}`}
                      >
                        {item.method}
                      </span>
                    ) : (
                      <div className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] text-zinc-400">
                        {idx + 1}
                      </div>
                    )}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
                      {item.title || item.endpoint}
                    </span>
                    {item.endpoint && item.title && item.title !== item.endpoint && (
                      <span className="text-[11px] text-zinc-400 font-mono truncate">
                        ({item.endpoint})
                      </span>
                    )}
                  </div>

                  {!isRestrictedEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : isRestrictedEdit ? (
            <p className="text-xs text-zinc-400 italic py-1">No to-do checklist items attached to this task.</p>
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
