// ============================================================================
// GpJobStatus — poll a submitted geoprocessing job and offer a .tif download
// once it succeeds.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  XCircle,
} from 'lucide-react';
import { parseJobFilename, pollGpJob } from '../../services/geoprocessingService';
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
}

export function GpJobStatus({
  job,
  serviceUrl,
  task,
  token,
  onLayerAdded,
}: GpJobStatusProps) {
  const [status, setStatus] = useState(job.status);
  const [messages, setMessages] = useState<GpMessage[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isCancelled = false;

    const tick = async () => {
      const snapshot = await pollGpJob(serviceUrl, task, job.id, token);
      if (isCancelled) return;

      setStatus(snapshot.status);
      setMessages(snapshot.messages);

      if (snapshot.status === 'esriJobSucceeded') {
        const filename =
          parseJobFilename(snapshot.messages, job.filenamePattern) ?? job.defaultFilename;
        const tifUrl = `${job.jobsDirectory}/${job.id}/scratch/${encodeURIComponent(filename)}`;
        setDownloadUrl(token ? `${tifUrl}?token=${token}` : tifUrl);
        onLayerAdded?.(job.result);
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

      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Download className="h-3.5 w-3.5" />
          Download .tif
        </a>
      )}
    </div>
  );
}
