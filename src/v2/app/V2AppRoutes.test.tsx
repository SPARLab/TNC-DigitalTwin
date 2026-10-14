import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { V2AppRoutes } from './V2AppRoutes';
import { closeNavMenu } from '../components/NavRail/navMenuStore';
import { mockViewport, restoreViewport } from '../hooks/viewportTestUtils';

// The catalog page and the data-source provider tree pull in the ArcGIS SDK and
// every service client. Routing is the subject here, so both are stubbed.
vi.mock('../pages/CatalogWorkbench', () => ({
  CatalogWorkbench: () => <h1>Catalog Workbench</h1>,
}));

vi.mock('../pages/MonitoringPage', () => ({
  MonitoringPage: () => <h1>Live Monitoring</h1>,
}));

vi.mock('./V2AppProviders', () => ({
  V2AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../components/Experiences/ExperienceMap', () => ({
  ExperienceMap: () => <div>Experience Map</div>,
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
      screen.getByRole('heading', { name: 'Research Digital Twin of Nature' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/about', 'Dangermond Preserve Digital Twin'],
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
    renderAt('/catalog');

    expect(screen.getByTitle('Data Catalog')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTitle('Live Monitoring')).not.toHaveAttribute('aria-current');
  });

  it('enables Experiences and Notebooks when feedback preview mode is off', () => {
    renderAt('/');

    expect(screen.getByTitle('Experiences')).toBeEnabled();
    expect(screen.getByTitle('Notebooks')).toBeEnabled();
  });

  it('navigates when a nav rail item is clicked', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByTitle('Live Monitoring'));

    expect(screen.getByRole('heading', { name: 'Live Monitoring' })).toBeInTheDocument();
  });

  it('keeps a visited page mounted after navigating away', async () => {
    const user = userEvent.setup();
    renderAt('/catalog');

    expect(screen.getByRole('heading', { name: 'Catalog Workbench' })).toBeInTheDocument();

    await user.click(screen.getByTitle('Live Monitoring'));

    expect(screen.getByRole('heading', { name: 'Live Monitoring' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Catalog Workbench', hidden: true }),
    ).toBeInTheDocument();
    expect(document.getElementById('platform-section-catalog')).toHaveAttribute('aria-hidden', 'true');
    expect(document.getElementById('platform-section-monitoring')?.getAttribute('aria-hidden')).not.toBe(
      'true',
    );
  });

  it('opens an experience workspace when preview mode is off', () => {
    renderAt('/experiences/suitability');

    expect(screen.queryByText('Under construction')).not.toBeInTheDocument();
    expect(screen.getByText('Experience Map')).toBeInTheDocument();
  });

  it('redirects unknown paths back to the landing page', () => {
    renderAt('/does-not-exist');

    expect(
      screen.getByRole('heading', { name: 'Research Digital Twin of Nature' }),
    ).toBeInTheDocument();
  });
});

describe('V2AppRoutes on a narrow window', () => {
  beforeEach(() => mockViewport({ narrow: true }));
  afterEach(() => {
    closeNavMenu();
    restoreViewport();
  });

  it('puts a hamburger in a slim top bar on pages without their own header', () => {
    renderAt('/about');

    const bar = document.getElementById('narrow-top-bar');
    expect(bar).not.toBeNull();
    expect(bar).toHaveTextContent('About');
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
  });

  it('leaves the catalog to its own header instead of adding a second bar', () => {
    renderAt('/catalog');

    expect(document.getElementById('narrow-top-bar')).toBeNull();
  });

  it('opens the menu and navigates from it', async () => {
    const user = userEvent.setup();
    renderAt('/about');

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await user.click(screen.getByTitle('Live Monitoring'));

    expect(screen.getByRole('heading', { name: 'Live Monitoring' })).toBeInTheDocument();
    expect(document.getElementById('platform-nav-rail')).toHaveClass('invisible');
  });
});