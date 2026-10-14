// ============================================================================
// V2App — platform entry point. Mounts the router; per-page layout lives in
// app/V2AppRoutes.tsx. There is no minimum screen width: pages are expected to
// adapt (or at least stay usable) at laptop and smaller sizes.
// ============================================================================

import { BrowserRouter } from 'react-router-dom';
import { V2AppRoutes } from './app/V2AppRoutes';

export default function V2App() {
  return (
    <BrowserRouter>
      <V2AppRoutes />
    </BrowserRouter>
  );
}
