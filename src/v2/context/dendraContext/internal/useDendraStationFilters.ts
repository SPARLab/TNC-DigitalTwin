import { useCallback, useMemo, useState } from 'react';
import type { DendraStation } from '../../../services/dendraStationService';

export function useDendraStationFilters(stations: DendraStation[]) {
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const toggleActiveOnly = useCallback(() => {
    setShowActiveOnly((prev) => !prev);
  }, []);

  const setShowActiveOnlyFilter = useCallback((next: boolean) => {
    setShowActiveOnly(next);
  }, []);

  const filteredStations = useMemo(() => {
    if (!showActiveOnly) return stations;
    return stations.filter((station) => station.is_active === 1);
  }, [stations, showActiveOnly]);

  return {
    showActiveOnly,
    toggleActiveOnly,
    setShowActiveOnly: setShowActiveOnlyFilter,
    filteredStations,
  };
}
