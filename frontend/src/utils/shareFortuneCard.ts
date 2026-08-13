import type { FortuneScores, FortuneSection } from '@machinefit/shared';
import { SITE_DOMAIN } from '@/config/site';
import { keywordEmoji } from '@/components/fortune/fortuneVisuals';
import {
  buildFortuneShareCard,
  type FortuneShareCardLabels,
} from '@/utils/fortuneShareCard';
import { buildShareHashtags, toShareHashtag } from '@/utils/shareHashtags';

export interface ShareFortuneCardParams {
  fortune: FortuneSection;
  scores: FortuneScores;
  themeLabel: string;
  dateLabel: string;
  labels: Omit<FortuneShareCardLabels, 'hashtags'> & { shareHashtags: string };
  displayName?: string | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  shareSavedMessage: string;
  errorMessage: string;
}

/** Build PNG + Web Share / download — same flow as Lifter DNA share. */
export async function shareFortuneCard(params: ShareFortuneCardParams): Promise<void> {
  const {
    fortune,
    scores,
    themeLabel,
    dateLabel,
    labels,
    displayName,
    showToast,
    shareSavedMessage,
    errorMessage,
  } = params;

  try {
    const hashtags = buildShareHashtags(
      [toShareHashtag(displayName)].filter(Boolean),
      labels.shareHashtags
    );
    const blob = await buildFortuneShareCard({
      fortune,
      scores,
      emoji: keywordEmoji(fortune.keyword),
      themeLabel,
      dateLabel,
      labels: {
        title: labels.title,
        healthman: labels.healthman,
        prLuck: labels.prLuck,
        recoveryLuck: labels.recoveryLuck,
        tagline: labels.tagline,
        hashtags,
      },
    });

    const file = new File([blob], 'machinefit-fortune.png', { type: 'image/png' });
    const headline = fortune.keywordTitle || fortune.title;
    const text = `${labels.title}\n${headline}\n${SITE_DOMAIN}\n${labels.shareHashtags}`;

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: labels.title });
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machinefit-fortune.png';
    a.click();
    URL.revokeObjectURL(url);
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    showToast(shareSavedMessage, 'success');
  } catch {
    showToast(errorMessage, 'error');
  }
}
