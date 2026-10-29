// Vercel serverless function: receives the feedback page's JSON and emails it
// over SMTP (the standard mail-server protocol), for example through Google
// Workspace. Set these in the Vercel project's environment variables:
//   SMTP_HOST             e.g. smtp.gmail.com
//   SMTP_PORT             465 (implicit TLS, default) or 587 (STARTTLS)
//   SMTP_USER             the mailbox that sends, e.g. feedback@yourdomain.org
//   SMTP_PASSWORD         a Google "app password", not the account's normal password
//   FEEDBACK_TO_EMAIL     where feedback arrives
// Vercel allows outbound ports 465 and 587; port 25 is blocked.

import nodemailer from 'nodemailer';

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
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, FEEDBACK_TO_EMAIL } = process.env;
  const port = Number(process.env.SMTP_PORT ?? 465);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !FEEDBACK_TO_EMAIL) {
    return Response.json({ error: 'Feedback email is not configured.' }, { status: 503 });
  }

  let payload: FeedbackPayload | null;
  try {
    payload = parsePayload(await request.json());
  } catch {
    payload = null;
  }
  if (!payload) return Response.json({ error: 'Invalid feedback.' }, { status: 400 });

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  try {
    // Awaited: a Vercel function stops as soon as it responds, so the send must finish first.
    await transporter.sendMail({
      from: SMTP_USER,
      to: FEEDBACK_TO_EMAIL,
      replyTo: payload.email ?? undefined,
      subject: `[Creek feedback] ${payload.title}`,
      html: buildHtml(payload),
      attachments: payload.attachments.map((file) => ({
        filename: file.name,
        content: file.contentBase64,
        encoding: 'base64',
        contentType: file.type,
      })),
    });
  } catch (error) {
    console.error('SMTP send failed', error);
    return Response.json({ error: 'Feedback could not be delivered.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
