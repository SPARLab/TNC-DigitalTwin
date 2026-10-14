import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraggableWidget } from './DraggableWidget';

const STORAGE_KEY = 'v2-widget-offset:test-legend';

// jsdom has no PointerEvent; a MouseEvent carrying a pointerId is enough here.
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class TestPointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    Object.defineProperty(window, 'PointerEvent', { value: TestPointerEvent, configurable: true });
  }
});

function renderWidget(onHeaderClick = vi.fn()) {
  render(
    <div style={{ position: 'relative' }}>
      <DraggableWidget id="test-legend" className="absolute bottom-6 right-6">
        <div role="button" tabIndex={0} data-drag-handle onClick={onHeaderClick}>
          Legend title
          <button type="button">inner control</button>
        </div>
        <p>legend body</p>
      </DraggableWidget>
    </div>,
  );
  return onHeaderClick;
}

function widgetElement() {
  return document.getElementById('test-legend') as HTMLElement;
}

function header() {
  return screen.getByText('Legend title');
}

function press(target: Element, x: number, y: number) {
  fireEvent.pointerDown(target, { button: 0, clientX: x, clientY: y, pointerId: 1 });
}

function moveTo(x: number, y: number) {
  fireEvent.pointerMove(window, { clientX: x, clientY: y, pointerId: 1 });
}

function release(x: number, y: number) {
  fireEvent.pointerUp(window, { clientX: x, clientY: y, pointerId: 1 });
}

describe('DraggableWidget', () => {
  beforeEach(() => window.localStorage.clear());

  it('renders in its anchored position until it is moved', () => {
    renderWidget();

    expect(screen.getByText('legend body')).toBeInTheDocument();
    expect(widgetElement()).toHaveClass('absolute', 'bottom-6', 'right-6');
    expect(widgetElement().style.transform).toBe('');
    expect(screen.queryByRole('button', { name: /move/i })).not.toBeInTheDocument();
  });

  it('moves when its title bar is dragged and remembers where it was left', () => {
    renderWidget();

    press(header(), 100, 100);
    moveTo(80, 70);
    release(80, 70);

    expect(widgetElement().style.transform).toBe('translate(-20px, -30px)');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ x: -20, y: -30 });
  });

  it('does not move when something other than the title bar is dragged', () => {
    renderWidget();

    press(screen.getByText('legend body'), 100, 100);
    moveTo(40, 40);
    release(40, 40);

    expect(widgetElement().style.transform).toBe('');
  });

  it('does not start a drag from a button inside the title bar', () => {
    renderWidget();

    press(screen.getByRole('button', { name: 'inner control' }), 100, 100);
    moveTo(40, 40);
    release(40, 40);

    expect(widgetElement().style.transform).toBe('');
  });

  it('treats a small movement as a click, not a drag', async () => {
    const user = userEvent.setup();
    const onHeaderClick = renderWidget();

    press(header(), 100, 100);
    moveTo(101, 101);
    release(101, 101);
    await user.click(header());

    expect(widgetElement().style.transform).toBe('');
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it('does not also click the title bar when a drag ends over it', () => {
    const onHeaderClick = renderWidget();

    press(header(), 100, 100);
    moveTo(60, 100);
    release(60, 100);
    fireEvent.click(header());

    expect(onHeaderClick).not.toHaveBeenCalled();
  });

  it('moves with Alt + arrow keys on the title bar', async () => {
    const user = userEvent.setup();
    renderWidget();

    header().focus();
    await user.keyboard('{Alt>}{ArrowLeft}{ArrowUp}{ArrowUp}{/Alt}');

    expect(widgetElement().style.transform).toBe('translate(-16px, -32px)');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ x: -16, y: -32 });
  });

  it('ignores plain arrow keys', async () => {
    const user = userEvent.setup();
    renderWidget();

    header().focus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');

    expect(widgetElement().style.transform).toBe('');
  });

  it('restores a remembered position on the next visit', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: -120, y: -40 }));

    renderWidget();

    expect(widgetElement().style.transform).toBe('translate(-120px, -40px)');
  });

  it('cannot be dragged out of the map area', () => {
    renderWidget();
    const widget = widgetElement();

    // The map area is 400x300 at the origin; the widget rests at x 100, y 200.
    const parent = widget.parentElement as HTMLElement;
    Object.defineProperty(widget, 'offsetParent', { value: parent, configurable: true });
    parent.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300, x: 0, y: 0, toJSON: () => ({}) });
    widget.getBoundingClientRect = () => {
      const match = /translate\((-?\d+)px, (-?\d+)px\)/.exec(widget.style.transform);
      const dx = match ? Number(match[1]) : 0;
      const dy = match ? Number(match[2]) : 0;
      const left = 100 + dx;
      const top = 200 + dy;
      return { left, top, right: left + 200, bottom: top + 80, width: 200, height: 80, x: left, y: top, toJSON: () => ({}) };
    };

    press(header(), 150, 250);
    moveTo(150, -400); // far past the top edge
    release(150, -400);

    // Top edge keeps a 4px gap: 200 - 196 = 4.
    expect(widget.style.transform).toBe('translate(0px, -196px)');
  });
});
