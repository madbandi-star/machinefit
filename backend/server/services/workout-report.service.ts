import { z } from 'zod';
import { isFreeWeightMachineCode, isAllGymsId } from '@machinefit/shared';
import { userRepository } from '../repositories/user.repository.js';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { emailService } from './email.service.js';

const reportPeriodSchema = z.enum(['day', 'week', 'month', 'year']);

function getPeriodRange(period: z.infer<typeof reportPeriodSchema>): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const to = `${y}-${m}-${d}`;

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

  return {
    from: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    to,
  };
}

const PERIOD_LABELS: Record<z.infer<typeof reportPeriodSchema>, string> = {
  day: '오늘',
  week: '이번 주',
  month: '이번 달',
  year: '올해',
};

const TARGET_MUSCLE_LABELS: Record<string, string> = {
  back: '등',
  chest: '가슴',
  legs: '하체',
  shoulders: '어깨',
  biceps: '이두',
  triceps: '삼두',
};

function formatLogMachineLabel(
  log: Awaited<ReturnType<typeof workoutLogRepository.listByUser>>[number]
): string {
  const brandPrefix =
    log.brandName && !isFreeWeightMachineCode(log.machineCode)
      ? `${log.brandName} · `
      : '';
  if (isFreeWeightMachineCode(log.machineCode)) {
    const equipment = log.machineName ?? log.machineCode;
    const muscle = log.targetMuscleGroup
      ? (TARGET_MUSCLE_LABELS[log.targetMuscleGroup] ?? log.targetMuscleGroup)
      : '';
    return muscle ? `${equipment} · ${muscle}` : equipment;
  }
  return `${brandPrefix}${log.machineName ?? log.machineCode}`;
}

function getLogVolumeKg(log: Awaited<ReturnType<typeof workoutLogRepository.listByUser>>[number]): number {
  return log.setWeightsKg.reduce((sum, weight) => sum + weight, 0);
}

function formatSetWeights(setWeightsKg: number[]): string {
  if (setWeightsKg.length === 0) return '-';
  return setWeightsKg.map((weight) => `${weight}kg`).join(', ');
}

function buildReportText(options: {
  displayName: string;
  gymName: string;
  period: z.infer<typeof reportPeriodSchema>;
  from: string;
  to: string;
  logs: Awaited<ReturnType<typeof workoutLogRepository.listByUser>>;
}): string {
  const totalSets = options.logs.reduce((sum, log) => sum + log.setCount, 0);
  const totalVolume = options.logs.reduce((sum, log) => sum + getLogVolumeKg(log), 0);
  const periodLabel = PERIOD_LABELS[options.period];

  const lines = [
    'MachineFit 운동 보고서',
    '',
    `헬스장: ${options.gymName}`,
    `${options.displayName}님`,
    `기간: ${periodLabel} (${options.from} ~ ${options.to})`,
    '',
    '[요약]',
    `- 운동 기록: ${options.logs.length}건`,
    `- 총 세트: ${totalSets}회`,
    `- 총 수행량: ${totalVolume.toFixed(1)}kg`,
    '',
  ];

  if (options.logs.length === 0) {
    lines.push('선택한 기간에 운동 기록이 없습니다.');
    return lines.join('\n');
  }

  lines.push('[상세 기록]');
  for (const log of options.logs) {
    const machineLabel = formatLogMachineLabel(log);
    const volume = getLogVolumeKg(log);
    lines.push(
      `· ${log.logDate} | ${machineLabel} | ${log.setCount}세트 | ${formatSetWeights(log.setWeightsKg)} (합 ${volume.toFixed(1)}kg)`
    );
  }

  return lines.join('\n');
}

function buildReportHtml(options: {
  displayName: string;
  gymName: string;
  period: z.infer<typeof reportPeriodSchema>;
  from: string;
  to: string;
  logs: Awaited<ReturnType<typeof workoutLogRepository.listByUser>>;
}): string {
  const totalSets = options.logs.reduce((sum, log) => sum + log.setCount, 0);
  const totalVolume = options.logs.reduce((sum, log) => sum + getLogVolumeKg(log), 0);
  const periodLabel = PERIOD_LABELS[options.period];

  const rows = options.logs
    .map((log) => {
      const volume = getLogVolumeKg(log);
      const machineLabel = formatLogMachineLabel(log);
      return `<tr><td>${log.logDate}</td><td>${machineLabel}</td><td>${log.setCount}</td><td>${formatSetWeights(log.setWeightsKg)}</td><td>${volume.toFixed(1)}kg</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html><html><body>
    <h1>MachineFit 운동 보고서</h1>
    <p><strong>${options.gymName}</strong></p>
    <p>${options.displayName}님 · ${periodLabel} (${options.from} ~ ${options.to})</p>
    <ul>
      <li>기록 수: ${options.logs.length}건</li>
      <li>총 세트: ${totalSets}회</li>
      <li>총 수행량: ${totalVolume.toFixed(1)}kg</li>
    </ul>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>날짜</th><th>머신</th><th>세트</th><th>중량</th><th>수행량</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">기록 없음</td></tr>'}</tbody>
    </table>
  </body></html>`;
}

export const workoutReportService = {
  async send(
    userId: string,
    period: z.infer<typeof reportPeriodSchema>,
    options?: { previewOnly?: boolean; gymId?: string; memberId?: string }
  ) {
    reportPeriodSchema.parse(period);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const { userGymService } = await import('./user-gym.service.js');
    const { userGymRepository } = await import('../repositories/user-gym.repository.js');
    const gymScopeId = options?.gymId ?? (await userGymRepository.getActiveGymId(userId));
    if (!gymScopeId) throw new AppError(400, 'NO_GYM', 'No active gym selected');

    let gymName: string;
    let gymIds: string[] | null | undefined;

    if (isAllGymsId(gymScopeId)) {
      const { gymScopeService } = await import('./gym-scope.service.js');
      const resolved = await gymScopeService.resolveGymFilter(userId, gymScopeId);
      gymIds = resolved.gymIds;
      gymName = '전체 헬스장';
    } else {
      const gym = await userGymService.assertOwned(userId, gymScopeId);
      gymName = gym.name;
    }

    const { from, to } = getPeriodRange(period);
    const logs = await workoutLogRepository.listByUser(userId, {
      gymId: gymScopeId,
      gymIds,
      memberId: options?.memberId,
      from,
      to,
    });
    const html = buildReportHtml({
      displayName: user.displayName,
      gymName,
      period,
      from,
      to,
      logs,
    });
    const text = buildReportText({
      displayName: user.displayName,
      gymName,
      period,
      from,
      to,
      logs,
    });

    const yearMonth = `${from.slice(0, 4)}년 ${Number(from.slice(5, 7))}월`;
    const subject =
      isAllGymsId(gymScopeId)
        ? period === 'month'
          ? `[MachineFit] 전체 헬스장 ${yearMonth} 운동 리포트`
          : `[MachineFit] 전체 헬스장 ${PERIOD_LABELS[period]} 운동 리포트 (${from}~${to})`
        : period === 'month'
          ? `[MachineFit] ${gymName} ${yearMonth} 운동 리포트`
          : `[MachineFit] ${gymName} ${PERIOD_LABELS[period]} 운동 리포트 (${from}~${to})`;
    const reportPayload = {
      reportHtml: html,
      reportSubject: subject,
      reportText: text,
    };

    if (options?.previewOnly) {
      return {
        message: 'Report preview ready.',
        emailSent: false,
        ...reportPayload,
      };
    }

    try {
      const delivery = await emailService.send({
        to: user.email,
        subject,
        text,
        html,
      });
      return {
        message: logs.length ? 'Report sent to your email.' : 'Report sent (no logs in period).',
        emailSent: true,
        emailMethod: delivery.method,
        ...reportPayload,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Email delivery failed';
      return {
        message: 'Email service unavailable. Report is ready to copy or share.',
        emailSent: false,
        emailError: reason,
        ...reportPayload,
      };
    }
  },
};
