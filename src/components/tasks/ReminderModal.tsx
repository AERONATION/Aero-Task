import React, { useState } from 'react';
import { Task } from '@/types/task';
import { UserProfile } from '@/types/user';
import { sendTaskReminder } from '@/services/taskService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Bell, Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  assignees: UserProfile[];
  onSuccess?: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  task,
  assignees,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const { success, error, info } = useToast();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const senderName = profile?.name || user?.displayName || 'Teammate';
  const targetAssignees = assignees.filter((a) => a.uid !== user?.uid);
  const displayAssignees = targetAssignees.length > 0 ? targetAssignees : assignees;

  const handleSendReminder = async () => {
    if (!user) return;
    setSending(true);
    try {
      const res = await sendTaskReminder(
        task.id,
        user.uid,
        senderName,
        note.trim() || undefined
      );

      if (res.success) {
        success(`Reminder email & notification sent to ${res.sentCount} assignee${res.sentCount > 1 ? 's' : ''}!`);
        if (onSuccess) onSuccess();
        onClose();
        setNote('');
      } else {
        error(res.error || 'Failed to send reminder');
      }
    } catch (err: any) {
      console.error('Error sending reminder:', err);
      error(err.message || 'An error occurred while dispatching reminder');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Task Reminder" size="md">
      <div className="space-y-4 text-left">
        {/* Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-3">
          <Bell className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold mb-0.5">Dispatches Email & In-App Alert</p>
            <p className="text-amber-800/80 dark:text-amber-300/80">
              Assigned team members will receive an instant push notification and an HTML reminder email via Resend.
            </p>
          </div>
        </div>

        {/* Task Info */}
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Task Subject
          </p>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {task.title}
          </h4>
        </div>

        {/* Recipients list */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-brand-500" />
            <span>Recipients ({displayAssignees.length})</span>
          </label>
          <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {displayAssignees.length === 0 ? (
              <p className="text-xs text-zinc-400 py-1 text-center">No assigned users found.</p>
            ) : (
              displayAssignees.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-[11px]">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{u.name}</span>
                      <span className="text-[11px] text-zinc-400 ml-1.5">({u.email})</span>
                    </div>
                  </div>
                  {u.team && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {u.team}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Optional Custom Note */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Custom Reminder Message <span className="font-normal text-zinc-400">(Optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Please verify the API test checklist and update the status by 5 PM today."
            rows={3}
            className="w-full text-xs rounded-lg p-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendReminder}
            disabled={sending || displayAssignees.length === 0}
            className="flex items-center gap-1.5"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Reminder Now</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
