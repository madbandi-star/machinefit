import type { Post, Comment, MachineRequest } from '@machinefit/shared';
import type { BoardType } from '@machinefit/shared';

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    boardType: 'free',
    title: 'Best Hammer Strength machines for back?',
    content: 'Looking for recommendations on which Hammer Strength back machines give the best lat activation. Currently using Iso-Lateral High Row.',
    languageCode: 'en',
    isPinned: false,
    isHidden: false,
    viewCount: 42,
    likeCount: 5,
    commentCount: 2,
    authorName: 'FitnessFan',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'post-2',
    userId: 'user-2',
    boardType: 'free',
    title: 'Seat position tips for tall lifters',
    content: 'I am 190cm and struggle with seat settings on most machines. Share your tips!',
    languageCode: 'en',
    isPinned: false,
    isHidden: false,
    viewCount: 28,
    likeCount: 3,
    commentCount: 1,
    authorName: 'TallLifter',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    postId: 'post-1',
    userId: 'user-3',
    content: 'Iso-Lateral High Row is great. Try seat position 5-6 for 175-180cm height.',
    isHidden: false,
    authorName: 'GymPro',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    userId: 'user-1',
    content: 'Thanks! Will try that setting tomorrow.',
    isHidden: false,
    authorName: 'FitnessFan',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

export const mockLikes = new Set<string>(['user-3:post-1']);

export const mockMachineRequests: MachineRequest[] = [
  {
    id: 'req-1',
    userId: 'user-1',
    brandName: 'Hammer Strength',
    machineName: 'Pullover Machine',
    description: 'Would love to see settings for the Hammer Strength pullover.',
    status: 'pending',
    authorName: 'FitnessFan',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'req-2',
    userId: 'user-2',
    brandName: 'Cybex',
    machineName: 'VR3 Seated Row',
    description: 'Popular machine at my gym, please add Cybex VR3 series.',
    status: 'pending',
    authorName: 'TallLifter',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const devOwnerUserIds = new Set<string>();

export function likeKey(userId: string, postId: string) {
  return `${userId}:${postId}`;
}

export function filterPosts(boardType?: BoardType) {
  return mockPosts
    .filter((p) => !p.isHidden && (!boardType || p.boardType === boardType))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
