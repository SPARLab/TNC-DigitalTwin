// ============================================================================
// CameraListView — Compact single-line camera rows
// Each row: camera name + image count + chevron. One line per camera.
// Animal-first: grayed-out cameras with 0 matches (DFT-028).
// Camera-first: all cameras with total counts.
// ============================================================================

import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import type { AnimlDeployment } from '../../../../services/animlService';

interface CameraListViewProps {
  deployments: AnimlDeployment[];
  /** Deployment IDs matching the current animal filter. null = all match. */
  matchingDeploymentIds: Set<number> | null;
  /** Get filtered count for a deployment. Returns null if lookups not ready. */
  getFilteredCount: (deploymentId: number) => number | null;
  hasFilter: boolean;
  onSelectCamera: (deploymentId: number) => void;
}

export function CameraListView({
  deployments,
  matchingDeploymentIds,
  getFilteredCount,
  hasFilter,
  onSelectCamera,
}: CameraListViewProps) {
  const [searchText, setSearchText] = useState('');

  // Filter by search text
  const filteredDeployments = useMemo(() => {
    if (!searchText.trim()) return deployments;
    const q = searchText.toLowerCase();
    return deployments.filter(
      d => d.name.toLowerCase().includes(q) || d.animl_dp_id.toLowerCase().includes(q),
    );
  }, [deployments, searchText]);

  // Sort: relevant cameras first when filtered; alphabetical otherwise
  const sortedDeployments = useMemo(() => {
    return [...filteredDeployments].sort((a, b) => {
      if (matchingDeploymentIds) {
        const aMatch = matchingDeploymentIds.has(a.id);
        const bMatch = matchingDeploymentIds.has(b.id);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredDeployments, matchingDeploymentIds]);

  const matchCount = matchingDeploymentIds
    ? filteredDeployments.filter(d => matchingDeploymentIds.has(d.id)).length
    : filteredDeployments.length;

  if (deployments.length === 0) {
    return (
      <p id="animl-camera-list-empty" className="text-sm text-gray-400 text-center py-6">
        No camera deployments found.
      </p>
    );
  }

  return (
    <div id="animl-camera-list" className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {hasFilter
            ? `${matchCount} of ${filteredDeployments.length} Cameras`
            : `${filteredDeployments.length} Camera${filteredDeployments.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Search — show when 10+ cameras */}
      {deployments.length >= 10 && (
        <div id="animl-camera-search" className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cameras..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg
                       bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
        </div>
      )}

      {/* Compact camera rows */}
      <div className="divide-y divide-gray-100">
        {sortedDeployments.map(dep => {
          const isGreyed = hasFilter && matchingDeploymentIds
            ? !matchingDeploymentIds.has(dep.id)
            : false;
          const count = getFilteredCount(dep.id);

          return (
            <button
              key={dep.id}
              id={`animl-camera-row-${dep.id}`}
              onClick={() => onSelectCamera(dep.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 text-left transition-colors ${
                isGreyed
                  ? 'opacity-40 hover:opacity-60'
                  : 'hover:bg-emerald-50'
              }`}
            >
              <span className={`text-sm flex-1 truncate ${
                isGreyed ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {dep.name}
              </span>

              {count !== null && (
                <span className={`text-xs tabular-nums flex-shrink-0 ${
                  isGreyed ? 'text-gray-300' : 'text-gray-400'
                }`}>
                  {count.toLocaleString()}
                </span>
              )}

              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${
                isGreyed ? 'text-gray-300' : 'text-gray-300'
              }`} />
            </button>
          );
        })}
      </div>

      {filteredDeployments.length === 0 && searchText && (
        <p className="text-sm text-gray-400 text-center py-4">
          No cameras matching "{searchText}"
        </p>
      )}
    </div>
  );
}
