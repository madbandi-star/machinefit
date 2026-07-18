export const WORKOUT_DIARY_TAGS = [
  '선피로',
  '탑세트',
  'PR',
  'RPE8',
  '폼체크',
  '드랍세트',
] as const;

export function formatDiaryTag(tag: string): string {
  return `[${tag}]`;
}
