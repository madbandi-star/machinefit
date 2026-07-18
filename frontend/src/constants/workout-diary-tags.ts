export const WORKOUT_DIARY_TAGS = [
  '워밍업',
  '선피로',
  '본세트',
  '드랍세트',
  '탑세트',
  '폼체크',
  'PR',
  'RPE8',
] as const;

export function formatDiaryTag(tag: string): string {
  return `[${tag}]`;
}
