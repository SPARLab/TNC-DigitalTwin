// ============================================================================
// ExperienceWorkspace — map + control sidebar for one experience.
//
// Suitability and SDM render their geoprocessing panels. Everything else still
// uses the coming-soon placeholder until those models exist.
// ============================================================================

import { useMemo, useState } from 'react';
import { Construction, X } from 'lucide-react';
import type { ExperienceDefinition } from '../../config/experienceRegistry';
import { readStoredArcGisToken } from '../../services/geoprocessingService';
import { ExperienceMap } from './ExperienceMap';
import { SDMPanel } from './SDMPanel';
import { SuitabilityPanel } from './SuitabilityPanel';
import type { PointsAction, PreviewAction, RasterScope, ResultLayerInfo } from './types';

interface ExperienceWorkspaceProps {
  experience: ExperienceDefinition;
  onClose: () => void;
}

function ComingSoonPanel({ experience }: { experience: ExperienceDefinition }) {
  const Icon = experience.icon;

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
      <Icon className="mb-3 h-8 w-8 text-gray-400" />
      <h3 className="text-base font-semibold text-gray-900">{experience.name}</h3>
      <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">
        {experience.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Construction className="h-3.5 w-3.5" />
        Coming soon
      </span>
    </div>
  );
}

export function ExperienceWorkspace({ experience, onClose }: ExperienceWorkspaceProps) {
  const Icon = experience.icon;
  const token = useMemo(() => readStoredArcGisToken(), []);
  const [resultLayer, setResultLayer] = useState<ResultLayerInfo | null>(null);
  const [pointsAction, setPointsAction] = useState<PointsAction | null>(null);
  const [previewAction, setPreviewAction] = useState<PreviewAction | null>(null);
  const [analysisExtent, setAnalysisExtent] = useState<RasterScope>('preserve');

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
        <button
          type="button"
          onClick={onClose}
          title="Close experience"
          aria-label="Close experience"
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          id="experience-workspace-sidebar"
          className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white"
        >
          {experience.panel === 'suitability' ? (
            <SuitabilityPanel
              token={token}
              onLayerAdded={setResultLayer}
              onPreviewLayer={setPreviewAction}
              onExtentChange={setAnalysisExtent}
            />
          ) : experience.panel === 'sdm' ? (
            <SDMPanel
              token={token}
              onLayerAdded={setResultLayer}
              onTogglePoints={setPointsAction}
            />
          ) : (
            <ComingSoonPanel experience={experience} />
          )}
        </aside>

        <ExperienceMap
          center={experience.mapCenter}
          zoom={experience.mapZoom}
          token={token}
          resultLayer={resultLayer}
          pointsAction={pointsAction}
          previewAction={previewAction}
          analysisExtent={experience.panel === 'suitability' ? analysisExtent : undefined}
        />
      </div>
    </div>
  );
}
