// ============================================================================
// Platform navigation — single source of truth for the nav rail.
// ============================================================================

import { Database, FlaskConical, Home, Info, NotebookPen, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NOTEBOOKS_ENABLED } from './featureFlags';
import { FEEDBACK_PREVIEW_MODE } from './feedbackPreview';

export interface PlatformNavItem {
  /** Route path this item navigates to. */
  path: string;
  /** Full label, used when the rail is expanded and for tooltips. */
  label: string;
  /** Abbreviated label shown beneath the icon in the collapsed rail. */
  shortLabel: string;
  icon: LucideIcon;
  /** Greyed out / non-navigable (feedback preview). */
  comingSoon?: boolean;
}

const ALL_PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
  {
    path: '/',
    label: 'Home',
    shortLabel: 'Home',
    icon: Home,
  },
  {
    path: '/about',
    label: 'About',
    shortLabel: 'Info',
    icon: Info,
  },
  {
    path: '/monitoring',
    label: 'Live Monitoring',
    shortLabel: 'Live',
    icon: Radio,
  },
  {
    path: '/catalog',
    label: 'Data Catalog',
    shortLabel: 'Data',
    icon: Database,
  },
  {
    path: '/experiences',
    label: 'Experiences',
    shortLabel: 'Exp.',
    icon: FlaskConical,
    comingSoon: FEEDBACK_PREVIEW_MODE,
  },
  {
    path: '/notebooks',
    label: 'Notebooks',
    shortLabel: 'Note',
    icon: NotebookPen,
    comingSoon: FEEDBACK_PREVIEW_MODE,
  },
];

/** The nav items to show, without Notebooks when that page is hidden. */
export function platformNavItems(notebooksEnabled: boolean = NOTEBOOKS_ENABLED): PlatformNavItem[] {
  return ALL_PLATFORM_NAV_ITEMS.filter((item) => notebooksEnabled || item.path !== '/notebooks');
}

export const PLATFORM_NAV_ITEMS: PlatformNavItem[] = platformNavItems();

export function isNavItemActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}
