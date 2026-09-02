// ============================================================================
// NavRail — collapsible platform navigation rail (Home / Catalog / Monitoring /
// Experiences / Notebooks). Ported from the twin_models webapp mockup sidebar.
// ============================================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { Leaf, LogIn, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { PLATFORM_NAV_ITEMS, isNavItemActive } from '../../config/navigation';

const EXPANDED_STORAGE_KEY = 'v2-nav-rail-expanded';

export function NavRail() {
  const [isExpanded, setIsExpanded] = useLocalStorage(EXPANDED_STORAGE_KEY, false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      id="platform-nav-rail"
      aria-label="Platform navigation"
      className={`flex h-full flex-shrink-0 flex-col overflow-hidden border-r border-emerald-950/40 bg-emerald-900 transition-[width] duration-200 ease-in-out ${
        isExpanded ? 'w-[220px]' : 'w-[64px]'
      }`}
    >
      <div
        id="nav-rail-brand-row"
        className={`flex flex-shrink-0 items-center gap-2 px-2 py-3 ${
          isExpanded ? 'flex-row' : 'flex-col'
        }`}
      >
        <button
          id="nav-rail-brand-button"
          type="button"
          onClick={() => navigate('/')}
          title="Dangermond Preserve Digital Twin"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-emerald-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Leaf className="h-5 w-5" />
        </button>

        {isExpanded && (
          <span
            id="nav-rail-brand-text"
            className="flex-1 truncate text-xs font-semibold text-white"
          >
            Digital Twin
          </span>
        )}

        <button
          id="nav-rail-toggle-button"
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          title={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
          aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={isExpanded}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-emerald-300/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          {isExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      <div
        id="nav-rail-divider"
        aria-hidden="true"
        className={`h-px flex-shrink-0 bg-white/10 ${isExpanded ? 'mx-3' : 'mx-4'}`}
      />

      <ul
        id="nav-rail-items"
        className={`flex flex-1 flex-col gap-1 overflow-y-auto py-2 ${
          isExpanded ? 'px-2' : 'items-center px-2'
        }`}
      >
        {PLATFORM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(item.path, location.pathname);

          return (
            <li key={item.path} className={isExpanded ? 'w-full' : ''}>
              <button
                id={`nav-rail-item-${item.path === '/' ? 'home' : item.path.slice(1)}`}
                type="button"
                onClick={() => navigate(item.path)}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center rounded-md transition-colors ${
                  isExpanded
                    ? 'w-full gap-2.5 px-2.5 py-2'
                    : 'h-12 w-12 flex-col justify-center gap-0.5'
                } ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-emerald-200/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-emerald-300"
                  />
                )}
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded ? (
                  <span className="truncate text-xs font-medium">{item.label}</span>
                ) : (
                  <span className="text-[9px] font-semibold uppercase tracking-wide">
                    {item.shortLabel}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div
        id="nav-rail-footer"
        className="flex flex-shrink-0 flex-col items-center gap-2 border-t border-white/10 px-2 py-3"
      >
        <button
          id="nav-rail-sign-in-button"
          type="button"
          disabled
          title="Sign-in is not available yet"
          className={`flex cursor-not-allowed items-center justify-center rounded-md text-emerald-200/40 ${
            isExpanded ? 'w-full gap-2 px-2.5 py-2' : 'h-10 w-10 flex-col gap-0.5'
          }`}
        >
          <LogIn className="h-4 w-4 flex-shrink-0" />
          {isExpanded ? (
            <span className="truncate text-xs font-medium">Sign in (soon)</span>
          ) : (
            <span className="text-[9px] font-semibold uppercase tracking-wide">Login</span>
          )}
        </button>
      </div>
    </nav>
  );
}
