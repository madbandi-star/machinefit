import type { UserMotivationTrack } from '@machinefit/shared';
import { randomUUID } from 'node:crypto';

const tracks = new Map<string, UserMotivationTrack>();

function nowIso() {
  return new Date().toISOString();
}

export function listMockTracks(userId: string): UserMotivationTrack[] {
  return Array.from(tracks.values())
    .filter((track) => track.userId === userId)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function getMockTrack(userId: string, trackId: string): UserMotivationTrack | null {
  const track = tracks.get(trackId);
  if (!track || track.userId !== userId) return null;
  return track;
}

export function clearMockDefault(userId: string): void {
  for (const track of tracks.values()) {
    if (track.userId === userId && track.isDefault) {
      tracks.set(track.id, { ...track, isDefault: false, updatedAt: nowIso() });
    }
  }
}

export function setMockDefault(userId: string, trackId: string): void {
  clearMockDefault(userId);
  const track = getMockTrack(userId, trackId);
  if (track) {
    tracks.set(trackId, { ...track, isDefault: true, updatedAt: nowIso() });
  }
}

export function insertMockTrack(
  input: Omit<UserMotivationTrack, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  }
): UserMotivationTrack {
  const stamp = nowIso();
  const track: UserMotivationTrack = {
    ...input,
    id: input.id || randomUUID(),
    createdAt: input.createdAt ?? stamp,
    updatedAt: input.updatedAt ?? stamp,
  };
  tracks.set(track.id, track);
  return track;
}

export function updateMockTrack(
  userId: string,
  trackId: string,
  patch: Partial<Pick<UserMotivationTrack, 'title' | 'isDefault' | 'durationSeconds'>>
): UserMotivationTrack | null {
  const current = getMockTrack(userId, trackId);
  if (!current) return null;
  if (patch.isDefault === true) clearMockDefault(userId);
  const next: UserMotivationTrack = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  tracks.set(trackId, next);
  return next;
}

export function deleteMockTrack(userId: string, trackId: string): UserMotivationTrack | null {
  const current = getMockTrack(userId, trackId);
  if (!current) return null;
  tracks.delete(trackId);
  return current;
}
