// ============================================================================
// Platform navigation — single source of truth for the nav rail.
// ============================================================================

import { Database, FlaskConical, Home, NotebookPen, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlatformNavItem {
  /** Route path this item navigates to. */
  path: string;
  /** Full label, used when the rail is expanded and for tooltips. */
  label: string;
  /** Abbreviated label shown beneath the icon in the collapsed rail. */
  shortLabel: string;
  icon: LucideIcon;
}

export const PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
  {
    path: '/',
    label: 'Home',
    shortLabel: 'Home',
    icon: Home,
  },
  {
    path: '/catalog',
    label: 'Data Catalog',
    shortLabel: 'Data',
    icon: Database,
  },
  {
    path: '/monitoring',
    label: 'Live Monitoring',
    shortLabel: 'Live',
    icon: Radio,
  },
  {
    path: '/experiences',
    label: 'Experiences',
    shortLabel: 'Exp.',
    icon: FlaskConical,
  },
  {
    path: '/notebooks',
    label: 'Notebooks',
    shortLabel: 'Note',
    icon: NotebookPen,
  },
];

export function isNavItemActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}
