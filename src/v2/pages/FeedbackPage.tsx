// ============================================================================
// FeedbackPage — title, details, and attachments, emailed to the team.
// Reached from the Feedback item at the bottom of the nav rail. Stays mounted
// after the first visit (see PersistentPages), so a half-written message
// survives a trip to another section.
// ============================================================================

import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { FEEDBACK_PATH, PLATFORM_NAV_ITEMS, isNavItemActive } from '../config/navigation';
import {
  MAX_ATTACHMENTS,
  describeAttachmentProblem,
  formatMegabytes,
  submitFeedback,
  type FeedbackContext,
} from '../services/feedbackService';

type SubmitState = 'idle' | 'sending' | 'sent' | 'failed';

const fieldClassName =
  'mt-1 w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

function describeSection(path: string | null): string {
  if (!path) return 'Digital Twin';
  return PLATFORM_NAV_ITEMS.find((item) => isNavItemActive(item.path, path))?.label ?? 'Digital Twin';
}

export function FeedbackPage() {
  const { pathname, state } = useLocation();
  const isActive = pathname === FEEDBACK_PATH;

  // The page stays mounted, so remember the section the visitor came from each time they arrive.
  const [cameFrom, setCameFrom] = useState<string | null>(null);
  useEffect(() => {
    if (!isActive) return;
    const from = (state as { from?: string } | null)?.from;
    setCameFrom(from && from !== FEEDBACK_PATH ? from : null);
  }, [isActive, state]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [includeContext, setIncludeContext] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  const sectionLabel = describeSection(cameFrom);
  const attachmentProblem = describeAttachmentProblem(files);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setProblem('Please add a title and some details.');
      return;
    }
    if (attachmentProblem) {
      setProblem(attachmentProblem);
      return;
    }
    setProblem(null);
    setSubmitState('sending');
    const context: FeedbackContext | null = includeContext
      ? { dataset: sectionLabel, selectedTime: '', pageUrl: `${window.location.origin}${cameFrom ?? '/'}` }
      : null;
    try {
      await submitFeedback({ title, body, email, context, files });
      setTitle('');
      setBody('');
      setEmail('');
      setFiles([]);
      setSubmitState('sent');
    } catch (error) {
      console.error(error);
      setSubmitState('failed');
    }
  };

  return (
    <div id="feedback-page" className="h-full w-full overflow-y-auto bg-stone-50">
      <div className="mx-auto w-full max-w-2xl px-6 py-10 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Feedback</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Help us make this better</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          Please share your suggestions, feedback, and any bugs you run into, anywhere in the Digital Twin. We read
          everything, and we&rsquo;ll work on it as soon as we can. Thank you for helping!
        </p>

        {submitState === 'sent' && (
          <div
            id="feedback-sent-notice"
            role="status"
            className="mt-6 flex items-start gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="text-sm leading-relaxed">
              Thank you! Your feedback was sent, and we&rsquo;ll take a look soon. Feel free to send more.
            </p>
          </div>
        )}

        <form id="feedback-form" onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-gray-800">
            Title
            <input
              id="feedback-title"
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A short summary"
              className={fieldClassName}
            />
          </label>

          <label className="block text-sm font-medium text-gray-800">
            Details
            <textarea
              id="feedback-body"
              required
              rows={8}
              maxLength={5000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What happened, or what would you like to see?"
              className={`${fieldClassName} resize-y`}
            />
          </label>

          <div>
            <label htmlFor="feedback-files" className="block text-sm font-medium text-gray-800">
              Attachments{' '}
              <span className="font-normal text-gray-500">
                (optional; up to {MAX_ATTACHMENTS} files, {formatMegabytes(3 * 1024 * 1024)} total)
              </span>
            </label>
            <input
              id="feedback-files"
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="mt-1 block w-full cursor-pointer text-sm text-gray-700 file:mr-3 file:cursor-pointer file:rounded-button file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-100"
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                    {file.name} ({formatMegabytes(file.size)})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="block text-sm font-medium text-gray-800">
            Email <span className="font-normal text-gray-500">(optional, if you&rsquo;d like a reply)</span>
            <input
              id="feedback-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClassName}
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              id="feedback-include-context"
              type="checkbox"
              checked={includeContext}
              onChange={(event) => setIncludeContext(event.target.checked)}
              className="mt-1 accent-emerald-700"
            />
            <span>
              Include the section I was in
              <span className="block text-xs text-gray-500">{sectionLabel}</span>
            </span>
          </label>

          <div role="status" className="min-h-5 text-sm">
            {(problem ?? attachmentProblem) && <p className="text-red-700">{problem ?? attachmentProblem}</p>}
            {submitState === 'failed' && (
              <p className="text-red-700">
                Your feedback could not be sent. Everything you typed is kept, so please try again.
              </p>
            )}
            {submitState === 'sending' && <p className="text-gray-600">Sending…</p>}
          </div>

          <div className="flex justify-end">
            <button
              id="feedback-submit"
              type="submit"
              disabled={submitState === 'sending'}
              className="inline-flex items-center gap-2 rounded-button bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              Send feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
