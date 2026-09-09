import { StrictMode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NavRail } from './NavRail';

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
