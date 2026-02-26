import { useCallback, useState } from 'react';

export interface DataOnePreviewState {
  url: string;
  title: string;
}

export function useDataOnePreviewState() {
  const [dataOnePreview, setDataOnePreview] = useState<DataOnePreviewState | null>(null);

  const openDataOnePreview = useCallback((url: string, title: string) => {
    setDataOnePreview({ url, title });
  }, []);

  const closeDataOnePreview = useCallback(() => {
    setDataOnePreview(null);
  }, []);

  return {
    dataOnePreview,
    openDataOnePreview,
    closeDataOnePreview,
  };
}
