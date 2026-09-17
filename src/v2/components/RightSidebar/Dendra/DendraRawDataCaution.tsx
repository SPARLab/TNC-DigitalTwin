// ============================================================================
// Shared caution that Dendra readings are raw / unscrubbed sensor output.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface DendraRawDataCautionProps {
  id: string;
  /**
   * `banner` — one-line collapsible strip (overview).
   * `compact` — always-visible short note (charts).
   * `full` — expanded callout (legacy).
   */
  variant?: 'banner' | 'compact' | 'full';
  className?: string;
}

export function DendraRawDataCaution({
  id,
  variant = 'full',
  className = '',
}: DendraRawDataCautionProps) {
  const [expanded, setExpanded] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Keep expanded banner clear of the sticky Browse footer.
  useEffect(() => {
    if (!expanded || variant !== 'banner') return;
    const node = bannerRef.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, variant]);

  if (variant === 'compact') {
    return (
      <p
        id={id}
        className={`flex items-start gap-1.5 text-[11px] leading-snug text-amber-800 ${className}`}
      >
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" aria-hidden />
        <span>
          Raw sensor data — readings may include misfires or errors that have not been scrubbed.
          Use with caution.
        </span>
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        ref={bannerRef}
        id={id}
        className={`scroll-mb-24 rounded-md border border-amber-200 bg-amber-50 ${className}`}
      >
        <button
          id={`${id}-toggle`}
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-amber-950 hover:bg-amber-100/60"
          aria-expanded={expanded}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
          <span className="min-w-0 flex-1 font-medium">Raw, unvalidated sensor data</span>
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-amber-700" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-amber-700" />}
        </button>
        {expanded && (
          <p id={`${id}-body`} className="border-t border-amber-200/80 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900/90">
            These streams are published as collected from field instruments. Sensor misfires,
            outliers, and other errors may not have been scrubbed or cleaned yet. Interpret
            values with caution before drawing conclusions or publishing results.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      id={id}
      role="note"
      className={`flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">Raw, unvalidated sensor data</p>
        <p className="text-xs leading-relaxed text-amber-900/90">
          These streams are published as collected from field instruments. Sensor misfires,
          outliers, and other errors may not have been scrubbed or cleaned yet. Interpret
          values with caution before drawing conclusions or publishing results.
        </p>
      </div>
    </div>
  );
}
