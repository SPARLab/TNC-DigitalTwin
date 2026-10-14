// ============================================================================
// NavRail — collapsible platform navigation rail (Home / About / Catalog /
// Monitoring / Experiences / Notebooks). Ported from the twin_models webapp
// mockup sidebar.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaf, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { PLATFORM_NAV_ITEMS, isNavItemActive } from '../../config/navigation';
import { COMPACT_VIEWPORT_QUERY, NARROW_VIEWPORT_QUERY } from '../../config/layout';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { closeNavMenu, toggleNavMenu, useNavMenuOpen } from './navMenuStore';

const EXPANDED_STORAGE_KEY = 'v2-nav-rail-expanded';

export function NavRail() {
  const [storedExpanded, setStoredExpanded] = useLocalStorage(EXPANDED_STORAGE_KEY, false);
  // Laptop-sized windows keep the rail as a slim icon strip and open the labelled
  // view as a popover over the page. Narrow windows (tablets, phones) drop the rail
  // altogether: a hamburger in the page header opens the same menu as a drawer.
  // The open state is per visit; the saved preference only applies on large windows.
  const isCompact = useMediaQuery(COMPACT_VIEWPORT_QUERY);
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_QUERY);
  const menuOpen = useNavMenuOpen();
  const isExpanded = isNarrow || (isCompact ? menuOpen : storedExpanded);
  const isPopover = isCompact && menuOpen;
  const navRef = useRef<HTMLElement>(null);

  const toggleExpanded = () => {
    if (isCompact) toggleNavMenu();
    else setStoredExpanded((current) => !current);
  };

  useEffect(() => {
    if (!isPopover) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current?.contains(event.target as Node)) return;
      closeNavMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNavMenu();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isPopover]);

  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Holds the rail's slim width in the layout while its popover floats over the page. */}
      {isCompact && !isNarrow && <div aria-hidden="true" className="w-[64px] flex-shrink-0" />}
      {isNarrow && isPopover && (
        <div aria-hidden="true" className="fixed inset-0 z-[110] bg-gray-950/40" />
      )}
      <nav
        ref={navRef}
        id="platform-nav-rail"
        aria-label="Platform navigation"
        className={`flex flex-shrink-0 flex-col overflow-hidden border-r border-emerald-950/40 bg-emerald-900 duration-200 ease-in-out ${
          isNarrow
            ? `fixed inset-y-0 left-0 z-[120] w-[220px] transition-[transform,visibility] ${
                menuOpen ? 'translate-x-0 shadow-2xl' : 'invisible -translate-x-full'
              }`
            : `transition-[width] ${isCompact ? 'fixed inset-y-0 left-0 z-[120]' : 'h-full'} ${
                isExpanded ? 'w-[220px]' : 'w-[64px]'
              } ${isPopover ? 'shadow-2xl' : ''}`
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
            onClick={() => {
              navigate('/');
              closeNavMenu();
            }}
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
            onClick={toggleExpanded}
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
            const isComingSoon = !!item.comingSoon;
            const isActive = !isComingSoon && isNavItemActive(item.path, location.pathname);

            return (
              <li key={item.path} className={isExpanded ? 'w-full' : ''}>
                <button
                  id={`nav-rail-item-${item.path === '/' ? 'home' : item.path.slice(1)}`}
                  type="button"
                  onClick={() => {
                    if (isComingSoon) return;
                    navigate(item.path);
                    closeNavMenu();
                  }}
                  disabled={isComingSoon}
                  title={isComingSoon ? `${item.label} — under construction` : item.label}
                  aria-current={isActive ? 'page' : undefined}
                  aria-disabled={isComingSoon || undefined}
                  className={`relative flex items-center rounded-md transition-colors ${
                    isExpanded
                      ? 'w-full gap-2.5 px-2.5 py-2'
                      : 'h-12 w-12 flex-col justify-center gap-0.5'
                  } ${
                    isComingSoon
                      ? 'cursor-not-allowed text-emerald-200/30'
                      : isActive
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
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isComingSoon ? 'opacity-50' : ''}`} />
                  {isExpanded ? (
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-xs font-medium">{item.label}</span>
                      {isComingSoon && (
                        <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-100/50">
                          Soon
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold uppercase tracking-wide">
                      {isComingSoon ? 'Soon' : item.shortLabel}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
