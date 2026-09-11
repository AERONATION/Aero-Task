import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/types/user';
import { Check, ChevronDown, Search, X, User as UserIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MultiUserSelectProps {
  label?: string;
  users: UserProfile[];
  selectedUids: string[];
  onChange: (uids: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export const MultiUserSelect: React.FC<MultiUserSelectProps> = ({
  label,
  users,
  selectedUids = [],
  onChange,
  placeholder = 'Select assignees...',
  error,
  helperText,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUsers = users.filter((u) => selectedUids.includes(u.uid));

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(query);
    const emailMatch = u.email?.toLowerCase().includes(query);
    const teamMatch = u.team?.toLowerCase().includes(query);
    return nameMatch || emailMatch || teamMatch;
  });

  const toggleUser = (uid: string) => {
    if (selectedUids.includes(uid)) {
      onChange(selectedUids.filter((id) => id !== uid));
    } else {
      onChange([...selectedUids, uid]);
    }
  };

  const removeUser = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedUids.filter((id) => id !== uid));
  };

  const selectAll = () => {
    onChange(users.map((u) => u.uid));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="w-full space-y-1.5 text-left" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            {label}
          </label>
          {users.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-brand-600 dark:text-brand-400">
              <button
                type="button"
                onClick={selectAll}
                className="hover:underline"
              >
                Select All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }
        }}
        className={cn(
          'min-h-[42px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 cursor-pointer',
          'dark:border-zinc-800 dark:bg-zinc-900 dark:text-white',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
          disabled && 'cursor-not-allowed bg-zinc-50 opacity-75 dark:bg-zinc-800',
          error && 'border-rose-500',
          'transition-all duration-150 flex items-center justify-between gap-2'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedUsers.length === 0 ? (
            <span className="text-zinc-400 text-xs py-1">{placeholder}</span>
          ) : (
            selectedUsers.map((u) => (
              <span
                key={u.uid}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 text-xs font-medium"
              >
                <span className="w-4 h-4 rounded-full bg-brand-200 dark:bg-brand-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {u.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="truncate max-w-[120px]">{u.name}</span>
                <button
                  type="button"
                  onClick={(e) => removeUser(u.uid, e)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
          {selectedUsers.length > 0 && (
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {selectedUsers.length}
            </span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
            {/* Search filter inside dropdown */}
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, department..."
                className="w-full text-xs bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch('');
                  }}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto p-1 divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {filteredUsers.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-400">
                  No team members match "{search}"
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUids.includes(u.uid);
                  return (
                    <div
                      key={u.uid}
                      onClick={() => toggleUser(u.uid)}
                      className={cn(
                        'flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors',
                        isSelected
                          ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {u.name?.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{u.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 truncate">
                            <span>{u.email}</span>
                            {u.team && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{u.team}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'border-zinc-300 dark:border-zinc-700'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </div>
  );
};
