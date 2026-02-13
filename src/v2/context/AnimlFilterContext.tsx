// ============================================================================
// AnimlFilterContext — Central ANiML camera trap data + filter state
// Fetches deployments + grouped counts from the ANiML MapServer.
// LAZY: data is NOT fetched on mount. Call warmCache() to trigger the fetch.
// Provides: filter state, deployments, animal counts, countLookups, cache.
// Shared between: floating legend widget, right sidebar, map layer.
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
  hasFilter: boolean;

  // Filter actions
  toggleAnimal: (label: string) => void;
  selectAll: () => void;
  clearAll: () => void;

  // Derived helpers
  /** Get filtered image count for a deployment. Uses countLookups when available. */
  getFilteredCountForDeployment: (deploymentId: number) => number | null;
  /** Get deployments that match the current animal filter. null = all match. */
  matchingDeploymentIds: Set<number> | null;

  // Cache lifecycle
  /** Trigger data fetch. Idempotent — no-op if already fetched or in-flight. */
  warmCache: () => void;
}

const AnimlFilterContext = createContext<AnimlFilterContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AnimlFilterProvider({ children }: { children: ReactNode }) {
  // Filter state
  const [selectedAnimals, setSelectedAnimals] = useState<Set<string>>(new Set());

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

  // ── Filter actions ───────────────────────────────────────────────────────

  const toggleAnimal = useCallback((label: string) => {
    setSelectedAnimals(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    () => setSelectedAnimals(prev => (prev.size === 0 ? prev : new Set())),
    [],
  );
  const clearAll = useCallback(
    () => setSelectedAnimals(prev => (prev.size === 0 ? prev : new Set())),
    [],
  );
  const hasFilter = selectedAnimals.size > 0;

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

  // Compute total image count from grouped counts
  const totalImageCount = useMemo(
    () => groupedCounts.reduce((sum, gc) => sum + gc.observation_count, 0),
    [groupedCounts],
  );

  // ── Derived filter helpers ──────────────────────────────────────────────

  /** Get the set of deployment IDs matching the current animal filter. null = all. */
  const matchingDeploymentIds = useMemo(() => {
    if (!hasFilter || !countLookups) return null;
    const ids = new Set<number>();
    for (const label of selectedAnimals) {
      const depIds = countLookups.deploymentsByLabel.get(label);
      if (depIds) depIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [hasFilter, selectedAnimals, countLookups]);

  /** Get filtered count for a specific deployment. Returns null if lookups not ready. */
  const getFilteredCountForDeployment = useCallback(
    (deploymentId: number): number | null => {
      if (!countLookups) return null;
      if (!hasFilter) return countLookups.countsByDeployment.get(deploymentId) ?? 0;

      // Sum counts for selected animals at this deployment
      let total = 0;
      for (const label of selectedAnimals) {
        const key = `${deploymentId}:${label}`;
        total += countLookups.countsByDeploymentAndLabel.get(key) ?? 0;
      }
      return total;
    },
    [countLookups, hasFilter, selectedAnimals],
  );

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
        selectedAnimals, hasFilter,
        toggleAnimal, selectAll, clearAll,
        getFilteredCountForDeployment, matchingDeploymentIds,
        warmCache,
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
