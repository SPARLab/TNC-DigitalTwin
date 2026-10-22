import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResizablePanel } from './ResizablePanel';
import { setOpenSheet, useHasSheetTabs } from './bottomSheetStore';
import { mockViewport, restoreViewport } from '../../hooks/viewportTestUtils';

const STORAGE_KEY = 'test-panel';

function renderPanel() {
  return render(
    <ResizablePanel
      side="left"
      storageKey={STORAGE_KEY}
      defaultWidth={400}
      minWidth={320}
      maxWidth={620}
      label="layer details"
    >
      <p>contents</p>
    </ResizablePanel>,
  );
}

describe('ResizablePanel opening width', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('opens at the default width on a large window', () => {
    mockViewport({});
    renderPanel();

    expect(screen.getByRole('complementary', { name: 'layer details' })).toHaveStyle({ width: '400px' });
  });

  it('opens at the minimum width on a laptop-sized window', () => {
    mockViewport({ compact: true });
    renderPanel();

    expect(screen.getByRole('complementary', { name: 'layer details' })).toHaveStyle({ width: '320px' });
  });

  it('keeps a width the visitor already chose', () => {
    mockViewport({ compact: true });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ width: 500, isCollapsed: false }));
    renderPanel();

    expect(screen.getByRole('complementary', { name: 'layer details' })).toHaveStyle({ width: '500px' });
  });
});

describe('ResizablePanel as a bottom sheet on a phone', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setOpenSheet(null);
    mockViewport({ narrow: true, portrait: true });
  });
  afterEach(restoreViewport);

  function renderPair() {
    return render(
      <div>
        <ResizablePanel side="left" storageKey="sheet-left" defaultWidth={280} minWidth={220} maxWidth={460} label="data catalog">
          <p>layer list</p>
        </ResizablePanel>
        <ResizablePanel side="right" storageKey="sheet-right" defaultWidth={400} minWidth={320} maxWidth={620} label="layer details">
          <p>details</p>
        </ResizablePanel>
        <button type="button">map</button>
      </div>,
    );
  }

  it('starts closed: each panel is a tab on its own half of the bottom edge', () => {
    renderPair();

    expect(screen.getByRole('button', { name: 'Expand data catalog' })).toHaveClass('fixed', 'bottom-0', 'left-0', 'w-1/2');
    expect(screen.getByRole('button', { name: 'Expand layer details' })).toHaveClass('fixed', 'bottom-0', 'right-0', 'w-1/2');
    expect(screen.getByText('layer list')).not.toBeVisible();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('raises the sheet above the tab bar so both tabs stay visible', async () => {
    const user = userEvent.setup();
    renderPair();

    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));

    const sheet = screen.getByRole('complementary', { name: 'data catalog' });
    expect(sheet).toHaveClass('inset-x-0', 'bottom-10');
    expect(screen.getByText('layer list')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Collapse data catalog' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Expand layer details' })).toBeVisible();
  });

  it('swaps sheets from the other tab, in either direction', async () => {
    const user = userEvent.setup();
    renderPair();

    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));
    await user.click(screen.getByRole('button', { name: 'Expand layer details' }));
    expect(screen.getByText('details')).toBeVisible();
    expect(screen.getByText('layer list')).not.toBeVisible();
    expect(screen.getByRole('button', { name: 'Expand data catalog' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));
    expect(screen.getByText('layer list')).toBeVisible();
    expect(screen.getByText('details')).not.toBeVisible();
  });

  it('closes on its own tab, Escape, or a press outside', async () => {
    const user = userEvent.setup();
    renderPair();

    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));
    await user.click(screen.getByRole('button', { name: 'Collapse data catalog' }));
    expect(screen.getByText('layer list')).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));
    await user.keyboard('{Escape}');
    expect(screen.getByText('layer list')).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));
    await user.click(screen.getByRole('button', { name: 'map' }));
    expect(screen.getByText('layer list')).not.toBeVisible();
  });

  it('keeps contents mounted while closed so state survives', async () => {
    const user = userEvent.setup();
    renderPair();

    expect(screen.getByText('layer list')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand data catalog' }));
    await user.keyboard('{Escape}');

    expect(screen.getByText('layer list')).toBeInTheDocument();
  });

  it('tells the page a tab bar is showing, and stops when the panels leave', () => {
    function TabBarProbe() {
      return <p>{useHasSheetTabs() ? 'tab bar' : 'no tab bar'}</p>;
    }
    const { unmount } = render(
      <>
        <ResizablePanel side="left" storageKey="probe-left" defaultWidth={280} minWidth={220} maxWidth={460} label="data catalog">
          <p>layer list</p>
        </ResizablePanel>
        <TabBarProbe />
      </>,
    );
    expect(screen.getByText('tab bar')).toBeInTheDocument();
    unmount();

    render(<TabBarProbe />);
    expect(screen.getByText('no tab bar')).toBeInTheDocument();
  });
});