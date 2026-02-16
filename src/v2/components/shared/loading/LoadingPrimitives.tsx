// ============================================================================
// Loading Primitives — shared loading UI building blocks for v2.
// ============================================================================

import { Loader2 } from 'lucide-react';
import { loadingTheme } from './loadingTheme';

interface EyeSlotLoadingSpinnerProps {
  id: string;
  className?: string;
}

export function EyeSlotLoadingSpinner({ id, className = '' }: EyeSlotLoadingSpinnerProps) {
  return <Loader2 id={id} className={`${loadingTheme.eyeSlotSpinner} ${className}`.trim()} />;
}

interface InlineLoadingRowProps {
  id: string;
  message: string;
  containerClassName?: string;
  spinnerClassName?: string;
  textClassName?: string;
}

export function InlineLoadingRow({
  id,
  message,
  containerClassName = loadingTheme.inlineRow,
  spinnerClassName = loadingTheme.inlineSpinner,
  textClassName = loadingTheme.inlineText,
}: InlineLoadingRowProps) {
  return (
    <div id={id} className={containerClassName}>
      <Loader2 id={`${id}-spinner`} className={`${spinnerClassName} mr-2`.trim()} />
      <span id={`${id}-text`} className={textClassName}>
        {message}
      </span>
    </div>
  );
}

interface RefreshLoadingRowProps {
  id: string;
  message: string;
  className?: string;
}

export function RefreshLoadingRow({ id, message, className = '' }: RefreshLoadingRowProps) {
  return (
    <div id={id} className={`${loadingTheme.refreshRow} ${className}`.trim()}>
      <Loader2 id={`${id}-spinner`} className={loadingTheme.refreshSpinner} />
      <span id={`${id}-text`}>{message}</span>
    </div>
  );
}

interface MapCenterLoadingOverlayProps {
  id: string;
  message: string;
}

export function MapCenterLoadingOverlay({ id, message }: MapCenterLoadingOverlayProps) {
  return (
    <div id={id} className={loadingTheme.mapOverlayBackdrop}>
      <div id={`${id}-card`} className={loadingTheme.mapOverlayCard}>
        <Loader2 id={`${id}-spinner`} className={loadingTheme.mapOverlaySpinner} />
        <span id={`${id}-text`} className={loadingTheme.mapOverlayText}>
          {message}
        </span>
      </div>
    </div>
  );
}
