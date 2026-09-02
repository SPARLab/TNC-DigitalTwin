// ============================================================================
// V2AppRoutes — platform route table.
//
//   PlatformShell (nav rail)
//     ├── /                → LandingPage
//     ├── /notebooks       → NotebooksPage
//     ├── /monitoring      → MonitoringPage (owns its own map + wind service)
//     └── WorkbenchLayout (catalog + data source providers)
//           ├── /catalog     → CatalogWorkbench
//           └── /experiences → ExperiencesPage
// ============================================================================

import { Navigate, Route, Routes } from 'react-router-dom';
import { PlatformShell } from './PlatformShell';
import { WorkbenchLayout } from './WorkbenchLayout';
import { LandingPage } from '../pages/LandingPage';
import { CatalogWorkbench } from '../pages/CatalogWorkbench';
import { MonitoringPage } from '../pages/MonitoringPage';
import { ExperiencesPage } from '../pages/ExperiencesPage';
import { NotebooksPage } from '../pages/NotebooksPage';

export function V2AppRoutes() {
  return (
    <Routes>
      <Route element={<PlatformShell />}>
        <Route index element={<LandingPage />} />
        <Route path="notebooks" element={<NotebooksPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />

        <Route element={<WorkbenchLayout />}>
          <Route path="catalog" element={<CatalogWorkbench />} />
          <Route path="experiences" element={<ExperiencesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
