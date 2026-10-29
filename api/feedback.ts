// Vercel serverless function: receives the feedback page's JSON and emails it
// through Resend (https://resend.com), which Vercel installs from its Marketplace.
// Vercel has no email service of its own. Server-side environment variables:
//   RESEND_API_KEY        added by the Resend Marketplace install
//   FEEDBACK_TO_EMAIL     where feedback arrives
//   FEEDBACK_FROM_EMAIL   sender on a domain verified in Resend, e.g. "Digital Twin feedback <feedback@yourdomain.org>".
//                         Resend's test sender "onboarding@resend.dev" only delivers to the Resend account owner's own address.

const MAX_ATTACHMENTS = 5;

type Attachment = { name: string; type: string; contentBase64: string };
type FeedbackPayload = {
  title: string;
  body: string;
  email: string | null;
  context: { dataset: string; selectedTime: string; pageUrl: string } | null;
  attachments: Attachment[];
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function parsePayload(raw: unknown): FeedbackPayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { title, body, email, context, attachments } = raw as Record<string, unknown>;
  if (!isText(title, 150) || !isText(body, 5000)) return null;
  if (email !== null && email !== undefined && !isText(email, 254)) return null;
  const files = Array.isArray(attachments) ? attachments : [];
  if (files.length > MAX_ATTACHMENTS) return null;
  const parsedFiles: Attachment[] = [];
  for (const file of files) {
    const { name, type, contentBase64 } = (file ?? {}) as Record<string, unknown>;
    if (!isText(name, 255) || typeof type !== 'string' || !isText(contentBase64, 6_000_000)) return null;
    parsedFiles.push({ name: name.replace(/[\\/]/g, '_'), type, contentBase64 });
  }
  const parsedContext =
    typeof context === 'object' && context !== null
      ? {
          dataset: String((context as Record<string, unknown>).dataset ?? '').slice(0, 200),
          selectedTime: String((context as Record<string, unknown>).selectedTime ?? '').slice(0, 200),
          pageUrl: String((context as Record<string, unknown>).pageUrl ?? '').slice(0, 500),
        }
      : null;
  return { title: title.trim(), body: body.trim(), email: typeof email === 'string' ? email.trim() : null, context: parsedContext, attachments: parsedFiles };
}

function buildHtml(payload: FeedbackPayload): string {
  const rows = [
    payload.email ? `<p><strong>Reply to:</strong> ${escapeHtml(payload.email)}</p>` : '<p><em>No email given.</em></p>',
    payload.context
      ? `<p><strong>Viewing:</strong> ${escapeHtml(payload.context.dataset)} · ${escapeHtml(payload.context.selectedTime)}<br><strong>Page:</strong> ${escapeHtml(payload.context.pageUrl)}</p>`
      : '<p><em>Sender did not include what they were viewing.</em></p>',
  ];
  return `${rows.join('')}<hr><p style="white-space:pre-wrap">${escapeHtml(payload.body)}</p>`;
}

export async function POST(request: Request): Promise<Response> {
  const { RESEND_API_KEY, FEEDBACK_TO_EMAIL, FEEDBACK_FROM_EMAIL } = process.env;
  const missing = Object.entries({ RESEND_API_KEY, FEEDBACK_TO_EMAIL, FEEDBACK_FROM_EMAIL })
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
  if (missing.length > 0) {
    // Variable names only, never values, so the reply is safe to show.
    return Response.json({ error: 'Feedback email is not configured.', missing }, { status: 503 });
  }

  let payload: FeedbackPayload | null;
  try {
    payload = parsePayload(await request.json());
  } catch {
    payload = null;
  }
  if (!payload) return Response.json({ error: 'Invalid feedback.' }, { status: 400 });

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FEEDBACK_FROM_EMAIL!.trim(),
      to: [FEEDBACK_TO_EMAIL!.trim()],
      reply_to: payload.email ?? undefined,
      subject: `[Digital Twin feedback] ${payload.title}`,
      html: buildHtml(payload),
      attachments: payload.attachments.map((file) => ({ filename: file.name, content: file.contentBase64 })),
    }),
  });
  if (!resendResponse.ok) {
    // Logged server-side only; Resend's message names the cause (unverified domain, bad key, and so on).
    console.error('Resend rejected the feedback email', resendResponse.status, await resendResponse.text());
    return Response.json({ error: 'Feedback could not be delivered.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
