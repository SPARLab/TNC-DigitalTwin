import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { V2AppRoutes } from './V2AppRoutes';

// The catalog page and the data-source provider tree pull in the ArcGIS SDK and
// every service client. Routing is the subject here, so both are stubbed and the
// workbench layout is reduced to a pass-through outlet.
vi.mock('../pages/CatalogWorkbench', () => ({
  CatalogWorkbench: () => <h1>Catalog Workbench</h1>,
}));

vi.mock('./WorkbenchLayout', () => ({
  WorkbenchLayout: () => <Outlet />,
}));

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <V2AppRoutes />
    </MemoryRouter>,
  );
}

describe('V2AppRoutes', () => {
  it('renders the landing page at the root path', () => {
    renderAt('/');

    expect(
      screen.getByRole('heading', { name: 'Digital Twin of Nature' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/catalog', 'Catalog Workbench'],
    ['/monitoring', 'Live Monitoring'],
    ['/experiences', 'Experiences'],
    ['/notebooks', 'Notebooks'],
  ])('renders the page for %s', (path, headingName) => {
    renderAt(path);

    expect(screen.getByRole('heading', { name: headingName })).toBeInTheDocument();
  });

  it('shows the nav rail on every page', () => {
    renderAt('/notebooks');

    expect(screen.getByRole('navigation', { name: 'Platform navigation' })).toBeInTheDocument();
  });

  it('marks the nav rail item for the active route as the current page', () => {
    renderAt('/experiences');

    expect(screen.getByTitle('Experiences')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTitle('Data Catalog')).not.toHaveAttribute('aria-current');
  });

  it('navigates when a nav rail item is clicked', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByTitle('Live Monitoring'));

    expect(screen.getByRole('heading', { name: 'Live Monitoring' })).toBeInTheDocument();
  });

  it('redirects unknown paths back to the landing page', () => {
    renderAt('/does-not-exist');

    expect(
      screen.getByRole('heading', { name: 'Digital Twin of Nature' }),
    ).toBeInTheDocument();
  });
});
