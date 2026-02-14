// ============================================================================
// AnimlFilterContext — Central ANiML camera trap data + filter state
// Fetches deployments + grouped counts from the ANiML MapServer.
// LAZY: data is NOT fetched on mount. Call warmCache() to trigger the fetch.
// Provides: filter state, deployments, animal counts, countLookups, cache.
// Shared between: floating legend widget, right sidebar, map layer.
//
// Iteration 2: Multi-dimensional filtering (species × cameras × date range).
//   - selectedAnimals: species filter (empty = no restriction)
//   - selectedCameras: camera/deployment filter (empty = no restriction)
//   - startDate / endDate: date range filter (null = no restriction)
//   - filteredImageCount: instant count from countLookups (no API call)
//   - getFilteredCountForSpecies: per-species count reflecting camera filter
// ============================================================================

import {
  createContext, useContext, useState, useCallback,
  useEffect, useMemo, useRef, type ReactNode,
} from 'react';
import {
  animlService,
  type AnimlDeployment,
  type AnimlAnimalTag,
  type AnimlGroupedCount,
  type AnimlCountLookups,
} from '../../services/animlService';

// ── Public types ─────────────────────────────────────────────────────────────

export interface AnimlFilterContextValue {
  // Cache / data
  deployments: AnimlDeployment[];
  animalTags: AnimlAnimalTag[];
  groupedCounts: AnimlGroupedCount[];
  countLookups: AnimlCountLookups | null;
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;
  totalImageCount: number;

  // Filters
  selectedAnimals: Set<string>;
  selectedCameras: Set<number>;
  startDate: string | null;    // YYYY-MM-DD or null
  endDate: string | null;      // YYYY-MM-DD or null
  hasFilter: boolean;          // species filter active (backward compat)
  hasCameraFilter: boolean;    // camera filter active
  hasDateFilter: boolean;      // date range filter active
  hasAnyFilter: boolean;       // any filter active

  // Filter actions — species
  toggleAnimal: (label: string) => void;
  setSelectedAnimals: (labels: Set<string>) => void;
  selectAll: () => void;
  clearAll: () => void;
  selectAllAnimals: () => void;

  // Filter actions — cameras
  toggleCamera: (deploymentId: number) => void;
  setSelectedCameras: (deploymentIds: Set<number>) => void;
  clearCameras: () => void;
  selectAllCameras: () => void;

  // Filter actions — date range
  setDateRange: (start: string | null, end: string | null) => void;
  clearDateRange: () => void;

  // Filter actions — combined
  clearFilters: () => void;

  // Derived helpers
  /** Filtered image count for a deployment. Reflects species filter. */
  getFilteredCountForDeployment: (deploymentId: number) => number | null;
  /** Filtered image count for a species label. Reflects camera filter. */
  getFilteredCountForSpecies: (label: string) => number | null;
  /** Deployments matching the current filters. null = all match. */
  matchingDeploymentIds: Set<number> | null;
  /** Total images matching both filters. null if countLookups not ready. */
  filteredImageCount: number | null;
  /** Deployment id currently focused from browse image interactions. */
  focusedDeploymentId: number | null;

  // Cache lifecycle
  /** Trigger data fetch. Idempotent — no-op if already fetched or in-flight. */
  warmCache: () => void;
  /** Focus a deployment for map emphasis/highlight. */
  focusDeployment: (deploymentId: number | null) => void;
  /** Clear focused deployment. */
  clearFocusedDeployment: () => void;
}

const AnimlFilterContext = createContext<AnimlFilterContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AnimlFilterProvider({ children }: { children: ReactNode }) {
  // Filter state
  const [selectedAnimals, setSelectedAnimalsState] = useState<Set<string>>(new Set());
  const [selectedCameras, setSelectedCamerasState] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [focusedDeploymentId, setFocusedDeploymentId] = useState<number | null>(null);

  // Data state
  const [deployments, setDeployments] = useState<AnimlDeployment[]>([]);
  const [animalTags, setAnimalTags] = useState<AnimlAnimalTag[]>([]);
  const [groupedCounts, setGroupedCounts] = useState<AnimlGroupedCount[]>([]);
  const [countLookups, setCountLookups] = useState<AnimlCountLookups | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Cache lifecycle — fetch is lazy, triggered by warmCache()
  const [fetchRequested, setFetchRequested] = useState(false);
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    console.log('[Animl Cache] 🎬 AnimlFilterProvider mounted');
    return () => console.log('[Animl Cache] 💀 AnimlFilterProvider unmounted');
  }, []);

  // ── Filter actions — species ────────────────────────────────────────────

  const toggleAnimal = useCallback((label: string) => {
    setSelectedAnimalsState(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const setSelectedAnimals = useCallback((labels: Set<string>) => {
    setSelectedAnimalsState(new Set(labels));
  }, []);

  const selectAll = useCallback(
    () => setSelectedAnimalsState(prev => (prev.size === 0 ? prev : new Set())),
    [],
  );
  const clearAll = useCallback(
    () => setSelectedAnimalsState(prev => (prev.size === 0 ? prev : new Set())),
    [],
  );

  const selectAllAnimals = useCallback(
    () => setSelectedAnimalsState(new Set(animalTags.map(t => t.label))),
    [animalTags],
  );

  // ── Filter actions — cameras ────────────────────────────────────────────

  const toggleCamera = useCallback((deploymentId: number) => {
    setSelectedCamerasState(prev => {
      const next = new Set(prev);
      if (next.has(deploymentId)) next.delete(deploymentId);
      else next.add(deploymentId);
      return next;
    });
  }, []);

  const setSelectedCameras = useCallback((deploymentIds: Set<number>) => {
    setSelectedCamerasState(new Set(deploymentIds));
  }, []);

  const clearCameras = useCallback(
    () => setSelectedCamerasState(prev => (prev.size === 0 ? prev : new Set())),
    [],
  );

  const selectAllCameras = useCallback(
    () => setSelectedCamerasState(new Set(deployments.map(d => d.id))),
    [deployments],
  );

  // ── Filter actions — date range ─────────────────────────────────────────

  const setDateRange = useCallback((start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const clearDateRange = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  // ── Filter actions — combined ───────────────────────────────────────────

  const clearFilters = useCallback(() => {
    setSelectedAnimalsState(prev => (prev.size === 0 ? prev : new Set()));
    setSelectedCamerasState(prev => (prev.size === 0 ? prev : new Set()));
    setStartDate(null);
    setEndDate(null);
    setFocusedDeploymentId(null);
  }, []);

  const focusDeployment = useCallback((deploymentId: number | null) => {
    setFocusedDeploymentId(deploymentId);
  }, []);

  const clearFocusedDeployment = useCallback(() => {
    setFocusedDeploymentId(null);
  }, []);

  // ── Derived booleans ────────────────────────────────────────────────────

  const hasFilter = selectedAnimals.size > 0;
  const hasCameraFilter = selectedCameras.size > 0;
  const hasDateFilter = startDate !== null && endDate !== null;
  const hasAnyFilter = hasFilter || hasCameraFilter || hasDateFilter;

  // ── Cache warming ────────────────────────────────────────────────────────

  const warmCache = useCallback(() => {
    if (fetchStartedRef.current) {
      console.log('[Animl Cache] warmCache() called but already fetched/fetching');
      return;
    }
    console.log('[Animl Cache] 🔥 warmCache() triggered — starting fetch');
    fetchStartedRef.current = true;
    setLoading(true);
    setFetchRequested(true);
  }, []);

  // Total image count from grouped counts
  const totalImageCount = useMemo(
    () => groupedCounts.reduce((sum, gc) => sum + gc.observation_count, 0),
    [groupedCounts],
  );

  // ── Derived filter helpers ──────────────────────────────────────────────

  /** Deployments matching all active filters. null = all match. */
  const matchingDeploymentIds = useMemo(() => {
    if (!hasAnyFilter) return null;

    // Species filter → deployments that have at least one selected species
    let speciesMatch: Set<number> | null = null;
    if (hasFilter && countLookups) {
      speciesMatch = new Set<number>();
      for (const label of selectedAnimals) {
        const depIds = countLookups.deploymentsByLabel.get(label);
        if (depIds) depIds.forEach(id => speciesMatch!.add(id));
      }
    }

    // Camera filter → explicitly selected deployments
    const cameraMatch = hasCameraFilter ? selectedCameras : null;

    // Intersect when both active
    if (speciesMatch && cameraMatch) {
      const intersection = new Set<number>();
      for (const id of cameraMatch) {
        if (speciesMatch.has(id)) intersection.add(id);
      }
      return intersection;
    }

    return speciesMatch ?? cameraMatch ?? null;
  }, [hasAnyFilter, hasFilter, hasCameraFilter, selectedAnimals, selectedCameras, countLookups]);

  /** Filtered image count for one deployment. Reflects species filter. */
  const getFilteredCountForDeployment = useCallback(
    (deploymentId: number): number | null => {
      if (!countLookups) return null;
      if (!hasFilter) return countLookups.countsByDeployment.get(deploymentId) ?? 0;

      let total = 0;
      for (const label of selectedAnimals) {
        const key = `${deploymentId}:${label}`;
        total += countLookups.countsByDeploymentAndLabel.get(key) ?? 0;
      }
      return total;
    },
    [countLookups, hasFilter, selectedAnimals],
  );

  /** Filtered image count for one species label. Reflects camera filter. */
  const getFilteredCountForSpecies = useCallback(
    (label: string): number | null => {
      if (!countLookups) return null;
      if (!hasCameraFilter) return countLookups.countsByLabel.get(label) ?? 0;

      let total = 0;
      for (const depId of selectedCameras) {
        total += countLookups.countsByDeploymentAndLabel.get(`${depId}:${label}`) ?? 0;
      }
      return total;
    },
    [countLookups, hasCameraFilter, selectedCameras],
  );

  /** Total images matching both filter dimensions. null if countLookups not ready. */
  const filteredImageCount = useMemo((): number | null => {
    if (!countLookups) return null;
    if (!hasAnyFilter) return totalImageCount;

    // Species only
    if (hasFilter && !hasCameraFilter) {
      let total = 0;
      for (const label of selectedAnimals) {
        total += countLookups.countsByLabel.get(label) ?? 0;
      }
      return total;
    }

    // Cameras only
    if (!hasFilter && hasCameraFilter) {
      let total = 0;
      for (const depId of selectedCameras) {
        total += countLookups.countsByDeployment.get(depId) ?? 0;
      }
      return total;
    }

    // Both — intersection
    let total = 0;
    for (const depId of selectedCameras) {
      for (const label of selectedAnimals) {
        total += countLookups.countsByDeploymentAndLabel.get(`${depId}:${label}`) ?? 0;
      }
    }
    return total;
  }, [countLookups, selectedAnimals, selectedCameras, hasFilter, hasCameraFilter, hasAnyFilter, totalImageCount]);

  // ── Fetch data when warmCache() is called ────────────────────────────────

  useEffect(() => {
    if (!fetchRequested) return;

    console.log('[Animl Cache] ⏳ Fetch effect running — about to call API');
    let cancelled = false;

    async function fetchData() {
      const startTime = performance.now();
      setLoading(true);
      setError(null);

      try {
        console.log('[Animl Cache] 📡 Fetching deployments + animal category counts...');

        // Phase 1: Fetch deployments and animal tags (fast — makes UI usable)
        const [deps, tags] = await Promise.all([
          animlService.queryDeploymentsCached(),
          animlService.getAnimalCategoryCountsCached(),
        ]);

        if (cancelled) return;

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(
          `[Animl Cache] ✅ Phase 1: ${deps.length} deployments, ${tags.length} animal categories in ${elapsed}s`,
        );

        setDeployments(deps);
        setAnimalTags(tags);

        // Build simplified grouped counts from animal tags for the legend
        const counts: AnimlGroupedCount[] = tags.map(tag => ({
          deployment_id: 0,
          label: tag.label,
          observation_count: tag.totalObservations,
        }));
        setGroupedCounts(counts);
        setDataLoaded(true);
        setLoading(false);

        // Phase 2: Fetch detailed grouped counts for countLookups (background)
        console.log('[Animl Cache] 📡 Phase 2: Fetching grouped counts for countLookups...');
        const gcResult = await animlService.getObservationCountsGroupedCached();

        if (cancelled) return;

        const lookups = animlService.buildCountLookups(
          gcResult.groupedCounts,
          gcResult.uniqueImageCountsByDeployment,
        );
        setCountLookups(lookups);

        const totalElapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Animl Cache] ✅ Phase 2: countLookups ready in ${totalElapsed}s total`);
      } catch (err) {
        if (cancelled) return;
        console.error('[Animl Cache] ❌ Fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ANiML data');
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [fetchRequested]);

  // ── Context value ────────────────────────────────────────────────────────

  return (
    <AnimlFilterContext.Provider
      value={{
        deployments, animalTags, groupedCounts, countLookups,
        loading, error, dataLoaded, totalImageCount,
        selectedAnimals, selectedCameras, startDate, endDate,
        hasFilter, hasCameraFilter, hasDateFilter, hasAnyFilter,
        toggleAnimal, setSelectedAnimals, selectAll, clearAll, selectAllAnimals,
        toggleCamera, setSelectedCameras, clearCameras, selectAllCameras,
        setDateRange, clearDateRange, clearFilters,
        getFilteredCountForDeployment, getFilteredCountForSpecies,
        matchingDeploymentIds, filteredImageCount, focusedDeploymentId,
        warmCache, focusDeployment, clearFocusedDeployment,
      }}
    >
      {children}
    </AnimlFilterContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnimlFilter() {
  const ctx = useContext(AnimlFilterContext);
  if (!ctx) throw new Error('useAnimlFilter must be used within AnimlFilterProvider');
  return ctx;
}
