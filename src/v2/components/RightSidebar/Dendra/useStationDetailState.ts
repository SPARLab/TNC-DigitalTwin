import { useEffect, useMemo, useRef, useState } from 'react';
import type { DendraSummary } from '../../../services/dendraStationService';

interface UseStationDetailStateOptions {
  stationId: number;
  summaries: DendraSummary[];
  filteredSummaries: DendraSummary[];
  stationHeaderFlashSignal: number;
}

interface UseStationDetailStateResult {
  isHeaderFlashing: boolean;
  selectedDatastreamId: number | null;
  setSelectedDatastreamId: (datastreamId: number | null) => void;
}

export function useStationDetailState({
  stationId,
  summaries,
  filteredSummaries,
  stationHeaderFlashSignal,
}: UseStationDetailStateOptions): UseStationDetailStateResult {
  const [selectedDatastreamId, setSelectedDatastreamId] = useState<number | null>(null);
  const [isHeaderFlashing, setIsHeaderFlashing] = useState(false);
  const prevStationIdRef = useRef<number>(stationId);
  const lastSelectedDatastreamNameRef = useRef<string>('');
  const flashStartTimeoutRef = useRef<number | null>(null);
  const flashEndTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const selectedName = summaries.find(
      (summary) => summary.datastream_id === selectedDatastreamId,
    )?.datastream_name;
    if (selectedName) {
      lastSelectedDatastreamNameRef.current = selectedName;
    }
  }, [summaries, selectedDatastreamId]);

  useEffect(() => {
    const stationChanged = prevStationIdRef.current !== stationId;
    const selectedExistsInFiltered = filteredSummaries.some(
      (summary) => summary.datastream_id === selectedDatastreamId,
    );

    if (selectedDatastreamId != null && selectedExistsInFiltered) {
      prevStationIdRef.current = stationId;
      return;
    }

    if (stationChanged && lastSelectedDatastreamNameRef.current) {
      const matchedByName = filteredSummaries.find(
        (summary) =>
          summary.datastream_name.toLowerCase() === lastSelectedDatastreamNameRef.current.toLowerCase(),
      );
      if (matchedByName) {
        setSelectedDatastreamId(matchedByName.datastream_id);
        prevStationIdRef.current = stationId;
        return;
      }
    }

    setSelectedDatastreamId(null);
    prevStationIdRef.current = stationId;
  }, [stationId, filteredSummaries, selectedDatastreamId]);

  useEffect(() => {
    if (!stationHeaderFlashSignal) return;

    setIsHeaderFlashing(false);
    if (flashStartTimeoutRef.current) window.clearTimeout(flashStartTimeoutRef.current);
    if (flashEndTimeoutRef.current) window.clearTimeout(flashEndTimeoutRef.current);

    // Match EditFilters card cadence: short settle delay, quick pulse, then rest.
    flashStartTimeoutRef.current = window.setTimeout(() => {
      setIsHeaderFlashing(true);
      flashEndTimeoutRef.current = window.setTimeout(() => {
        setIsHeaderFlashing(false);
        flashEndTimeoutRef.current = null;
      }, 220);
      flashStartTimeoutRef.current = null;
    }, 60);
  }, [stationHeaderFlashSignal]);

  useEffect(() => {
    return () => {
      if (flashStartTimeoutRef.current) window.clearTimeout(flashStartTimeoutRef.current);
      if (flashEndTimeoutRef.current) window.clearTimeout(flashEndTimeoutRef.current);
    };
  }, []);

  return useMemo(
    () => ({
      isHeaderFlashing,
      selectedDatastreamId,
      setSelectedDatastreamId,
    }),
    [isHeaderFlashing, selectedDatastreamId],
  );
}
