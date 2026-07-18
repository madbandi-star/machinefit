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

function getFormSubmitOrigin(): string {
  const configured = process.env.FORMSUBMIT_ORIGIN?.trim();
  if (configured) return configured;

  const corsOrigin = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  if (corsOrigin) return corsOrigin;

  return 'https://madbandi-star.github.io';
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

async function sendViaFormSubmit(input: SendEmailInput): Promise<boolean> {
  if (process.env.FORMSUBMIT_FALLBACK === 'false') return false;

  const origin = getFormSubmitOrigin();
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(input.to)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: origin,
      Referer: `${origin}/`,
    },
    body: JSON.stringify({
      _subject: input.subject,
      _template: 'table',
      _captcha: 'false',
      message: input.text,
      html_report: input.html?.slice(0, 8000) ?? '',
      email: 'machinefit@noreply.local',
      name: 'MachineFit',
    }),
  });

  const data = (await res.json()) as { success?: string | boolean; message?: string };
  const ok = data.success === 'true' || data.success === true;

  if (!ok) {
    const message = data.message ?? 'FormSubmit failed';
    if (/activation|activate/i.test(message)) {
      throw new Error(`FORMSUBMIT_ACTIVATION: ${message}`);
    }
    throw new Error(message);
  }

  return true;
}

function sendViaBrowserScript(input: SendEmailInput): boolean {
  if (process.env.EMAIL_BROWSER_FALLBACK !== 'true') return false;

  const scriptPath = join(__dirname, '..', '..', '..', 'scripts', 'send-email-browser.mjs');
  const result = spawnSync(
    process.execPath,
    [scriptPath, input.to, input.subject, input.text],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );

  return result.status === 0;
}

export const emailService = {
  async send(input: SendEmailInput): Promise<{ method: 'smtp' | 'resend' | 'formsubmit' | 'browser' }> {
    if (await sendViaSmtp(input)) {
      return { method: 'smtp' };
    }

    if (await sendViaResend(input)) {
      return { method: 'resend' };
    }

    if (await sendViaFormSubmit(input)) {
      return { method: 'formsubmit' };
    }

    if (sendViaBrowserScript(input)) {
      return { method: 'browser' };
    }

    throw new Error(
      'Email not configured. Set SMTP_*, RESEND_API_KEY, or enable FormSubmit fallback.'
    );
  },
};
