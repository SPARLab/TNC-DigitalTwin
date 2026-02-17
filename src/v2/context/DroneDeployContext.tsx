import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { fetchDroneImageryByProject, type DroneImageryProject, type DroneImageryMetadata } from '../../services/droneImageryService';

export type DroneSortMode = 'newest' | 'project';

interface DroneDateFilter {
  startDate: string;
  endDate: string;
}

interface DroneDeployContextValue {
  loading: boolean;
  metadataLoading: boolean;
  loadingFlightIds: number[];
  dataLoaded: boolean;
  error: string | null;
  projects: DroneImageryProject[];
  totalFlightCount: number;
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  dateFilter: DroneDateFilter;
  sortMode: DroneSortMode;
  loadedFlightIds: number[];
  opacityByFlightId: Record<number, number>;
  flyToFlightId: number | null;
  selectedFlightId: number | null;
  warmCache: () => void;
  setDateFilter: (_next: DroneDateFilter) => void;
  setSortMode: (_next: DroneSortMode) => void;
  getFlightById: (_flightId: number) => DroneImageryMetadata | null;
  getProjectByFlightId: (_flightId: number) => DroneImageryProject | null;
  isFlightLoaded: (_flightId: number) => boolean;
  isFlightLoading: (_flightId: number) => boolean;
  setFlightLoaded: (_flightId: number, _loaded: boolean) => void;
  setFlightLoading: (_flightId: number, _loading: boolean) => void;
  setFlightOpacity: (_flightId: number, _opacity: number) => void;
  setSelectedFlightId: (_flightId: number | null) => void;
  requestFlyToFlight: (_flightId: number) => void;
  clearFlyToRequest: () => void;
}

const DroneDeployContext = createContext<DroneDeployContextValue | null>(null);

export function DroneDeployProvider({ children }: { children: ReactNode }) {
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<DroneImageryProject[]>([]);
  const [dateFilter, setDateFilterState] = useState<DroneDateFilter>({ startDate: '', endDate: '' });
  const [sortMode, setSortModeState] = useState<DroneSortMode>('newest');
  const [loadedFlightIds, setLoadedFlightIds] = useState<number[]>([]);
  const [loadingFlightIds, setLoadingFlightIds] = useState<number[]>([]);
  const [opacityByFlightId, setOpacityByFlightId] = useState<Record<number, number>>({});
  const [flyToFlightId, setFlyToFlightId] = useState<number | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);
  const inFlightRef = useRef(false);

  const warmCache = useCallback(() => {
    if (inFlightRef.current || dataLoaded) return;
    inFlightRef.current = true;
    setMetadataLoading(true);
    setError(null);

    void fetchDroneImageryByProject()
      .then((nextProjects) => {
        setProjects(nextProjects);
        setDataLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load DroneDeploy metadata');
      })
      .finally(() => {
        inFlightRef.current = false;
        setMetadataLoading(false);
      });
  }, [dataLoaded]);

  const setFlightLoading = useCallback((flightId: number, loading: boolean) => {
    setLoadingFlightIds((prev) => {
      const hasFlight = prev.includes(flightId);
      if (loading && !hasFlight) return [...prev, flightId];
      if (!loading && hasFlight) return prev.filter((id) => id !== flightId);
      return prev;
    });
  }, []);

  const loading = metadataLoading || loadingFlightIds.length > 0;

  const totalFlightCount = useMemo(
    () => projects.reduce((sum, project) => sum + project.imageryLayers.length, 0),
    [projects]
  );

  const dateRangeStart = useMemo(() => {
    if (projects.length === 0) return null;
    return new Date(Math.min(...projects.map((project) => project.dateRangeStart.getTime())));
  }, [projects]);

  const dateRangeEnd = useMemo(() => {
    if (projects.length === 0) return null;
    return new Date(Math.max(...projects.map((project) => project.dateRangeEnd.getTime())));
  }, [projects]);

  const getFlightById = useCallback((flightId: number): DroneImageryMetadata | null => {
    for (const project of projects) {
      const match = project.imageryLayers.find((flight) => flight.id === flightId);
      if (match) return match;
    }
    return null;
  }, [projects]);

  const getProjectByFlightId = useCallback((flightId: number): DroneImageryProject | null => {
    for (const project of projects) {
      if (project.imageryLayers.some((flight) => flight.id === flightId)) {
        return project;
      }
    }
    return null;
  }, [projects]);

  const isFlightLoaded = useCallback(
    (flightId: number) => loadedFlightIds.includes(flightId),
    [loadedFlightIds]
  );
  const isFlightLoading = useCallback(
    (flightId: number) => loadingFlightIds.includes(flightId),
    [loadingFlightIds]
  );

  const setFlightLoaded = useCallback((flightId: number, loaded: boolean) => {
    setLoadedFlightIds((prev) => {
      const alreadyLoaded = prev.includes(flightId);
      if (loaded && !alreadyLoaded) return [...prev, flightId];
      if (!loaded && alreadyLoaded) return prev.filter((id) => id !== flightId);
      return prev;
    });
  }, []);

  const setFlightOpacity = useCallback((flightId: number, opacity: number) => {
    const normalized = Math.max(0, Math.min(1, opacity));
    setOpacityByFlightId((prev) => ({ ...prev, [flightId]: normalized }));
  }, []);

  const requestFlyToFlight = useCallback((flightId: number) => {
    setFlyToFlightId(flightId);
  }, []);

  const clearFlyToRequest = useCallback(() => {
    setFlyToFlightId(null);
  }, []);

  return (
    <DroneDeployContext.Provider
      value={{
        loading,
        metadataLoading,
        loadingFlightIds,
        dataLoaded,
        error,
        projects,
        totalFlightCount,
        dateRangeStart,
        dateRangeEnd,
        dateFilter,
        sortMode,
        loadedFlightIds,
        opacityByFlightId,
        flyToFlightId,
        selectedFlightId,
        warmCache,
        setDateFilter: setDateFilterState,
        setSortMode: setSortModeState,
        getFlightById,
        getProjectByFlightId,
        isFlightLoaded,
        isFlightLoading,
        setFlightLoaded,
        setFlightLoading,
        setFlightOpacity,
        setSelectedFlightId,
        requestFlyToFlight,
        clearFlyToRequest,
      }}
    >
      {children}
    </DroneDeployContext.Provider>
  );
}

export function useDroneDeploy() {
  const context = useContext(DroneDeployContext);
  if (!context) throw new Error('useDroneDeploy must be used within DroneDeployProvider');
  return context;
}
