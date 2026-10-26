// ============================================================================
// SdmRunsPanel — what to do with finished species model runs, beside the map.
//
//   Run summary   pick a run: fit, suitable area, Preserve figures
//   Compare       compare two runs, then view the result
//   Common areas  find where several runs agree, then view the result
//
// The left-hand wizard makes the runs; these tabs are post-hoc analyses of them.
// ============================================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RunPicker } from './RunPicker';
import { SdmCommonForm } from './SdmCommonForm';
import { SdmCompareForm } from './SdmCompareForm';
import { SdmDownloadDialog } from './SdmDownloadDialog';
import { SpeciesSwatch } from './sdm/SpeciesSwatch';
import { SdmCommonView } from './sdm/SdmCommonView';
import { SdmComparisonView } from './sdm/SdmComparisonView';
import { SdmRunView } from './sdm/SdmRunView';
import { SDM_ANALYSIS_TABS } from './sdm/sdmCopy';
import { experienceUi } from './experienceUi';
import {
  runDisplayTitle,
  runKind,
  runSpeciesKey,
  runSpeciesLabel,
  runsOfSpecies,
  speciesOptions,
} from './sdmRuns';
import type {
  CompletedRun,
  ResultLayerInfo,
  SdmComparisonView as ComparisonView,
  SdmRunKind,
} from './types';

export type SdmAnalysisTab = SdmRunKind extends infer K ? Extract<K, 'model' | 'comparison' | 'common'> : never;

const TABS: ReadonlyArray<{ kind: SdmRunKind; key: keyof typeof SDM_ANALYSIS_TABS }> = [
  { kind: 'model', key: 'summary' },
  { kind: 'comparison', key: 'compare' },
  { kind: 'common', key: 'common' },
];

const NO_FIGURES =
  'rounded-card border border-dashed border-gray-300 bg-gray-50 px-2.5 py-3 text-sm leading-relaxed text-gray-500';

interface SdmRunsPanelProps {
  token: string | null;
  runs: CompletedRun[];
  /** The run on the map. */
  activeRunId: string | null;
  onSelectRun: (jobId: string) => void;
  onToggleVisible: (jobId: string) => void;
  onRemove: (jobId: string) => void;
  onChangeView: (jobId: string, view: ComparisonView) => void;
  onLayerAdded?: (info: ResultLayerInfo) => void;
  /** Each species' color on the map, by scientific name. */
  speciesColors?: Record<string, string>;
}

type SubTab = 'setup' | 'results';

const SUB_TAB_LABELS: Record<SubTab, string> = { setup: 'Configure', results: 'Results' };

/** Configure the analysis, or look at the results of the ones already run. */
function SubTabs({
  kind,
  value,
  resultCount,
  onChange,
}: {
  kind: SdmRunKind;
  value: SubTab;
  resultCount: number;
  onChange: (value: SubTab) => void;
}) {
  return (
    <div className="px-3 pt-3">
      <div role="tablist" aria-label="Analysis steps" className={experienceUi.toggleGroup}>
        {(['setup', 'results'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`sdm-subtab-${kind}-${key}`}
            aria-selected={value === key}
            aria-controls={`sdm-subpanel-${kind}-${key}`}
            onClick={() => onChange(key)}
            className={`${experienceUi.toggleBtn} ${value === key ? experienceUi.toggleBtnActive : ''}`}
          >
            {SUB_TAB_LABELS[key]}
            {key === 'results' && resultCount > 0 ? ` (${resultCount})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function Results({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-3 py-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</h3>
      {children}
    </section>
  );
}

export function SdmRunsPanel({
  token,
  runs,
  activeRunId,
  onSelectRun,
  onToggleVisible,
  onRemove,
  onChangeView,
  onLayerAdded,
  speciesColors = {},
}: SdmRunsPanelProps) {
  const [tab, setTab] = useState<SdmRunKind>('model');
  // The runs ticked when the download dialog opens, or null while it is closed.
  const [download, setDownload] = useState<string[] | null>(null);
  const [chosenSpeciesKey, setChosenSpeciesKey] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<Record<'comparison' | 'common', SubTab>>({
    comparison: 'setup',
    common: 'setup',
  });

  // Species with a model run. The summary and the comparisons show one at a time.
  const species = speciesOptions(runs);
  const currentSpecies =
    species.find((option) => option.key === chosenSpeciesKey) ?? species[0] ?? null;
  // With no species to tell them apart, every run is listed.
  const speciesRuns = currentSpecies ? runsOfSpecies(runs, currentSpecies) : runs;

  // A run that finishes opens the tab that shows it, but only runs that arrive
  // after the panel opens: restored runs should not steal the tab.
  const newestId = runs[0]?.jobId ?? null;
  const seenNewestRef = useRef(newestId);
  useEffect(() => {
    if (newestId === seenNewestRef.current) return;
    seenNewestRef.current = newestId;
    const newest = runs[0];
    const kind = newest ? runKind(newest) : null;
    if (kind) setTab(kind);
    // A finished analysis opens on its results.
    if (kind === 'comparison' || kind === 'common') {
      setSubTab((current) => ({ ...current, [kind]: 'results' }));
    }
    // Follow a new model run or comparison to its species.
    const key = newest && kind !== 'common' ? runSpeciesKey(newest) : null;
    if (key) setChosenSpeciesKey(key);
  }, [newestId, runs]);

  // The common-areas tab is the one place runs of different species mix.
  const runsOfKind = (kind: SdmRunKind) =>
    (kind === 'common' ? runs : speciesRuns).filter((run) => runKind(run) === kind);
  const activeOfKind = (kind: SdmRunKind): CompletedRun | null => {
    const ofKind = runsOfKind(kind);
    return ofKind.find((run) => run.jobId === activeRunId) ?? ofKind[0] ?? null;
  };

  const commonTitleOf = (run: CompletedRun) =>
    [runSpeciesLabel(run), runDisplayTitle(run)].filter(Boolean).join(' · ');

  const picker = (kind: SdmRunKind, label: string, emptyMessage: string) => (
    <RunPicker
      runs={runsOfKind(kind)}
      activeRun={activeOfKind(kind)}
      label={label}
      emptyMessage={emptyMessage}
      selectId={`sdm-${kind}-run-select`}
      hideDownloads
      onDownload={(jobId) => setDownload([jobId])}
      titleOf={kind === 'common' ? commonTitleOf : runDisplayTitle}
      onSelectRun={onSelectRun}
      onToggleVisible={onToggleVisible}
      onRemove={onRemove}
    />
  );

  const model = activeOfKind('model');
  const comparison = activeOfKind('comparison');
  const common = activeOfKind('common');

  return (
    <aside
      id="sdm-runs-panel"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white"
    >
      <div className="shrink-0 border-b border-gray-200 px-3 py-3">
        <div role="tablist" aria-label="Run analysis" className={experienceUi.toggleGroup}>
            {TABS.map(({ kind, key }) => (
              <button
                key={kind}
                type="button"
                role="tab"
                id={`sdm-tab-${kind}`}
                aria-selected={tab === kind}
                aria-controls={`sdm-tabpanel-${kind}`}
                onClick={() => setTab(kind)}
                className={`${experienceUi.toggleBtn} ${
                  tab === kind ? experienceUi.toggleBtnActive : ''
                }`}
              >
                {SDM_ANALYSIS_TABS[key].label}
              </button>
            ))}
        </div>
        {(tab === 'model' || tab === 'comparison') && currentSpecies && (
          <div className="mt-3">
            <label
              htmlFor="sdm-species-select"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500"
            >
              Species
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <SpeciesSwatch color={speciesColors[currentSpecies.key]} />
              {species.length > 1 ? (
                <select
                  id="sdm-species-select"
                  value={currentSpecies.key}
                  onChange={(event) => setChosenSpeciesKey(event.target.value)}
                  className="w-full min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {species.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p id="sdm-species-select" className="min-w-0 flex-1 break-words text-sm text-gray-800">
                  {currentSpecies.label}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Every tab stays mounted so a comparison keeps polling while another is open. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          role="tabpanel"
          id="sdm-tabpanel-model"
          aria-labelledby="sdm-tab-model"
          className={tab === 'model' ? '' : 'hidden'}
        >
          <p className={`${experienceUi.description} px-5 pt-4 pb-3`}>
            {SDM_ANALYSIS_TABS.summary.body}
          </p>
          {picker(
            'model',
            'Model runs',
            'No model runs yet. Use the steps on the left to run a species model. It will appear here.',
          )}
          {model && (
            <Results title="Model results">
              {model.sdmSummary ? (
                <SdmRunView key={model.jobId} summary={model.sdmSummary} />
              ) : (
                <p className={NO_FIGURES}>
                  This run has no summary. Runs made before the tool wrote one, or by a service
                  that has not been republished, do not include it.
                </p>
              )}
            </Results>
          )}
        </div>

        <div
          role="tabpanel"
          id="sdm-tabpanel-comparison"
          aria-labelledby="sdm-tab-comparison"
          className={tab === 'comparison' ? '' : 'hidden'}
        >
          <p className={`${experienceUi.description} px-5 pt-4`}>
            {SDM_ANALYSIS_TABS.compare.body}
          </p>
          <SubTabs
            kind="comparison"
            value={subTab.comparison}
            resultCount={runsOfKind('comparison').length}
            onChange={(value) => setSubTab((current) => ({ ...current, comparison: value }))}
          />
          {/* Both stay mounted so a comparison keeps polling while its results are open. */}
          <div
            role="tabpanel"
            id="sdm-subpanel-comparison-setup"
            aria-labelledby="sdm-subtab-comparison-setup"
            className={subTab.comparison === 'setup' ? '' : 'hidden'}
          >
            <SdmCompareForm token={token} runs={speciesRuns} onLayerAdded={onLayerAdded} />
          </div>
          <div
            role="tabpanel"
            id="sdm-subpanel-comparison-results"
            aria-labelledby="sdm-subtab-comparison-results"
            className={subTab.comparison === 'results' ? '' : 'hidden'}
          >
            {picker(
              'comparison',
              'Comparisons',
              'No comparisons yet. Choose two runs on the Configure tab and run the comparison.',
            )}
            {comparison && (
              <Results title="Comparison">
                {comparison.comparison ? (
                  <SdmComparisonView
                    key={comparison.jobId}
                    comparison={comparison.comparison}
                    inputRuns={comparison.inputRuns}
                    view={comparison.view ?? 'difference'}
                    onChangeView={(view) => onChangeView(comparison.jobId, view)}
                  />
                ) : (
                  <p className={NO_FIGURES}>The tool did not return figures for this comparison.</p>
                )}
              </Results>
            )}
          </div>
        </div>

        <div
          role="tabpanel"
          id="sdm-tabpanel-common"
          aria-labelledby="sdm-tab-common"
          className={tab === 'common' ? '' : 'hidden'}
        >
          <p className={`${experienceUi.description} px-5 pt-4`}>
            {SDM_ANALYSIS_TABS.common.body}
          </p>
          <SubTabs
            kind="common"
            value={subTab.common}
            resultCount={runsOfKind('common').length}
            onChange={(value) => setSubTab((current) => ({ ...current, common: value }))}
          />
          <div
            role="tabpanel"
            id="sdm-subpanel-common-setup"
            aria-labelledby="sdm-subtab-common-setup"
            className={subTab.common === 'setup' ? '' : 'hidden'}
          >
            <SdmCommonForm
              token={token}
              runs={runs}
              onLayerAdded={onLayerAdded}
              speciesColors={speciesColors}
            />
          </div>
          <div
            role="tabpanel"
            id="sdm-subpanel-common-results"
            aria-labelledby="sdm-subtab-common-results"
            className={subTab.common === 'results' ? '' : 'hidden'}
          >
            {picker(
              'common',
              'Common-area results',
              'No analyses yet. Choose runs on the Configure tab and find their common areas.',
            )}
            {common && (
              <Results title="Common suitable areas">
                {common.common ? (
                  <SdmCommonView
                    key={common.jobId}
                    common={common.common}
                    inputRuns={common.inputRuns}
                  />
                ) : (
                  <p className={NO_FIGURES}>The tool did not return figures for these runs.</p>
                )}
              </Results>
            )}
          </div>
        </div>

      </div>
      {download && (
        <SdmDownloadDialog
          runs={runs}
          speciesColors={speciesColors}
          initialRunIds={download}
          onClose={() => setDownload(null)}
        />
      )}
    </aside>
  );
}
