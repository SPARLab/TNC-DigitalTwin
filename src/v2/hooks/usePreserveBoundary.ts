// ============================================================================
// usePreserveBoundary — loads the preserve outline and its buffered clip region.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  fetchPreserveBoundary,
  type PreserveBoundary,
} from '../services/preserveBoundaryService';

/** Buffer applied to the clip region, in kilometres. */
const CLIP_BUFFER_KM = 1;

export function usePreserveBoundary(): PreserveBoundary | null {
  const [boundary, setBoundary] = useState<PreserveBoundary | null>(null);

  useEffect(() => {
    let isCancelled = false;

    fetchPreserveBoundary(CLIP_BUFFER_KM)
      .then((result) => {
        if (!isCancelled) setBoundary(result);
      })
      .catch((error) => {
        // Not fatal: surfaces fall back to a station-derived extent, and the map
        // simply has no outline.
        console.error('[usePreserveBoundary] Failed to load preserve boundary:', error);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return boundary;
}
