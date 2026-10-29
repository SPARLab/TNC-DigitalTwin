// ============================================================================
// feedbackService — validates attachments and posts feedback to the Vercel
// function in api/feedback.ts, which emails it to the team over SMTP.
// ============================================================================

/** Same-origin Vercel function. `npm run dev` does not serve it; use `vercel dev` to try the full path. */
export const FEEDBACK_ENDPOINT = '/api/feedback';

export const MAX_ATTACHMENTS = 5;
/** Raw bytes. Base64 adds a third, which must stay under Vercel's 4.5 MB request limit. */
export const MAX_ATTACHMENT_BYTES_TOTAL = 3 * 1024 * 1024;

export interface FeedbackContext {
  /** Section the visitor came from, for example "Data Catalog". */
  dataset: string;
  selectedTime: string;
  pageUrl: string;
}

export interface FeedbackSubmission {
  title: string;
  body: string;
  email: string;
  context: FeedbackContext | null;
  files: File[];
}

interface EncodedAttachment {
  name: string;
  type: string;
  contentBase64: string;
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns a plain-words problem with the chosen files, or null when they are fine. */
export function describeAttachmentProblem(files: readonly { size: number }[]): string | null {
  if (files.length > MAX_ATTACHMENTS) return `Please attach at most ${MAX_ATTACHMENTS} files.`;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_ATTACHMENT_BYTES_TOTAL) {
    return `Attachments total ${formatMegabytes(total)}; the limit is ${formatMegabytes(MAX_ATTACHMENT_BYTES_TOTAL)}.`;
  }
  return null;
}

async function encodeAttachment(file: File): Promise<EncodedAttachment> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return { name: file.name, type: file.type || 'application/octet-stream', contentBase64: btoa(binary) };
}

/** Throws when the function is unreachable or rejects the feedback. */
export async function submitFeedback(submission: FeedbackSubmission): Promise<void> {
  const attachments = await Promise.all(submission.files.map(encodeAttachment));
  const response = await fetch(FEEDBACK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: submission.title.trim(),
      body: submission.body.trim(),
      email: submission.email.trim() || null,
      context: submission.context,
      attachments,
    }),
  });
  if (!response.ok) throw new Error(`Feedback endpoint responded ${response.status}`);
}
