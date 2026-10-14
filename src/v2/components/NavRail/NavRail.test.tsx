import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NavRail } from './NavRail';
import { NavMenuButton } from './NavMenuButton';
import { closeNavMenu } from './navMenuStore';
import { mockViewport, restoreViewport } from '../../hooks/viewportTestUtils';

const EXPANDED_STORAGE_KEY = 'v2-nav-rail-expanded';

// StrictMode is deliberate: it double-invokes effects, which is what previously
// let a stale write clobber the persisted preference on mount.
function renderRail() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/catalog']}>
        <NavRail />
      </MemoryRouter>
    </StrictMode>,
  );
}

describe('NavRail', () => {
  beforeEach(() => {
    window.localStorage.clear();
    closeNavMenu();
  });

  it('starts collapsed with no saved preference', () => {
    renderRail();

    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('restores the expanded preference from storage on mount', () => {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, 'true');

    renderRail();

    expect(screen.getByLabelText('Collapse navigation')).toBeInTheDocument();
    expect(screen.getByText('Data Catalog')).toBeInTheDocument();
  });

  it('keeps the saved preference intact across a remount', () => {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, 'true');

    const { unmount } = renderRail();
    unmount();

    expect(window.localStorage.getItem(EXPANDED_STORAGE_KEY)).toBe('true');
  });

  it('persists the preference when toggled', async () => {
    const user = userEvent.setup();
    renderRail();

    await user.click(screen.getByLabelText('Expand navigation'));

    expect(window.localStorage.getItem(EXPANDED_STORAGE_KEY)).toBe('true');
    expect(screen.getByLabelText('Collapse navigation')).toBeInTheDocument();
  });
});

describe('NavRail on a laptop-sized window', () => {
  beforeEach(() => {
    window.localStorage.clear();
    closeNavMenu();
    mockViewport({ compact: true });
  });

  afterEach(restoreViewport);

  it('stays collapsed even when an expanded preference was saved', () => {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, 'true');

    renderRail();

    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();
    expect(screen.queryByText('Data Catalog')).not.toBeInTheDocument();
  });

  it('opens as a popover over the page and keeps a slim spacer in the layout', async () => {
    const user = userEvent.setup();
    renderRail();

    await user.click(screen.getByLabelText('Expand navigation'));

    const rail = screen.getByRole('navigation', { name: 'Platform navigation' });
    expect(rail).toHaveClass('fixed');
    expect(rail).toHaveClass('w-[220px]');
    expect(screen.getByText('Data Catalog')).toBeInTheDocument();
    expect(rail.previousElementSibling).toHaveClass('w-[64px]');
  });

  it('does not save the popover as the expanded preference', async () => {
    const user = userEvent.setup();
    renderRail();

    await user.click(screen.getByLabelText('Expand navigation'));

    expect(window.localStorage.getItem(EXPANDED_STORAGE_KEY)).toBeNull();
  });

  it('closes on Escape, an outside click, or choosing a page', async () => {
    const user = userEvent.setup();
    renderRail();

    await user.click(screen.getByLabelText('Expand navigation'));
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Expand navigation'));
    await user.click(document.body);
    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Expand navigation'));
    await user.click(screen.getByText('Data Catalog'));
    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();
  });
});

describe('NavRail on a narrow window', () => {
  beforeEach(() => {
    window.localStorage.clear();
    closeNavMenu();
    mockViewport({ narrow: true });
  });

  afterEach(() => {
    closeNavMenu();
    restoreViewport();
  });

  function renderRailWithButton() {
    return render(
      <MemoryRouter initialEntries={['/about']}>
        <NavMenuButton />
        <NavRail />
      </MemoryRouter>,
    );
  }

  it('drops the rail from the layout and hides the menu until the hamburger is used', () => {
    renderRailWithButton();

    const rail = document.getElementById('platform-nav-rail');
    expect(rail).toHaveClass('fixed', 'invisible');
    expect(rail?.previousElementSibling?.className ?? '').not.toContain('w-[64px]');
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens a labelled drawer with a backdrop from the hamburger', async () => {
    const user = userEvent.setup();
    renderRailWithButton();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    const rail = document.getElementById('platform-nav-rail');
    expect(rail).not.toHaveClass('invisible');
    expect(rail).toHaveClass('w-[220px]');
    expect(screen.getByText('Data Catalog')).toBeInTheDocument();
    expect(document.querySelector('.bg-gray-950\\/40')).not.toBeNull();
  });

  it('closes the drawer when a page is chosen or Escape is pressed', async () => {
    const user = userEvent.setup();
    renderRailWithButton();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await user.keyboard('{Escape}');
    expect(document.getElementById('platform-nav-rail')).toHaveClass('invisible');

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await user.click(screen.getByText('Data Catalog'));
    expect(document.getElementById('platform-nav-rail')).toHaveClass('invisible');
  });

  it('shows no hamburger on wider windows', () => {
    mockViewport({ compact: true });
    renderRailWithButton();

    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
  });
});