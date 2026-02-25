import { useCallback, useState } from 'react';

export interface MapToast {
  id: string;
  message: string;
  type: 'info' | 'warning';
}

export function useMapToastState() {
  const [toasts, setToasts] = useState<MapToast[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'warning' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
  };
}
