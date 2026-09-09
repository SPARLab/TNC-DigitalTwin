// ============================================================================
// V2App — platform entry point. Mounts the router inside the desktop gate;
// per-page layout lives in app/V2AppRoutes.tsx.
// ============================================================================

import { BrowserRouter } from 'react-router-dom';
import { DesktopOnlyGate } from '../components/DesktopOnlyGate';
import { V2AppRoutes } from './app/V2AppRoutes';

export default function V2App() {
  return (
    <DesktopOnlyGate>
      <BrowserRouter>
        <V2AppRoutes />
      </BrowserRouter>
    </DesktopOnlyGate>
  );
}
