// ============================================================================
// InfoButton — small "i" button that opens a popover with a short explanation.
// Used in widget title bars in place of always-visible help text.
// ============================================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface InfoButtonProps {
  /** Id prefix for the button and popover. */
  id: string;
  /** Accessible label and tooltip for the button. */
  label: string;
  children: ReactNode;
}

export function InfoButton({ id, label, children }: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={`${id}-button`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className={`rounded p-1 transition-colors ${
          isOpen ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
        }`}
        title={label}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={`${id}-popover`}
      >
        <Info className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          id={`${id}-popover`}
          role="dialog"
          aria-label={label}
          data-no-drag
          className="absolute right-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-2rem)] cursor-default rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-xs leading-relaxed font-normal text-gray-700 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}
