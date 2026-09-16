// ============================================================================
// ResizablePanel — a side panel the user can drag to resize and collapse away.
//
// Used on both edges of the monitoring and catalog pages so the map can be given
// the full window. Width and collapsed state persist per panel.
//
// Growing a panel scales its contents rather than just adding whitespace, so the
// extra room buys larger readings and labels. That is done with CSS zoom on a
// content wrapper: it scales text, icons, and spacing together, where a font-size
// change alone would leave fixed-size icons and padding behind.
// ============================================================================

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface PanelState {
  width: number;
  isCollapsed: boolean;
}

export interface ResizablePanelHandle {
  collapse: () => void;
  expand: () => void;
  toggle: () => void;
}

interface ResizablePanelProps {
  side: 'left' | 'right';
  /** localStorage key holding this panel's width and collapsed state. */
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  /** Accessible name, also used for the toggle and drag handle labels. */
  label: string;
  /**
   * Largest content scale, reached at `maxWidth`. Contents never scale below 1:
   * narrowing a panel should crop it, not shrink the text.
   */
  maxScale?: number;
  children: ReactNode;
}

/** Keyboard resize step, in pixels. */
const KEYBOARD_STEP = 16;

const DEFAULT_MAX_SCALE = 1.35;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const ResizablePanel = forwardRef<ResizablePanelHandle, ResizablePanelProps>(
  function ResizablePanel(
    {
      side,
      storageKey,
      defaultWidth,
      minWidth,
      maxWidth,
      label,
      maxScale = DEFAULT_MAX_SCALE,
      children,
    },
    ref,
  ) {
    const [state, setState] = useLocalStorage<PanelState>(storageKey, {
      width: defaultWidth,
      isCollapsed: false,
    });

    // A stored width predates any change to the bounds, so clamp on the way out.
    const width = clamp(state.width, minWidth, maxWidth);
    const { isCollapsed } = state;

    const [isDragging, setIsDragging] = useState(false);
    const frameRef = useRef<number | null>(null);
    const pendingWidthRef = useRef<number | null>(null);

    const setWidth = useCallback(
      (next: number) => {
        setState((current) => ({ ...current, width: clamp(next, minWidth, maxWidth) }));
      },
      [setState, minWidth, maxWidth],
    );

    const setCollapsed = useCallback(
      (collapsed: boolean) => {
        setState((current) => ({ ...current, isCollapsed: collapsed }));
      },
      [setState],
    );

    const toggleCollapsed = useCallback(() => {
      setState((current) => ({ ...current, isCollapsed: !current.isCollapsed }));
    }, [setState]);

    useImperativeHandle(
      ref,
      () => ({
        collapse: () => setCollapsed(true),
        expand: () => setCollapsed(false),
        toggle: toggleCollapsed,
      }),
      [setCollapsed, toggleCollapsed],
    );

    /** Coalesce pointer moves to one width update per frame. */
    const queueWidth = useCallback(
      (next: number) => {
        pendingWidthRef.current = next;
        if (frameRef.current !== null) return;

        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          const queued = pendingWidthRef.current;
          if (queued !== null) setWidth(queued);
        });
      },
      [setWidth],
    );

    useEffect(() => {
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }, []);

    const handlePointerDown = useCallback(
      (event: ReactPointerEvent<HTMLDivElement>) => {
        // Ignore secondary buttons so a right click does not start a drag.
        if (event.button !== 0) return;

        event.preventDefault();
        const handle = event.currentTarget;
        handle.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startWidth = width;
        setIsDragging(true);

        const onMove = (moveEvent: PointerEvent) => {
          const delta = side === 'left'
            ? moveEvent.clientX - startX
            : startX - moveEvent.clientX;
          queueWidth(startWidth + delta);
        };

        const onUp = () => {
          setIsDragging(false);
          handle.releasePointerCapture(event.pointerId);
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      },
      [side, width, queueWidth],
    );

    const handleKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLDivElement>) => {
        // Arrows follow the panel: widening is always "away from the map".
        const grow = side === 'left' ? 'ArrowRight' : 'ArrowLeft';
        const shrink = side === 'left' ? 'ArrowLeft' : 'ArrowRight';

        if (event.key === grow) setWidth(width + KEYBOARD_STEP);
        else if (event.key === shrink) setWidth(width - KEYBOARD_STEP);
        else if (event.key === 'Home') setWidth(minWidth);
        else if (event.key === 'End') setWidth(maxWidth);
        else return;

        event.preventDefault();
      },
      [side, width, setWidth, minWidth, maxWidth],
    );

    // Contents hold their design size up to the default width, then grow with it.
    const scale = width <= defaultWidth
      ? 1
      : 1 + ((width - defaultWidth) / (maxWidth - defaultWidth)) * (maxScale - 1);

    const isLeft = side === 'left';
    const ToggleIcon = isLeft
      ? (isCollapsed ? ChevronRight : ChevronLeft)
      : (isCollapsed ? ChevronLeft : ChevronRight);

    return (
      <aside
        aria-label={label}
        style={{ width: isCollapsed ? 0 : width }}
        className={`relative flex-shrink-0 bg-white ${
          isCollapsed ? '' : isLeft ? 'border-r border-gray-200' : 'border-l border-gray-200'
        }`}
      >
        {!isCollapsed && (
          <div
            // Percentages inside a zoomed element already resolve against the
            // containing block divided by the zoom, so a plain 100% renders back to
            // the panel's full width. Dividing here as well would leave a gap.
            style={{ zoom: scale, width: '100%', height: '100%' }}
          >
            {children}
          </div>
        )}

        {!isCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize ${label}`}
            aria-valuenow={width}
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth}
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            onDoubleClick={() => setWidth(defaultWidth)}
            title="Drag to resize, double-click to reset"
            className={`absolute inset-y-0 z-10 w-1.5 cursor-col-resize transition-colors hover:bg-emerald-300/60 focus:bg-emerald-400/70 focus:outline-none ${
              isDragging ? 'bg-emerald-400/70' : 'bg-transparent'
            } ${isLeft ? 'right-0' : 'left-0'}`}
          />
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${label}`}
          title={`${isCollapsed ? 'Expand' : 'Collapse'} ${label}`}
          className={`absolute top-1/2 z-20 -translate-y-1/2 flex h-12 w-4 items-center justify-center border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-600 ${
            isLeft
              ? 'left-full rounded-r-card border-l-0'
              : 'right-full rounded-l-card border-r-0'
          }`}
        >
          <ToggleIcon className="h-3.5 w-3.5" />
        </button>

        {/* Keeps the resize cursor while dragging even if the pointer outruns the handle. */}
        {isDragging && <div className="fixed inset-0 z-30 cursor-col-resize" />}
      </aside>
    );
  },
);
