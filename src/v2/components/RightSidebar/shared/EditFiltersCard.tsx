import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLayers } from '../../../context/LayerContext';

let lastStartedFlashEditFiltersRequest = 0;

interface EditFiltersCardProps {
  id: string;
  children: ReactNode;
}

export function EditFiltersCard({ id, children }: EditFiltersCardProps) {
  const { lastEditFiltersRequest } = useLayers();
  const [isFlashing, setIsFlashing] = useState(false);
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
      }, 180);
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
      className={`rounded-lg border p-3 transition-colors duration-150 ${
        isFlashing
          ? 'border-emerald-400 bg-emerald-200/80'
          : 'border-emerald-200 bg-emerald-50/40'
      }`}
      aria-label="Edit filters"
    >
      <header id={`${id}-header`} className="mb-3">
        <h3
          id={`${id}-title`}
          className="text-xs font-semibold uppercase tracking-wide text-emerald-700"
        >
          Edit Filters
        </h3>
      </header>
      <div id={`${id}-content`} className="space-y-3">
        {children}
      </div>
    </section>
  );
}
