import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function escapeJsString(value) {
  return JSON.stringify(value);
}

function buildHtml(to, subject, message) {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /><title>MachineFit Email</title></head>
<body data-status="pending">
  <p id="status">전송 중…</p>
  <script>
    fetch('https://formsubmit.co/ajax/${encodeURIComponent(to)}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: ${escapeJsString(subject)},
        _template: 'table',
        _captcha: 'false',
        message: ${escapeJsString(message)},
        email: 'machinefit@noreply.local',
        name: 'MachineFit',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const ok = data.success === 'true' || data.success === true;
        const needsActivation = /activation|activate/i.test(data.message ?? '');
        document.body.dataset.status = ok ? 'ok' : needsActivation ? 'activation' : 'error';
        document.getElementById('status').textContent = ok
          ? '전송 요청 완료'
          : needsActivation
            ? data.message
            : '실패: ' + (data.message || JSON.stringify(data));
      })
      .catch((err) => {
        document.body.dataset.status = 'error';
        document.getElementById('status').textContent = '오류: ' + err.message;
      });
  </script>
</body>
</html>`;
}

function startStaticServer(html) {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

const to = process.argv[2]?.trim();
if (!to) {
  console.error('Usage: node send-email-browser.mjs <to> [subject] [message]');
  process.exit(1);
}
const subject = process.argv[3] ?? '[MachineFit] 알림';
const message =
  process.argv[4] ??
  `MachineFit 알림\n\n발송 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n\n— MachineFit`;

const { server, url } = await startStaticServer(buildHtml(to, subject, message));

try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.dataset.status !== 'pending', { timeout: 15000 });

  const status = await page.evaluate(() => ({
    status: document.body.dataset.status,
    message: document.getElementById('status')?.textContent ?? '',
  }));

  await browser.close();

  if (status.status === 'ok') {
    console.log(`Email submitted via FormSubmit (browser) to ${to}`);
    console.log(status.message);
  } else if (status.status === 'activation' || /activation|activate/i.test(status.message)) {
    console.log(`FormSubmit activation email sent to ${to}`);
    console.log(status.message);
    process.exit(1);
  } else {
    console.error('FormSubmit failed:', status.message);
    process.exit(1);
  }
} finally {
  server.close();
}
