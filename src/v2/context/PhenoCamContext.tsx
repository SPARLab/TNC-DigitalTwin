// ============================================================================
// PhenoCamContext — cameras + latest images cache, browse selection state.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useCatalog } from './CatalogContext';
import {
  fetchPhenoCameras,
  fetchPhenoLatestImages,
  type PhenoCamera,
  type PhenoLatestImage,
} from '../services/phenocamService';
import {
  findPhenoCamLayerId,
  resolvePhenoCamServiceUrl,
} from '../utils/phenocamCatalog';

interface PhenoCamContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  cameras: PhenoCamera[];
  latestImages: PhenoLatestImage[];
  serviceUrl: string;
  selectedCameraId: number | null;
  startDate: string | null;
  endDate: string | null;
  warmCache: () => void;
  setSelectedCameraId: (cameraId: number | null) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  clearDateRange: () => void;
}

const PhenoCamContext = createContext<PhenoCamContextValue | null>(null);

export function PhenoCamProvider({ children }: { children: ReactNode }) {
  const { layerMap } = useCatalog();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<PhenoCamera[]>([]);
  const [latestImages, setLatestImages] = useState<PhenoLatestImage[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const layerId = findPhenoCamLayerId(layerMap);
  const catalogLayer = layerId ? layerMap.get(layerId) : undefined;
  const serviceUrl = resolvePhenoCamServiceUrl(catalogLayer);

  const warmCache = useCallback(() => {
    if (inFlightRef.current || dataLoaded) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchPhenoCameras(serviceUrl),
      fetchPhenoLatestImages(serviceUrl),
    ])
      .then(([nextCameras, nextLatest]) => {
        setCameras(nextCameras);
        setLatestImages(nextLatest);
        setDataLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load PhenoCam data');
      })
      .finally(() => {
        inFlightRef.current = false;
        setLoading(false);
      });
  }, [dataLoaded, serviceUrl]);

  const setDateRange = useCallback((start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const clearDateRange = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  const value = useMemo<PhenoCamContextValue>(
    () => ({
      loading,
      dataLoaded,
      error,
      cameras,
      latestImages,
      serviceUrl,
      selectedCameraId,
      startDate,
      endDate,
      warmCache,
      setSelectedCameraId,
      setDateRange,
      clearDateRange,
    }),
    [
      loading,
      dataLoaded,
      error,
      cameras,
      latestImages,
      serviceUrl,
      selectedCameraId,
      startDate,
      endDate,
      warmCache,
      setDateRange,
      clearDateRange,
    ],
  );

  return (
    <PhenoCamContext.Provider value={value}>
      {children}
    </PhenoCamContext.Provider>
  );
}

export function usePhenoCam(): PhenoCamContextValue {
  const ctx = useContext(PhenoCamContext);
  if (!ctx) throw new Error('usePhenoCam must be used within PhenoCamProvider');
  return ctx;
}
