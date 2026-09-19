import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamLead } from '@/hooks/useTeamLead';
import { useDepartmentMeetings } from '@/hooks/useMeetings';
import { createMeeting, updateMeeting, deleteMeeting, checkMeetingConflicts } from '@/services/meetingService';
import { Meeting, MeetingInput, RecurringType } from '@/types/meeting';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  Calendar, Plus, Trash2, Edit2, Clock, Users,
  MapPin, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const EMPTY_FORM: Omit<MeetingInput, 'scheduledBy' | 'scheduledByName'> = {
  title: '',
  description: '',
  department: '',
  participants: [],
  participantNames: [],
  date: new Date(),
  startTime: '10:00',
  endTime: '11:00',
  recurring: 'none',
  location: '',
  notes: '',
};

export const TeamLeadMeetings: React.FC = () => {
  const { user, profile } = useAuth();
  const { teamMembers } = useTeamLead();
  const dept = profile?.team || '';
  const { meetings, loading } = useDepartmentMeetings(dept);
  const { success, error: showError, info } = useToast();

  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Compute week dates
  const weekDates = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  // Group meetings by date
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach((m) => {
      const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [meetings]);

  const openCreate = () => {
    setEditingMeeting(null);
    setFormData({ ...EMPTY_FORM, date: new Date(), department: dept });
    setSelectedParticipants([user?.uid || '']);
    setIsModalOpen(true);
  };

  const openEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    const d = meeting.date?.toDate ? meeting.date.toDate() : new Date(meeting.date);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      department: meeting.department || dept,
      participants: meeting.participants,
      participantNames: meeting.participantNames || [],
      date: d,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      recurring: meeting.recurring,
      location: meeting.location || '',
      notes: meeting.notes || '',
    });
    setSelectedParticipants(meeting.participants);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { showError('Title is required'); return; }
    if (!user) return;

    setSaving(true);
    try {
      const dateStr = new Date(formData.date).toISOString().slice(0, 10);

      // Check conflicts for each participant
      const conflicts: string[] = [];
      for (const uid of selectedParticipants) {
        const clash = await checkMeetingConflicts(uid, dateStr, formData.startTime, formData.endTime, editingMeeting?.id);
        if (clash.length > 0) {
          const member = teamMembers.find((m) => m.uid === uid);
          conflicts.push(member?.name || uid);
        }
      }

      if (conflicts.length > 0) {
        info(`⚠️ Time conflict detected for: ${conflicts.join(', ')}. Saving anyway.`);
      }

      const names = selectedParticipants.map(
        (uid) => teamMembers.find((m) => m.uid === uid)?.name || uid
      );

      const input: MeetingInput = {
        ...formData,
        scheduledBy: user.uid,
        scheduledByName: profile?.name || '',
        participants: selectedParticipants,
        participantNames: names,
        date: new Date(formData.date),
      };

      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, input);
        success('Meeting updated successfully');
      } else {
        await createMeeting(input);
        success('Meeting scheduled successfully');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showError(err.message || 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMeeting(deleteTarget.id);
      success('Meeting deleted');
      setDeleteTarget(null);
    } catch (err: any) {
      showError(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const toggleParticipant = (uid: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  };

  const weekLabel = `${weekDates[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" /> Team Meetings
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Schedule and manage team meetings with conflict detection</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Schedule Meeting
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
          {weekDates.map((date) => {
            const isToday = date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
            return (
              <div key={date.toISOString()} className={`py-2 text-center border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 ${isToday ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400'}`}>
                  {DAYS[date.getDay()]}
                </p>
                <p className={`text-lg font-bold leading-tight ${isToday ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-900 dark:text-white'}`}>
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Meeting Cells */}
        <div className="grid grid-cols-7 min-h-[300px]">
          {weekDates.map((date) => {
            const key = date.toISOString().slice(0, 10);
            const dayMeetings = meetingsByDate.get(key) || [];
            const isToday = key === new Date().toISOString().slice(0, 10);
            return (
              <div
                key={key}
                className={`p-2 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 space-y-1.5 ${isToday ? 'bg-violet-50/40 dark:bg-violet-950/10' : ''}`}
              >
                {dayMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 p-1.5 cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors group"
                    onClick={() => openEdit(m)}
                  >
                    <p className="text-[10px] font-semibold text-violet-800 dark:text-violet-200 truncate">{m.title}</p>
                    <p className="text-[9px] text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {formatTime(m.startTime)}
                    </p>
                    <p className="text-[9px] text-violet-500 dark:text-violet-500 flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> {m.participants.length}
                    </p>
                  </div>
                ))}
                {dayMeetings.length === 0 && (
                  <div
                    className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors opacity-0 hover:opacity-100"
                    onClick={() => {
                      setFormData((f) => ({ ...f, date }));
                      openCreate();
                    }}
                  >
                    <Plus className="w-3 h-3 text-zinc-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Meeting List */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">All Department Meetings</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-400">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">No meetings scheduled yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {meetings.map((m) => {
              const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
              return (
                <div key={m.id} className="px-4 py-3 flex items-center gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex flex-col items-center justify-center text-violet-700 dark:text-violet-300 shrink-0">
                    <span className="text-[9px] font-bold uppercase">{d.toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-base font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{m.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(m.startTime)} – {formatTime(m.endTime)}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {m.participants.length} participants
                      </span>
                      {m.location && (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {m.location}
                        </span>
                      )}
                      {m.recurring !== 'none' && (
                        <span className="text-[10px] text-violet-600 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" /> {m.recurring}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.scheduledBy === user?.uid && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(m)} className="p-1.5 text-zinc-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(m)} className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'} maxWidth="lg">
        <div className="space-y-4">
          <Input
            label="Meeting Title *"
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Weekly Sprint Review"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Date *</label>
              <input
                type="date"
                value={new Date(formData.date).toISOString().slice(0, 10)}
                onChange={(e) => setFormData((f) => ({ ...f, date: new Date(e.target.value) }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Recurring</label>
              <Select value={formData.recurring} onChange={(e) => setFormData((f) => ({ ...f, recurring: e.target.value as RecurringType }))}>
                <option value="none">No Recurrence</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <Input
            label="Location / Link"
            value={formData.location || ''}
            onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
            placeholder="Room 3A or https://meet.google.com/..."
          />

          {/* Participants */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Participants ({selectedParticipants.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {teamMembers.map((m) => (
                <label key={m.uid} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(m.uid)}
                    onChange={() => toggleParticipant(m.uid)}
                    className="rounded"
                  />
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
