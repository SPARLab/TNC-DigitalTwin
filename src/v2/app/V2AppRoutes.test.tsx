import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { V2AppRoutes } from './V2AppRoutes';

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

  it('greys out Experiences and Notebooks while feedback preview mode is on', () => {
    renderAt('/');

    expect(screen.getByTitle('Experiences — under construction')).toBeDisabled();
    expect(screen.getByTitle('Notebooks — under construction')).toBeDisabled();
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

  it('shows under construction for experience routes during feedback preview', () => {
    renderAt('/experiences/suitability');

    expect(screen.getByRole('heading', { name: 'Experiences' })).toBeInTheDocument();
    expect(screen.getByText('Under construction')).toBeInTheDocument();
  });

  it('redirects unknown paths back to the landing page', () => {
    renderAt('/does-not-exist');

    expect(
      screen.getByRole('heading', { name: 'Research Digital Twin of Nature' }),
    ).toBeInTheDocument();
  });
});
