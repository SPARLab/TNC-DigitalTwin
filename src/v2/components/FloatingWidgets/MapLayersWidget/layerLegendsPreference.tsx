// ============================================================================
// layerLegendsPreference — whether the Map Layers list shows legend entries under
// each layer on the map. On by default; the choice is remembered. The widget owns
// the state and provides it so the rows (several levels down) can read it.
// ============================================================================

import { createContext, useCallback, useContext, useState } from 'react';

const STORAGE_KEY = 'v2-map-layers-show-legends';

const LayerLegendsVisibleContext = createContext(true);

export const LayerLegendsVisibleProvider = LayerLegendsVisibleContext.Provider;

/** Whether rows should show their legend entries. True outside a provider. */
export function useLayerLegendsVisible(): boolean {
  return useContext(LayerLegendsVisibleContext);
}

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

/** State for the preference, remembered between visits. */
export function useLayerLegendsPreference(): [boolean, (next: boolean) => void] {
  const [showLegends, setShowLegends] = useState<boolean>(readStoredPreference);

  const update = useCallback((next: boolean) => {
    setShowLegends(next);
    try {
      if (next) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, 'false');
    } catch {
      // Not remembering the choice is harmless.
    }
  }, []);

  return [showLegends, update];
}
