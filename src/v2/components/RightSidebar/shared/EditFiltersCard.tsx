import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';

let lastStartedFlashEditFiltersRequest = 0;

interface EditFiltersCardProps {
  id: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function EditFiltersCard({ id, children, collapsible = false, defaultExpanded = true }: EditFiltersCardProps) {
  const { lastEditFiltersRequest } = useLayers();
  const [isFlashing, setIsFlashing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const flashStartTimeoutRef = useRef<number | null>(null);
  const flashEndTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastEditFiltersRequest <= lastStartedFlashEditFiltersRequest) return;
    setIsFlashing(false);
    if (flashStartTimeoutRef.current) window.clearTimeout(flashStartTimeoutRef.current);
    if (flashEndTimeoutRef.current) window.clearTimeout(flashEndTimeoutRef.current);
    const requestToFlash = lastEditFiltersRequest;

    // Keep the card in the resting light-green state briefly after Browse opens,
    // then pulse darker green and return to resting light green.
    flashStartTimeoutRef.current = window.setTimeout(() => {
      if (requestToFlash <= lastStartedFlashEditFiltersRequest) return;
      lastStartedFlashEditFiltersRequest = requestToFlash;
      setIsFlashing(true);
      flashEndTimeoutRef.current = window.setTimeout(() => {
        setIsFlashing(false);
        flashEndTimeoutRef.current = null;
      }, 220);
      flashStartTimeoutRef.current = null;
    }, 60);
  }, [lastEditFiltersRequest]);

  useEffect(() => {
    return () => {
      if (flashStartTimeoutRef.current) window.clearTimeout(flashStartTimeoutRef.current);
      if (flashEndTimeoutRef.current) window.clearTimeout(flashEndTimeoutRef.current);
    };
  }, []);

  return (
    <section
      id={id}
      className={`rounded-lg border transition-colors duration-250 ease-in-out ${
        collapsible ? 'overflow-hidden' : 'overflow-visible'
      } ${
        isFlashing
          ? 'border-emerald-400 bg-emerald-200/80'
          : 'border-emerald-200 bg-emerald-50/40'
      }`}
      aria-label="Edit filters"
    >
      {collapsible ? (
        <>
          <button
            id={`${id}-header`}
            onClick={() => setIsExpanded(prev => !prev)}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-emerald-100/50 transition-colors text-left"
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              : <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            <h3
              id={`${id}-title`}
              className="text-xs font-semibold uppercase tracking-wide text-emerald-700 flex-1"
            >
              Edit Filters
            </h3>
          </button>
          <div
            id={`${id}-body`}
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div id={`${id}-content`} className="p-3 space-y-3 border-t border-emerald-200/50">
                {children}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <header id={`${id}-header`} className="px-3 pt-3 pb-0">
            <h3
              id={`${id}-title`}
              className="text-xs font-semibold uppercase tracking-wide text-emerald-700"
            >
              Edit Filters
            </h3>
          </header>
          <div id={`${id}-content`} className="p-3 pt-3 space-y-3">
            {children}
          </div>
        </>
      )}
    </section>
  );
}
