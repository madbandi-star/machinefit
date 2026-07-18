const TO = 'madbandi@gmail.com';
const SUBJECT = '[MachineFit] 13개 기능 개발 완료';
const MESSAGE = `MachineFit 13개 기능 개발이 완료되었습니다.

1단계: 기록변경 저장, 기록 삭제, 일지 태그, 로그인 페이지, 앱 공유
2단계: 나이/헬스장/운동목표 프로필, 스미스/프리웨이트 부위 선택
3단계: 세트 완료, 추천 피드백, 휴식 타이머, 이전 수행량 비교
4단계: 일일 운동 브리핑, 운동 보고서 이메일

DB 마이그레이션 021~025 적용 완료.
프론트/백엔드 빌드 완료.

— MachineFit 자동 알림`;

async function sendViaFormSubmit() {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TO)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: SUBJECT,
      _template: 'table',
      message: MESSAGE,
      email: 'machinefit@noreply.local',
      name: 'MachineFit',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`FormSubmit failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function sendViaSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: TO,
    subject: SUBJECT,
    text: MESSAGE,
    html: `<pre>${MESSAGE}</pre>`,
  });
  return true;
}

try {
  if (await sendViaSmtp()) {
    console.log(`Email sent via SMTP to ${TO}`);
  } else {
    await sendViaFormSubmit();
    console.log(`Email submitted via FormSubmit to ${TO}`);
  }
} catch (err) {
  console.error('Email send failed:', err);
  process.exit(1);
}
