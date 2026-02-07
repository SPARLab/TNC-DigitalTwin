// ============================================================================
// WidgetShell — Shared floating container for Map Layers + Bookmarked Items
// ============================================================================

import type { ReactNode } from 'react';

interface WidgetShellProps {
  id: string;
  position: 'top-left' | 'top-right';
  children: ReactNode;
  className?: string;
}

/** Floating widget container with shadow and backdrop blur */
export function WidgetShell({ id, position, children, className = '' }: WidgetShellProps) {
  const positionClasses = position === 'top-left'
    ? 'left-4 top-4'
    : 'right-[416px] top-4'; // offset for 400px right sidebar + 16px gap

  return (
    <div
      id={id}
      role="region"
      className={`absolute ${positionClasses} w-[320px] bg-white rounded-xl z-40 ${className}`}
      style={{
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </div>
  );
}
