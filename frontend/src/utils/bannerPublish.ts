/** Reasons a banner will not appear on the public app (matches backend listPublicForSlot). */
export type BannerPublishBlocker =
  | 'inactive'
  | 'noImage'
  | 'noSlots'
  | 'notStarted'
  | 'ended';

export function getBannerPublishBlockers(input: {
  status: string;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  slots?: unknown[] | null;
  startAt?: string | null;
  endAt?: string | null;
  now?: Date;
}): BannerPublishBlocker[] {
  const now = input.now ?? new Date();
  const blockers: BannerPublishBlocker[] = [];

  if (input.status !== 'active') blockers.push('inactive');
  if (!input.imageUrl && !input.mobileImageUrl) blockers.push('noImage');
  if (!input.slots || input.slots.length === 0) blockers.push('noSlots');

  if (input.startAt) {
    const start = new Date(input.startAt);
    if (!Number.isNaN(start.getTime()) && start.getTime() > now.getTime()) {
      blockers.push('notStarted');
    }
  }
  if (input.endAt) {
    const end = new Date(input.endAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) {
      blockers.push('ended');
    }
  }

  return blockers;
}
