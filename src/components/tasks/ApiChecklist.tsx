import React, { useState } from 'react';
import { ChecklistItem } from '@/types/task';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Search,
  Filter,
  Trash2,
  Code2,
  CheckCheck,
  AlertCircle,
  FileJson,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ApiChecklistProps {
  items: ChecklistItem[];
  onToggleItem?: (itemId: string, completed: boolean) => Promise<void> | void;
  onUpdateItems?: (items: ChecklistItem[]) => Promise<void> | void;
  readOnly?: boolean;
  canEditStructure?: boolean;
  title?: string;
  description?: string;
}

export const getMethodBadgeClass = (method?: string) => {
  const m = method?.toUpperCase();
  switch (m) {
    case 'GET':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60';
    case 'POST':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60';
    case 'PUT':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60';
    case 'PATCH':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/60';
    case 'DELETE':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
  }
};

export const ApiChecklist: React.FC<ApiChecklistProps> = ({
  items = [],
  onToggleItem,
  onUpdateItems,
  readOnly = false,
  canEditStructure = false,
  title = 'API Testing Checklist',
  description = 'Interactive test items and endpoint verification checklist for assignees',
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newMethod, setNewMethod] = useState('GET');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [togglingIds, setTogglingIds] = useState<Record<string, boolean>>({});

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = items.filter((item) => {
    // Status filter
    if (filter === 'pending' && item.completed) return false;
    if (filter === 'completed' && !item.completed) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchEndpoint = item.endpoint?.toLowerCase().includes(q);
      const matchMethod = item.method?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchEndpoint && !matchMethod && !matchDesc) return false;
    }

    return true;
  });

  const handleToggle = async (item: ChecklistItem) => {
    if (readOnly || !onToggleItem) return;
    setTogglingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      await onToggleItem(item.id, !item.completed);
    } finally {
      setTogglingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newEndpoint.trim()) return;

    const newItem: ChecklistItem = {
      id: 'chk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      title: newTitle.trim() || `${newMethod} ${newEndpoint.trim()}`,
      method: newMethod,
      endpoint: newEndpoint.trim() || undefined,
      description: newDescription.trim() || undefined,
      completed: false,
    };

    if (onUpdateItems) {
      onUpdateItems([...items, newItem]);
    }

    setNewTitle('');
    setNewEndpoint('');
    setNewDescription('');
    setIsAddingItem(false);
  };

  const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateItems) {
      onUpdateItems(items.filter((i) => i.id !== itemId));
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-5 text-left">
      {/* Header & Progress Summary */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {completedCount}/{totalCount} Done
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
            </div>
          </div>

          {canEditStructure && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddingItem(!isAddingItem)}
            >
              Add Endpoint
            </Button>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        {totalCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                {progressPercent === 100 ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                )}
                <span>Testing Velocity</span>
              </span>
              <span className={cn(
                'font-mono',
                progressPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'
              )}>
                {progressPercent}% Complete
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Manual Item Addition Form (collapsible) */}
      {isAddingItem && (
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-3 animate-in fade-in-50 duration-150"
        >
          <div className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center justify-between">
            <span>Add New API / Todo Checklist Item</span>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-zinc-400 hover:text-zinc-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-1">
              <select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="CUSTOM">OTHER</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Endpoint route (e.g. /api/v1/auth/register)"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Descriptive title (e.g. Test user registration with valid email)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <input
              type="text"
              placeholder="Acceptance criteria / description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingItem(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add to Checklist
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Search Bar */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              Tested ({completedCount})
            </button>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Filter endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
              className="py-1.5 text-xs"
            />
          </div>
        </div>
      )}

      {/* Checklist Items List */}
      {items.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
          <FileJson className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            No API checklist items added yet
          </p>
          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
            Upload a JSON file (Postman Collection, Swagger/OpenAPI, or endpoint list) or manually add endpoints to track testing progress.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-6 text-center text-xs text-zinc-400">
          No endpoints match the active filter or search.
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isToggling = togglingIds[item.id];

            return (
              <div
                key={item.id}
                onClick={() => !readOnly && handleToggle(item)}
                className={cn(
                  'p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group',
                  !readOnly ? 'cursor-pointer' : 'cursor-default',
                  item.completed
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-300'
                    : 'bg-zinc-50/60 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                )}
              >
                {/* Checkbox and Content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    disabled={readOnly || isToggling}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(item);
                    }}
                    className={cn(
                      'mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0',
                      item.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600 group-hover:border-brand-500 bg-white dark:bg-zinc-900'
                    )}
                  >
                    {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Method Badge + Endpoint + Title */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.method && (
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0',
                            getMethodBadgeClass(item.method)
                          )}
                        >
                          {item.method}
                        </span>
                      )}

                      {item.endpoint && (
                        <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-md">
                          {item.endpoint}
                        </span>
                      )}

                      {item.title && item.title !== item.endpoint && (
                        <span className={cn(
                          'text-xs font-medium text-zinc-700 dark:text-zinc-300',
                          item.completed && 'line-through text-zinc-400 dark:text-zinc-500'
                        )}>
                          {item.title}
                        </span>
                      )}
                    </div>

                    {/* Description if present */}
                    {item.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Who completed it details */}
                    {item.completed && item.completedByName && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 pt-0.5">
                        <CheckCheck className="w-3 h-3" />
                        <span>Verified & tested by {item.completedByName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button (if allowed to edit structure) */}
                {canEditStructure && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-opacity shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
