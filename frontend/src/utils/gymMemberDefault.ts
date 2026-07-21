import { gymMemberApi } from '@/api';

function sortByCreatedAtAsc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

/** First registered member for a gym, or null if none. */
export async function fetchDefaultMemberId(gymId: string): Promise<string | null> {
  const res = await gymMemberApi.list(gymId);
  const ordered = sortByCreatedAtAsc(res.data.data ?? []);
  return ordered[0]?.id ?? null;
}

export function sortMembersByRegistrationOrder<T extends { createdAt: string }>(
  items: T[]
): T[] {
  return sortByCreatedAtAsc(items);
}
