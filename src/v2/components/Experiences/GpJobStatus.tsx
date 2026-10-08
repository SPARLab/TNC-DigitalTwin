// ============================================================================
// GpJobStatus — poll a submitted geoprocessing job and offer PNG and TIFF
// downloads once it succeeds.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  fetchGpJobPngUrl,
  fetchGpOutputMapImage,
  fetchGpRunAnalysis,
  pollGpJob,
  tiffUrlFromMessages,
} from '../../services/geoprocessingService';
import type { GpJobRecord, GpMessage, ResultLayerInfo } from './types';

const POLL_MS = 5000;

const ICONS = {
  esriJobSubmitted: Loader2,
  esriJobExecuting: Loader2,
  esriJobSucceeded: CheckCircle2,
  esriJobFailed: XCircle,
  esriJobCancelled: XCircle,
};

function statusLabel(status: string): string {
  return (status || '').replace('esriJob', '');
}

interface GpJobStatusProps {
  job: GpJobRecord;
  serviceUrl: string;
  task: string;
  token: string | null;
  onLayerAdded?: (info: ResultLayerInfo) => void;
  /** Called whenever the job status changes, including the first status. */
  onStatusChange?: (status: string) => void;
}

export function GpJobStatus({
  job,
  serviceUrl,
  task,
  token,
  onLayerAdded,
  onStatusChange,
}: GpJobStatusProps) {
  const [status, setStatus] = useState(job.status);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    onStatusChangeRef.current?.(status);
  }, [status]);
  const [messages, setMessages] = useState<GpMessage[]>([]);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [tifUrl, setTifUrl] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isCancelled = false;
    setPngUrl(null);
    setTifUrl(null);
    setStatus(job.status);
    setMessages([]);

    const tick = async () => {
      const snapshot = await pollGpJob(serviceUrl, task, job.id, token);
      if (isCancelled) return;

      setStatus(snapshot.status);
      setMessages(snapshot.messages);

      if (snapshot.status === 'esriJobSucceeded') {
        const extent = await fetchGpOutputMapImage(
          serviceUrl,
          task,
          job.id,
          'output_raster',
          token,
        ).catch(() => null);
        if (isCancelled) return;
        const tifUrl = tiffUrlFromMessages(snapshot.messages);
        let pngUrl: string | null = null;
        if (extent) {
          pngUrl = await fetchGpJobPngUrl(job.result.mapServerUrl, job.id, extent);
          if (isCancelled) return;
        }
        // Only the suitability overlay writes this. Other tools just return null.
        const analysis = job.result.record
          ? await fetchGpRunAnalysis(serviceUrl, task, job.id, token).catch(() => null)
          : null;
        if (isCancelled) return;
        setPngUrl(pngUrl);
        setTifUrl(tifUrl);
        onLayerAdded?.({
          ...job.result,
          summary: job.summary,
          pngUrl,
          tifUrl,
          analysis,
        });
        return;
      }

      if (
        snapshot.status !== 'esriJobFailed' &&
        snapshot.status !== 'esriJobCancelled'
      ) {
        timer = setTimeout(tick, POLL_MS);
      }
    };

    tick().catch((error) => {
      if (!isCancelled) {
        setStatus('esriJobFailed');
        setMessages([{ type: 'esriJobMessageTypeError', description: String(error.message ?? error) }]);
      }
    });

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [job, onLayerAdded, serviceUrl, task, token]);

  const isFinished = ['esriJobSucceeded', 'esriJobFailed', 'esriJobCancelled'].includes(status);
  const hasFailed = status === 'esriJobFailed' || status === 'esriJobCancelled';
  const Icon = ICONS[status as keyof typeof ICONS] ?? Info;

  return (
    <div
      className={`rounded-card border px-3 py-2.5 ${
        hasFailed
          ? 'border-red-200 bg-red-50'
          : isFinished
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <Icon
          className={`h-4 w-4 flex-shrink-0 ${
            hasFailed
              ? 'text-red-600'
              : isFinished
                ? 'text-emerald-700'
                : 'animate-spin text-emerald-700'
          }`}
        />
        <span className="font-semibold text-gray-800">{statusLabel(status)}</span>
        <span className="min-w-0 truncate text-gray-500">
          {job.summary}
          {job.scenario ? ` · ${job.scenario}` : ''}
        </span>
      </div>

      {messages.length > 0 && (
        <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
          {messages.map((message, index) => {
            const isError = message.type === 'esriJobMessageTypeError';
            const isWarning = message.type === 'esriJobMessageTypeWarning';
            const MessageIcon = isError ? XCircle : isWarning ? AlertTriangle : Info;
            return (
              <div
                key={`${index}-${message.description}`}
                className={`flex items-start gap-1.5 text-[10px] leading-relaxed ${
                  isError ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-gray-600'
                }`}
              >
                <MessageIcon className="mt-px h-3 w-3 flex-shrink-0" />
                <span>{message.description}</span>
              </div>
            );
          })}
        </div>
      )}

      {(pngUrl || tifUrl) && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {pngUrl && (
            <a
              href={pngUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </a>
          )}
          {tifUrl && (
            <a
              href={tifUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Download className="h-3.5 w-3.5" />
              Download TIFF
            </a>
          )}
        </div>
      )}
    </div>
  );
}
