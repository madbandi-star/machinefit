import {
  formatVolumeKg,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { SITE_DOMAIN } from '@/config/site';
import { buildWorkoutCompleteShareCard } from '@/utils/workoutCompleteShareCard';
import { buildShareHashtags } from '@/utils/shareHashtags';

export async function shareWorkoutCompleteCard(input: {
  report: WorkoutCompleteReport;
  labels: {
    title: string;
    exercises: string;
    sets: string;
    volume: string;
    power: string;
    newRecord: string;
    keepGoing: string;
    shareHashtags: string;
  };
  shareText: string;
  showToast: (message: string, type: 'success' | 'error') => void;
  shareSavedMessage: string;
  errorMessage: string;
}): Promise<void> {
  const { report, labels, shareText, showToast, shareSavedMessage, errorMessage } = input;

  try {
    const hashtags = buildShareHashtags([], labels.shareHashtags);
    const blob = await buildWorkoutCompleteShareCard({
      report,
      labels: { ...labels, hashtags },
    });
    const file = new File([blob], 'machinefit-todays-workout.png', { type: 'image/png' });
    const text = `${shareText}\n${SITE_DOMAIN}\n${labels.shareHashtags}`;

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: labels.title });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machinefit-todays-workout.png';
    a.click();
    URL.revokeObjectURL(url);
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    showToast(shareSavedMessage, 'success');
  } catch {
    showToast(errorMessage, 'error');
  }
}

export function buildWorkoutShareCaption(
  report: WorkoutCompleteReport,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const s = report.summary;
  const base = t(`workoutComplete.shareCaption.${report.shareTextKey}`, {
    exercises: s.exerciseCount,
    sets: s.setCount,
    volume: formatVolumeKg(s.totalVolumeKg),
    duration: formatWorkoutDurationCompact(s.durationMs),
    power: report.power?.balance ?? 0,
    earned: report.power?.earnedToday ?? 0,
  });
  return base;
}
