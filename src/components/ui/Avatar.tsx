import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  colorClass?: string; // custom bg/text color override
}

const SIZE_MAP = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
};

/**
 * Universal Avatar component.
 * - Shows Google/uploaded profile photo if available
 * - Falls back to first letter of name with gradient bg
 * - Handles broken image gracefully
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  colorClass,
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = name
    ? name.trim().charAt(0).toUpperCase()
    : '?';

  const defaultColorClass =
    colorClass ||
    'bg-gradient-to-br from-indigo-400 to-violet-500 text-white';

  const sizeClass = SIZE_MAP[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        onError={() => setImgError(true)}
        className={cn(
          'rounded-full object-cover shrink-0',
          sizeClass,
          className
        )}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold shrink-0 select-none',
        sizeClass,
        defaultColorClass,
        className
      )}
      title={name || ''}
    >
      {initial}
    </div>
  );
};
