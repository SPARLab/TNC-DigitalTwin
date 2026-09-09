// ============================================================================
// V2AppRoutes — platform route table.
//
//   PlatformShell (nav rail + catalog providers)
//     └── PersistentPages (visited sections stay mounted)
//           ├── /                       → LandingPage
//           ├── /notebooks              → NotebooksPage
//           ├── /monitoring             → MonitoringPage
//           ├── /experiences            → ExperiencesPage
//           └── /catalog                → CatalogWorkbench
// ============================================================================

import { Route, Routes } from 'react-router-dom';
import { PlatformShell } from './PlatformShell';
import { PersistentPages } from './PersistentPages';

export function V2AppRoutes() {
  return (
    <Routes>
      <Route element={<PlatformShell />}>
        <Route path="*" element={<PersistentPages />} />
      </Route>
    </Routes>
  );
}
