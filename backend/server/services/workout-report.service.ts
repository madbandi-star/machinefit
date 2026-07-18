import { z } from 'zod';
import { userRepository } from '../repositories/user.repository.js';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { emailService } from './email.service.js';

const reportPeriodSchema = z.enum(['day', 'week', 'month', 'year']);

function getPeriodRange(period: z.infer<typeof reportPeriodSchema>): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  const start = new Date(now);
  if (period === 'day') {
    return { from: to, to };
  }
  if (period === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (period === 'month') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }

  return { from: start.toISOString().slice(0, 10), to };
}

function buildReportHtml(options: {
  displayName: string;
  period: string;
  from: string;
  to: string;
  logs: Awaited<ReturnType<typeof workoutLogRepository.listByUser>>;
}): string {
  const totalSets = options.logs.reduce((sum, log) => sum + log.setCount, 0);
  const totalVolume = options.logs.reduce(
    (sum, log) => sum + log.setWeightsKg.reduce((a, b) => a + b, 0),
    0
  );

  const rows = options.logs
    .map(
      (log) =>
        `<tr><td>${log.logDate}</td><td>${log.machineName ?? log.machineCode}</td><td>${log.setCount}</td><td>${log.setWeightsKg.reduce((a, b) => a + b, 0).toFixed(1)}kg</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><body>
    <h1>MachineFit 운동 보고서</h1>
    <p>${options.displayName}님 · ${options.period} (${options.from} ~ ${options.to})</p>
    <ul>
      <li>기록 수: ${options.logs.length}건</li>
      <li>총 세트: ${totalSets}회</li>
      <li>총 수행량: ${totalVolume.toFixed(1)}kg</li>
    </ul>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>날짜</th><th>머신</th><th>세트</th><th>수행량</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">기록 없음</td></tr>'}</tbody>
    </table>
  </body></html>`;
}

export const workoutReportService = {
  async send(userId: string, period: z.infer<typeof reportPeriodSchema>) {
    reportPeriodSchema.parse(period);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const { from, to } = getPeriodRange(period);
    const logs = await workoutLogRepository.listByUser(userId, { from, to });
    const html = buildReportHtml({
      displayName: user.displayName,
      period,
      from,
      to,
      logs,
    });

    const subject = `[MachineFit] ${period} 운동 보고서 (${from}~${to})`;
    const text = `${user.displayName}님 · ${period} 운동 보고서 (${from} ~ ${to})\n기록 ${logs.length}건`;

    try {
      await emailService.send({
        to: user.email,
        subject,
        text,
        html,
      });
    } catch {
      throw new AppError(
        503,
        'EMAIL_NOT_CONFIGURED',
        'Email service is not configured. Add SMTP or Resend settings on the server.'
      );
    }

    return { message: logs.length ? 'Report sent to your email.' : 'Report sent (no logs in period).' };
  },
};
