// ============================================================================
// PersistentPages — keep each platform page mounted after the first visit.
//
// React Router would otherwise unmount /catalog (and its providers' sibling
// trees) when the nav rail changes, wiping pinned layers, map viewpoint, and
// monitoring/experience UI. Visited sections stay in the tree and are hidden
// with CSS until you come back.
// ============================================================================

import { useEffect, useState, type ComponentType } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { CatalogWorkbench } from '../pages/CatalogWorkbench';
import { MonitoringPage } from '../pages/MonitoringPage';
import { ExperiencesPage } from '../pages/ExperiencesPage';
import { NotebooksPage } from '../pages/NotebooksPage';
import { platformSectionFromPath, type PlatformSection } from './platformSections';

const SECTION_PAGES: Record<PlatformSection, ComponentType> = {
  home: LandingPage,
  catalog: CatalogWorkbench,
  monitoring: MonitoringPage,
  experiences: ExperiencesPage,
  notebooks: NotebooksPage,
};

export function PersistentPages() {
  const { pathname } = useLocation();
  const section = platformSectionFromPath(pathname);
  const [visited, setVisited] = useState<Set<PlatformSection>>(() =>
    section ? new Set([section]) : new Set(),
  );

  useEffect(() => {
    if (!section) return;
    setVisited((current) => {
      if (current.has(section)) return current;
      const next = new Set(current);
      next.add(section);
      return next;
    });
  }, [section]);

  useEffect(() => {
    if (!section) return;
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [section]);

  if (!section) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {([...visited] as PlatformSection[]).map((id) => {
        const Page = SECTION_PAGES[id];
        const isActive = id === section;
        return (
          <div
            key={id}
            id={`platform-section-${id}`}
            className={isActive ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col' : 'hidden'}
            aria-hidden={!isActive}
          >
            <Page />
          </div>
        );
      })}
    </>
  );
}
