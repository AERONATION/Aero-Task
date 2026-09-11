import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Task, TaskPriority } from '@/types/task';
import { UserProfile, TEAMS } from '@/types/user';
import { createTask, updateTask } from '@/services/taskService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { toDate } from '@/utils/date';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null; // If provided, edit mode
  users?: UserProfile[]; // Provided in admin mode for assigning
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [team, setTeam] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setAssignedTo(task.assignedTo || '');
      setTeam(task.team || '');

      if (task.deadline) {
        const d = toDate(task.deadline);
        setDeadline(format(d, 'yyyy-MM-dd'));
      }
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo(user?.uid || '');
      setTeam(profile?.team || '');

      // Default deadline to 3 days from now
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 3);
      setDeadline(format(defaultDeadline, 'yyyy-MM-dd'));
    }
  }, [task, isOpen, user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Please enter a task title');
      return;
    }

    if (!deadline) {
      error('Please specify a task deadline');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const deadlineDate = new Date(`${deadline}T23:59:59`);

      if (task) {
        // Edit mode
        await updateTask(
          task.id,
          {
            title: title.trim(),
            description: description.trim(),
            priority,
            deadline: deadlineDate,
            ...(isAdmin && {
              assignedTo: assignedTo || user.uid,
              team: (team as any) || null,
            }),
          },
          user.uid,
          profile?.name || user.displayName || 'User'
        );
        success('Task updated successfully');
      } else {
        // Create mode
        const targetAssigneeUid = isAdmin && assignedTo ? assignedTo : user.uid;
        const targetAssignee = users.find((u) => u.uid === targetAssigneeUid);

        await createTask({
          title: title.trim(),
          description: description.trim(),
          createdBy: user.uid,
          assignedTo: targetAssigneeUid,
          assignedBy: isAdmin && targetAssigneeUid !== user.uid ? user.uid : null,
          team: isAdmin ? ((team as any) || targetAssignee?.team) : profile?.team,
          priority,
          deadline: deadlineDate,
          creatorName: profile?.name || user.displayName || 'Teammate',
        });
        success('Task created successfully');
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
      title={task ? 'Edit Task' : 'Create New Task'}
      description={
        task
          ? 'Update the specifications and schedule for this task.'
          : 'Define a new task, assign priority, and set deadlines.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <Input
          label="Title"
          placeholder="e.g., Implement authentication middleware"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Provide clear instructions, acceptance criteria, or links..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        {isAdmin && users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Select
              label="Assign To"
              value={assignedTo}
              onChange={(e) => {
                const uid = e.target.value;
                setAssignedTo(uid);
                const selectedUser = users.find((u) => u.uid === uid);
                if (selectedUser?.team) {
                  setTeam(selectedUser.team);
                }
              }}
            >
              <option value="">Select team member...</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name} ({u.team || 'No Team'})
                </option>
              ))}
            </Select>

            <Select
              label="Department / Team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">Select department...</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading}>
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
