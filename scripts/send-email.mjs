import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TO = 'madbandi@gmail.com';

function loadEnvFromBackend() {
  try {
    const envPath = join(__dirname, '..', 'backend', '.env');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    /* optional */
  }
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendViaSmtp(to, subject, message) {
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
    to,
    subject,
    text: message,
    html: `<pre>${escapeHtml(message)}</pre>`,
  });
  return true;
}

async function sendViaResend(to, subject, message) {
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
      to: [to],
      subject,
      text: message,
      html: `<pre>${escapeHtml(message)}</pre>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed (${res.status}): ${body}`);
  }

  return true;
}

async function sendViaBrowser(to, subject, message) {
  const scriptPath = join(__dirname, 'send-email-browser.mjs');
  const result = spawnSync(process.execPath, [scriptPath, to, subject, message], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (result.status === 0) {
    return output;
  }

  throw new Error(output || `Browser email failed with exit code ${result.status}`);
}

export async function sendEmail(options) {
  const to = options.to ?? DEFAULT_TO;
  const subject = options.subject;
  const message = options.message;

  if (await sendViaSmtp(to, subject, message)) {
    return { method: 'smtp', to };
  }

  if (await sendViaResend(to, subject, message)) {
    return { method: 'resend', to };
  }

  const browserOutput = await sendViaBrowser(to, subject, message);
  console.log(browserOutput);
  return { method: 'formsubmit-browser', to };
}

loadEnvFromBackend();

const isMain =
  process.argv[1]?.replace(/\\/g, '/').endsWith('send-email.mjs') ||
  import.meta.url.replace(/\\/g, '/').endsWith(process.argv[1]?.replace(/\\/g, '/'));

if (isMain) {
  const subject = process.argv[2] ?? '[MachineFit] 테스트 이메일';
  const message =
    process.argv[3] ??
    `MachineFit 이메일 발송 테스트입니다.\n\n발송 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n\n— MachineFit`;

  sendEmail({ subject, message })
    .then((result) => {
      console.log(`Email sent via ${result.method} to ${result.to}`);
    })
    .catch((err) => {
      console.error(err.message ?? err);
      process.exit(1);
    });
}
