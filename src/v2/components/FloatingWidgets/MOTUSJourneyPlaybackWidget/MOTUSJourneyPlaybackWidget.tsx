import { useEffect } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useMotusFilter } from '../../../context/MotusFilterContext';

const PLAYBACK_SPEED_OPTIONS: Array<0.5 | 1 | 2 | 4> = [0.5, 1, 2, 4];
const BASE_STEP_DURATION_MS = 1200;
const PLAYBACK_TICK_MS = 40;

function formatPlaybackLabel(value: string): string {
  if (!value) return 'No timestamp';
  if (value === 'Journey start') return value;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MOTUSJourneyPlaybackWidget() {
  const { activeLayer, pinnedLayers } = useLayers();
  const {
    selectedTagId,
    playbackStepIndex,
    playbackTransitionProgress,
    playbackStepLabels,
    playbackSpeed,
    isPlaybackPlaying,
    hasJourneyPlaybackData,
    setPlaybackStepIndex,
    setPlaybackTransitionProgress,
    setPlaybackSpeed,
    setIsPlaybackPlaying,
  } = useMotusFilter();

  const hasMotusOnMap = pinnedLayers.some((layer) => layer.layerId.startsWith('service-181') || layer.layerId === 'dataset-181')
    || !!(activeLayer && (activeLayer.layerId.startsWith('service-181') || activeLayer.layerId === 'dataset-181'));

  const maxStepIndex = Math.max(0, playbackStepLabels.length - 1);
  const currentLabel = playbackStepLabels[playbackStepIndex] || 'Journey start';

  useEffect(() => {
    if (!isPlaybackPlaying || maxStepIndex <= 0) return undefined;

    const duration = BASE_STEP_DURATION_MS / playbackSpeed;
    const progressStep = PLAYBACK_TICK_MS / duration;
    const tickInterval = window.setInterval(() => {
      if (playbackStepIndex >= maxStepIndex) {
        setIsPlaybackPlaying(false);
        setPlaybackTransitionProgress(0);
        return;
      }

      const nextProgress = playbackTransitionProgress + progressStep;
      if (nextProgress >= 1) {
        setPlaybackStepIndex(playbackStepIndex + 1);
        setPlaybackTransitionProgress(0);
        return;
      }
      setPlaybackTransitionProgress(nextProgress);
    }, PLAYBACK_TICK_MS);

    return () => {
      window.clearInterval(tickInterval);
    };
  }, [
    isPlaybackPlaying,
    maxStepIndex,
    playbackStepIndex,
    playbackTransitionProgress,
    playbackSpeed,
    setIsPlaybackPlaying,
    setPlaybackStepIndex,
    setPlaybackTransitionProgress,
  ]);

  const goToStart = () => {
    setIsPlaybackPlaying(false);
    setPlaybackTransitionProgress(0);
    setPlaybackStepIndex(0);
  };

  const goToLatest = () => {
    setIsPlaybackPlaying(false);
    setPlaybackTransitionProgress(0);
    setPlaybackStepIndex(maxStepIndex);
  };

  const stepBackward = () => {
    setIsPlaybackPlaying(false);
    setPlaybackTransitionProgress(0);
    setPlaybackStepIndex(playbackStepIndex - 1);
  };

  const stepForward = () => {
    setIsPlaybackPlaying(false);
    setPlaybackTransitionProgress(0);
    setPlaybackStepIndex(playbackStepIndex + 1);
  };

  const togglePlayback = () => {
    if (maxStepIndex <= 0) return;
    if (playbackStepIndex >= maxStepIndex) {
      setPlaybackStepIndex(0);
      setPlaybackTransitionProgress(0);
      setIsPlaybackPlaying(true);
      return;
    }
    setIsPlaybackPlaying(!isPlaybackPlaying);
  };

  if (!hasMotusOnMap) return null;

  return (
    <section
      id="motus-journey-playback-widget"
      className="absolute bottom-6 left-6 z-30 w-[380px] rounded-lg border border-gray-300 bg-white/95 shadow-lg backdrop-blur-sm"
      aria-label="MOTUS journey playback controls"
    >
      <div id="motus-journey-playback-widget-header" className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 id="motus-journey-playback-widget-title" className="text-sm font-semibold text-gray-900">
          Journey playback
        </h3>
        <p id="motus-journey-playback-widget-subtitle" className="mt-0.5 text-xs text-gray-600">
          {selectedTagId == null
            ? 'Select a tagged animal to animate its inferred movement sequence.'
            : `Tag ${selectedTagId} playback`}
        </p>
      </div>

      <div id="motus-journey-playback-widget-content" className="space-y-3 px-4 py-3">
        <div id="motus-journey-playback-widget-current-label-row" className="flex items-center justify-between text-xs">
          <span id="motus-journey-playback-widget-current-label-caption" className="font-medium text-gray-500">
            Current timestamp
          </span>
          <span id="motus-journey-playback-widget-current-label-value" className="font-semibold text-gray-900">
            {formatPlaybackLabel(currentLabel)}
          </span>
        </div>

        <input
          id="motus-journey-playback-widget-scrubber"
          type="range"
          min={0}
          max={maxStepIndex}
          step={1}
          disabled={maxStepIndex <= 0}
          value={playbackStepIndex}
          onChange={(event) => {
            setIsPlaybackPlaying(false);
            setPlaybackTransitionProgress(0);
            setPlaybackStepIndex(Number(event.target.value));
          }}
          className="w-full accent-emerald-700 disabled:opacity-40"
          aria-label="Journey playback timeline scrubber"
        />

        <div id="motus-journey-playback-widget-controls-row" className="flex items-center gap-2">
          <button
            id="motus-journey-playback-widget-jump-start-button"
            type="button"
            onClick={goToStart}
            disabled={maxStepIndex <= 0 || playbackStepIndex === 0}
            className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start
          </button>
          <button
            id="motus-journey-playback-widget-step-back-button"
            type="button"
            onClick={stepBackward}
            disabled={maxStepIndex <= 0 || playbackStepIndex === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Step backward one detection window"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            id="motus-journey-playback-widget-play-pause-button"
            type="button"
            onClick={togglePlayback}
            disabled={maxStepIndex <= 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={isPlaybackPlaying ? 'Pause journey playback' : 'Play journey playback'}
          >
            {isPlaybackPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            id="motus-journey-playback-widget-step-forward-button"
            type="button"
            onClick={stepForward}
            disabled={maxStepIndex <= 0 || playbackStepIndex >= maxStepIndex}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Step forward one detection window"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            id="motus-journey-playback-widget-jump-latest-button"
            type="button"
            onClick={goToLatest}
            disabled={maxStepIndex <= 0 || playbackStepIndex >= maxStepIndex}
            className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Latest
          </button>
        </div>

        <div id="motus-journey-playback-widget-speed-row" className="flex items-center justify-between">
          <span id="motus-journey-playback-widget-speed-label" className="text-xs font-medium text-gray-500">
            Speed
          </span>
          <div id="motus-journey-playback-widget-speed-options" className="flex items-center gap-1">
            {PLAYBACK_SPEED_OPTIONS.map((speedOption) => (
              <button
                id={`motus-journey-playback-widget-speed-${String(speedOption).replace('.', '-')}`}
                key={speedOption}
                type="button"
                onClick={() => setPlaybackSpeed(speedOption)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  playbackSpeed === speedOption
                    ? 'bg-emerald-700 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {speedOption}x
              </button>
            ))}
          </div>
        </div>

        {!hasJourneyPlaybackData && (
          <p id="motus-journey-playback-widget-empty-state" className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            No playable sequence in the selected filter window yet.
          </p>
        )}
      </div>
    </section>
  );
}
