import { useState, useEffect, type ReactNode } from 'react';

const MIN_DESKTOP_WIDTH = 1024;

interface DesktopOnlyGateProps {
  children: ReactNode;
}

function DesktopRequiredMessage() {
  return (
    <div
      id="desktop-required-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 p-6"
    >
      <div
        id="desktop-required-card"
        className="max-w-md rounded-xl bg-white p-8 text-center shadow-2xl"
      >
        <div
          id="desktop-required-icon"
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100"
        >
          <span className="text-4xl" role="img" aria-label="Desktop computer">
            🖥️
          </span>
        </div>

        <h1
          id="desktop-required-title"
          className="mb-4 text-2xl font-semibold text-slate-900"
        >
          Desktop Required
        </h1>

        <p id="desktop-required-description" className="mb-4 text-slate-600">
          The Dangermond Preserve Data Catalog is optimized for desktop browsers.
        </p>

        <p id="desktop-required-action" className="mb-6 text-slate-600">
          Please visit on a laptop or desktop computer for the best experience.
        </p>

        <div
          id="desktop-required-minimum"
          className="mb-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500"
        >
          Minimum supported width: <strong className="font-medium">{MIN_DESKTOP_WIDTH}px</strong>
        </div>

        <p id="desktop-required-tip" className="text-sm italic text-slate-400">
          Tip: If you're on a laptop, try reducing your display scaling or browser zoom level.
        </p>
      </div>
    </div>
  );
}

export function DesktopOnlyGate({ children }: DesktopOnlyGateProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= MIN_DESKTOP_WIDTH);
    
    // Initial check
    checkWidth();
    
    // Listen for resize events
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Avoid flash of content during SSR/hydration
  if (isDesktop === null) {
    return null;
  }

  if (!isDesktop) {
    return <DesktopRequiredMessage />;
  }

  return <>{children}</>;
}

export default DesktopOnlyGate;

