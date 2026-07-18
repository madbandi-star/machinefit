import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendViaSmtp(input: SendEmailInput): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;

  const nodemailerModule = await import('nodemailer');
  const nodemailer = nodemailerModule.default ?? nodemailerModule;
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<pre>${escapeHtml(input.text)}</pre>`,
  });

  return true;
}

async function sendViaResend(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM ?? 'MachineFit <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed (${res.status}): ${body}`);
  }

  return true;
}

function sendViaBrowserScript(input: SendEmailInput): boolean {
  if (process.env.EMAIL_BROWSER_FALLBACK !== 'true') return false;

  const scriptPath = join(__dirname, '..', '..', '..', '..', 'scripts', 'send-email-browser.mjs');
  const result = spawnSync(
    process.execPath,
    [scriptPath, input.to, input.subject, input.text],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );

  return result.status === 0;
}

export const emailService = {
  async send(input: SendEmailInput): Promise<{ method: 'smtp' | 'resend' | 'browser' }> {
    if (await sendViaSmtp(input)) {
      return { method: 'smtp' };
    }

    if (await sendViaResend(input)) {
      return { method: 'resend' };
    }

    if (sendViaBrowserScript(input)) {
      return { method: 'browser' };
    }

    throw new Error(
      'Email not configured. Set SMTP_*, RESEND_API_KEY, or EMAIL_BROWSER_FALLBACK=true with Playwright.'
    );
  },
};
