// ============================================================================
// DraggableWidget — a floating map widget the visitor can move out of the way.
//
// The widget keeps its normal anchored position (for example bottom-right); the
// drag only adds an offset on top of it, via a CSS transform. Grab the widget's
// title bar (any element marked `data-drag-handle`) and drag; buttons and links
// inside the title bar keep working, and a plain click still reaches the title
// bar, so click-to-collapse headers behave as before. Alt + arrow keys on a
// focused title bar move the widget for keyboard users.
// The offset is remembered per widget and clamped to the map so a widget can
// never be dragged, or left by a smaller window, out of reach.
// ============================================================================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

interface Offset {
  x: number;
  y: number;
}

/** Marks the part of a widget that can be dragged. */
export const DRAG_HANDLE_ATTRIBUTE = 'data-drag-handle';

const ZERO: Offset = { x: 0, y: 0 };
const EDGE_GAP = 4;
const KEYBOARD_STEP = 16;
/** Pointer travel before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 4;
const STORAGE_PREFIX = 'v2-widget-offset:';
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [data-no-drag]';

interface DraggableWidgetProps {
  /** Element id; also the key the widget's position is remembered under. */
  id: string;
  className?: string;
  style?: CSSProperties;
  role?: string;
  'aria-label'?: string;
  /** Rendered element. Defaults to a div. */
  as?: 'div' | 'section';
  children: ReactNode;
}

function readStoredOffset(id: string): Offset {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return ZERO;
    const parsed = JSON.parse(raw) as Partial<Offset>;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    // Unreadable storage just means the default position.
  }
  return ZERO;
}

function storeOffset(id: string, offset: Offset): void {
  try {
    if (offset.x === 0 && offset.y === 0) window.localStorage.removeItem(STORAGE_PREFIX + id);
    else window.localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(offset));
  } catch {
    // Not remembering a position is harmless.
  }
}

/**
 * Keep the widget fully inside its positioned parent (the map area). Works from
 * the widget's resting position, which is where it sits with no offset applied.
 * `applied` is the offset currently on screen; `offset` is the candidate.
 */
function clampToParent(element: HTMLElement, offset: Offset, applied: Offset = offset): Offset {
  const parent = element.offsetParent;
  if (!parent) return offset;

  const box = element.getBoundingClientRect();
  const area = parent.getBoundingClientRect();
  if (box.width === 0 || area.width === 0) return offset;

  // The box already includes the transform currently on screen, not the candidate offset.
  const restLeft = box.left - applied.x;
  const restTop = box.top - applied.y;

  const minX = area.left + EDGE_GAP - restLeft;
  const maxX = Math.max(minX, area.right - EDGE_GAP - box.width - restLeft);
  const minY = area.top + EDGE_GAP - restTop;
  const maxY = Math.max(minY, area.bottom - EDGE_GAP - box.height - restTop);

  return {
    x: Math.min(maxX, Math.max(minX, offset.x)),
    y: Math.min(maxY, Math.max(minY, offset.y)),
  };
}

/** The title bar a pointer or key event came from, unless it hit a control inside it. */
function dragHandleFor(target: EventTarget | null, root: HTMLElement): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const handle = target.closest<HTMLElement>(`[${DRAG_HANDLE_ATTRIBUTE}]`);
  if (!handle || !root.contains(handle)) return null;
  return handle;
}

function isControlInside(target: EventTarget | null, handle: HTMLElement): boolean {
  if (!(target instanceof Element)) return false;
  const control = target.closest(INTERACTIVE_SELECTOR);
  return control !== null && control !== handle && handle.contains(control);
}

export function DraggableWidget({
  id,
  className = '',
  style,
  role,
  'aria-label': ariaLabel,
  as: Tag = 'div',
  children,
}: DraggableWidgetProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState<Offset>(() => readStoredOffset(id));
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const commit = useCallback(
    (next: Offset) => {
      setOffset(next);
      storeOffset(id, next);
    },
    [id],
  );

  // A remembered position may not fit a smaller window, so pull it back in view.
  useEffect(() => {
    const refit = () => {
      const element = elementRef.current;
      if (!element) return;
      const current = offsetRef.current;
      if (current.x === 0 && current.y === 0) return;
      const fitted = clampToParent(element, current);
      if (fitted.x !== current.x || fitted.y !== current.y) commit(fitted);
    };

    refit();
    window.addEventListener('resize', refit);
    return () => window.removeEventListener('resize', refit);
  }, [commit]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const element = elementRef.current;
    if (!element) return;
    const handle = dragHandleFor(event.target, element);
    if (!handle || isControlInside(event.target, handle)) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = offsetRef.current;
    const pointerId = event.pointerId;
    let dragging = false;

    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!dragging) return;

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      storeOffset(id, offsetRef.current);

      // The release of a drag would otherwise also click the title bar (toggling it).
      const swallowClick = (clickEvent: MouseEvent) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
      };
      window.addEventListener('click', swallowClick, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', swallowClick, true), 0);
    };

    function onMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragging = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      setOffset(
        clampToParent(
          element!,
          { x: startOffset.x + dx, y: startOffset.y + dy },
          offsetRef.current,
        ),
      );
    }

    function onUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return;
      finish();
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!event.altKey) return;
    const element = elementRef.current;
    if (!element) return;
    const handle = dragHandleFor(event.target, element);
    if (!handle || isControlInside(event.target, handle)) return;

    const step: Record<string, Offset> = {
      ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEYBOARD_STEP },
      ArrowDown: { x: 0, y: KEYBOARD_STEP },
    };
    const move = step[event.key];
    if (!move) return;

    event.preventDefault();
    commit(clampToParent(element, { x: offset.x + move.x, y: offset.y + move.y }, offset));
  };

  const isMoved = offset.x !== 0 || offset.y !== 0;

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        elementRef.current = node;
      }}
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={className}
      style={{
        ...style,
        transform: isMoved ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
      }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    >
      {children}
    </Tag>
  );
}
