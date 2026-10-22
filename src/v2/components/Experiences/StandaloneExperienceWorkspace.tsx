// ============================================================================
// StandaloneExperienceWorkspace — a separately built Experience app in a
// same-origin iframe, under the same header as the map workspace so closing
// and naming work the same way for every Experience.
// ============================================================================

import { ExternalLink, X } from 'lucide-react';
import type { StandaloneExperience } from '../../config/experienceRegistry';

interface StandaloneExperienceWorkspaceProps {
  experience: StandaloneExperience;
  onClose: () => void;
}

export function StandaloneExperienceWorkspace({
  experience,
  onClose,
}: StandaloneExperienceWorkspaceProps) {
  const Icon = experience.icon;

  return (
    <div id="experience-workspace" className="flex h-full w-full flex-col overflow-hidden bg-white">
      <header
        id="experience-workspace-header"
        className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-2 text-emerald-700">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <h2 className="truncate text-sm font-semibold text-gray-900">{experience.name}</h2>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <a
            href={experience.standaloneAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            aria-label="Open experience in new tab"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            title="Close experience"
            aria-label="Close experience"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Dark backdrop matches the creek app's own background, so loading does not flash white. */}
      <iframe
        id="standalone-experience-frame"
        title={experience.name}
        src={experience.standaloneAppUrl}
        allow="fullscreen"
        className="min-h-0 w-full flex-1 border-0 bg-slate-950"
      />
    </div>
  );
}
