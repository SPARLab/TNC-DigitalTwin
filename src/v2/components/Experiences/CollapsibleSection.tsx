// ============================================================================
// CollapsibleSection — a titled block that expands and collapses.
//
// Same behavior as the alerts panel on the monitoring page and the legend
// widgets on the explore page: a chevron header toggles the body.
//
//   section  stacked panel section with a top border (right-hand panels)
//   card     its own bordered card with a gray header bar (map overlays)
//   inline   plain small heading inside other content
// ============================================================================

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Variant = 'section' | 'card' | 'inline';

interface CollapsibleSectionProps {
  id?: string;
  title: ReactNode;
  /** Muted text beside the title, shown whether open or closed. */
  hint?: ReactNode;
  defaultOpen?: boolean;
  variant?: Variant;
  /**
   * Keep the body in the DOM while collapsed. Needed when something mounts into
   * it (for example an ArcGIS widget) and must not be torn down.
   */
  keepMounted?: boolean;
  /** Classes for the outer element. */
  className?: string;
  /** Classes added to the body. */
  bodyClassName?: string;
  children: ReactNode;
}

const WRAPPER: Record<Variant, string> = {
  section: 'border-t border-gray-200',
  card: 'flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white',
  inline: '',
};

const HEADER: Record<Variant, string> = {
  section:
    'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-50',
  card: 'bg-gray-50 px-2.5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100',
  inline:
    'py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700',
};

const BODY: Record<Variant, string> = {
  section: 'px-3 pb-3',
  card: 'min-h-0 flex-1 px-2.5 py-2',
  inline: 'pt-1',
};

export function CollapsibleSection({
  id,
  title,
  hint,
  defaultOpen = true,
  variant = 'section',
  keepMounted = false,
  className = '',
  bodyClassName = '',
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;
  const bodyId = id ? `${id}-body` : undefined;
  const showBody = open || keepMounted;

  return (
    <div id={id} className={`${WRAPPER[variant]} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={bodyId}
        className={`flex w-full items-center gap-1.5 text-left transition-colors ${HEADER[variant]}`}
      >
        <Chevron className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
        <span className="min-w-0 flex-1 break-words">{title}</span>
        {hint && (
          <span className="min-w-0 max-w-[45%] truncate text-[10px] font-normal normal-case tracking-normal text-gray-500">
            {hint}
          </span>
        )}
      </button>
      {showBody && (
        <div id={bodyId} className={`${BODY[variant]} ${bodyClassName} ${open ? '' : 'hidden'}`}>
          {children}
        </div>
      )}
    </div>
  );
}
