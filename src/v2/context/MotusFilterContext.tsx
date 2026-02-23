import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { motusService, type MotusBrowseFilters, type MotusSpeciesSummary } from '../../services/motusService';

interface MotusFilterContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  speciesSummaries: MotusSpeciesSummary[];
  browseFilters: Required<MotusBrowseFilters>;
  selectedSpecies: string | null;
  selectedTagId: number | null;
  movementDisclaimer: string;
  playbackStepIndex: number;
  playbackTransitionProgress: number;
  playbackStepLabels: string[];
  playbackSpeed: 0.5 | 1 | 2 | 4;
  isPlaybackPlaying: boolean;
  hasJourneyPlaybackData: boolean;
  warmCache: () => void;
  createLoadingScope: () => () => void;
  refreshSpeciesSummaries: () => Promise<void>;
  setBrowseFilters: (next: Partial<MotusBrowseFilters>) => void;
  setSelectedSpecies: (species: string | null) => void;
  setSelectedTagId: (tagId: number | null) => void;
  setMovementDisclaimer: (message: string) => void;
  setPlaybackStepIndex: (index: number) => void;
  setPlaybackTransitionProgress: (progress: number) => void;
  setPlaybackStepLabels: (labels: string[]) => void;
  setPlaybackSpeed: (speed: 0.5 | 1 | 2 | 4) => void;
  setIsPlaybackPlaying: (playing: boolean) => void;
}

const DEFAULT_BROWSE_FILTERS: Required<MotusBrowseFilters> = {
  startDate: '',
  endDate: '',
  minHitCount: 1,
  minMotusFilter: 1,
};

const MotusFilterContext = createContext<MotusFilterContextValue | null>(null);

export function MotusFilterProvider({ children }: { children: ReactNode }) {
  const [isWarmLoading, setIsWarmLoading] = useState(false);
  const [loadScopeCount, setLoadScopeCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesSummaries, setSpeciesSummaries] = useState<MotusSpeciesSummary[]>([]);
  const [browseFilters, setBrowseFiltersState] = useState<Required<MotusBrowseFilters>>(DEFAULT_BROWSE_FILTERS);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [movementDisclaimer, setMovementDisclaimer] = useState(
    'Choose a preserve-eligible tag to render its full inferred journey across receiver stations.',
  );
  const [playbackStepIndex, setPlaybackStepIndexState] = useState(0);
  const [playbackTransitionProgress, setPlaybackTransitionProgressState] = useState(0);
  const [playbackStepLabels, setPlaybackStepLabelsState] = useState<string[]>(['Journey start']);
  const [playbackSpeed, setPlaybackSpeedState] = useState<0.5 | 1 | 2 | 4>(1);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const inFlightRef = useRef(false);
  const loading = isWarmLoading || loadScopeCount > 0;

  const createLoadingScope = useCallback(() => {
    let closed = false;
    setLoadScopeCount((prev) => prev + 1);

    return () => {
      if (closed) return;
      closed = true;
      setLoadScopeCount((prev) => Math.max(0, prev - 1));
    };
  }, []);

  const refreshSpeciesSummaries = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsWarmLoading(true);
    setError(null);
    try {
      const summaries = await motusService.getSpeciesSummaries(browseFilters);
      setSpeciesSummaries(summaries);
      setDataLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load MOTUS species summaries';
      setError(message);
    } finally {
      inFlightRef.current = false;
      setIsWarmLoading(false);
    }
  }, [browseFilters]);

  const warmCache = useCallback(() => {
    if (dataLoaded || inFlightRef.current) return;
    void refreshSpeciesSummaries();
  }, [dataLoaded, refreshSpeciesSummaries]);

  const setBrowseFilters = useCallback((next: Partial<MotusBrowseFilters>) => {
    setBrowseFiltersState((prev) => ({
      startDate: next.startDate ?? prev.startDate,
      endDate: next.endDate ?? prev.endDate,
      minHitCount: typeof next.minHitCount === 'number' ? Math.max(0, Math.floor(next.minHitCount)) : prev.minHitCount,
      minMotusFilter: typeof next.minMotusFilter === 'number' ? next.minMotusFilter : prev.minMotusFilter,
    }));
  }, []);

  const setPlaybackStepIndex = useCallback((index: number) => {
    setPlaybackStepIndexState((previous) => {
      const maxIndex = Math.max(0, playbackStepLabels.length - 1);
      if (!Number.isFinite(index)) return previous;
      return Math.max(0, Math.min(maxIndex, Math.floor(index)));
    });
  }, [playbackStepLabels.length]);

  const setPlaybackTransitionProgress = useCallback((progress: number) => {
    if (!Number.isFinite(progress)) return;
    setPlaybackTransitionProgressState(Math.max(0, Math.min(1, progress)));
  }, []);

  const setPlaybackStepLabels = useCallback((labels: string[]) => {
    const normalized = labels.length > 0 ? labels : ['Journey start'];
    setPlaybackStepLabelsState(normalized);
    setPlaybackStepIndexState(Math.max(0, normalized.length - 1));
    setPlaybackTransitionProgressState(0);
    setIsPlaybackPlaying(false);
  }, []);

  const setPlaybackSpeed = useCallback((speed: 0.5 | 1 | 2 | 4) => {
    setPlaybackSpeedState(speed);
  }, []);

  const value = useMemo<MotusFilterContextValue>(
    () => ({
      loading,
      dataLoaded,
      error,
      speciesSummaries,
      browseFilters,
      selectedSpecies,
      selectedTagId,
      movementDisclaimer,
      playbackStepIndex,
      playbackTransitionProgress,
      playbackStepLabels,
      playbackSpeed,
      isPlaybackPlaying,
      hasJourneyPlaybackData: playbackStepLabels.length > 1,
      warmCache,
      createLoadingScope,
      refreshSpeciesSummaries,
      setBrowseFilters,
      setSelectedSpecies,
      setSelectedTagId,
      setMovementDisclaimer,
      setPlaybackStepIndex,
      setPlaybackTransitionProgress,
      setPlaybackStepLabels,
      setPlaybackSpeed,
      setIsPlaybackPlaying,
    }),
    [
      loading,
      dataLoaded,
      error,
      speciesSummaries,
      browseFilters,
      selectedSpecies,
      selectedTagId,
      movementDisclaimer,
      playbackStepIndex,
      playbackTransitionProgress,
      playbackStepLabels,
      playbackSpeed,
      isPlaybackPlaying,
      warmCache,
      createLoadingScope,
      refreshSpeciesSummaries,
      setBrowseFilters,
      setPlaybackSpeed,
      setPlaybackStepIndex,
      setPlaybackTransitionProgress,
      setPlaybackStepLabels,
    ],
  );

  return <MotusFilterContext.Provider value={value}>{children}</MotusFilterContext.Provider>;
}

export function useMotusFilter() {
  const context = useContext(MotusFilterContext);
  if (!context) throw new Error('useMotusFilter must be used within MotusFilterProvider');
  return context;
}
