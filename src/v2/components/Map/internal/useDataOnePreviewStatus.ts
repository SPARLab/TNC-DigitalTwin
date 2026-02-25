import { useCallback, useEffect, useState } from 'react';

interface DataOnePreviewState {
  url: string;
  title: string;
}

export type PreviewStatus = 'loading' | 'loaded' | 'error' | 'blocked';

export function useDataOnePreviewStatus(dataOnePreview: DataOnePreviewState | null) {
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('loading');

  useEffect(() => {
    if (!dataOnePreview) return;
    setPreviewStatus('loading');
    const timeoutId = window.setTimeout(() => {
      setPreviewStatus((current) => (current === 'loading' ? 'blocked' : current));
    }, 9000);
    return () => window.clearTimeout(timeoutId);
  }, [dataOnePreview]);

  const markPreviewLoaded = useCallback(() => setPreviewStatus('loaded'), []);
  const markPreviewErrored = useCallback(() => setPreviewStatus('error'), []);

  return {
    previewStatus,
    markPreviewLoaded,
    markPreviewErrored,
  };
}
