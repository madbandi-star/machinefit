import type {
  PhotoPost,
  PhotoPostComment,
  PhotoPostImageMeta,
  PhotoPostReport,
  PhotoUserBlock,
} from '@machinefit/shared';
import { publicApiBase } from '../utils/public-api-base.js';

function imageUrls(imageId: string): Pick<PhotoPostImageMeta, 'thumbUrl' | 'mainUrl'> {
  const base = `${publicApiBase()}/photo-board/images/${imageId}`;
  return {
    thumbUrl: `${base}?variant=thumb`,
    mainUrl: `${base}?variant=main`,
  };
}

const now = new Date().toISOString();

export const mockPhotoImages = new Map<
  string,
  { mimeType: string; imageData: Buffer; thumbnailData: Buffer; width: number; height: number }
>();

/** 1x1 transparent webp placeholders for mock mode. */
const TINY_WEBP = Buffer.from(
  'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
  'base64'
);

function seedImage(id: string) {
  mockPhotoImages.set(id, {
    mimeType: 'image/webp',
    imageData: TINY_WEBP,
    thumbnailData: TINY_WEBP,
    width: 1,
    height: 1,
  });
  return {
    id,
    postId: '',
    sortOrder: 0,
    mimeType: 'image/webp',
    width: 1,
    height: 1,
    ...imageUrls(id),
  } satisfies PhotoPostImageMeta;
}

const img1 = seedImage('00000000-0000-4000-8000-000000000101');
const img2 = seedImage('00000000-0000-4000-8000-000000000102');

export const mockPhotoPosts: PhotoPost[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    userId: '00000000-0000-4000-8000-000000000001',
    title: '오늘의 머신핏',
    content: '사진게시판 샘플 게시글입니다.',
    viewCount: 12,
    likeCount: 3,
    commentCount: 1,
    isHidden: false,
    authorName: 'Demo',
    tags: ['workout', 'machinefit'],
    coverImage: { ...img1, postId: '00000000-0000-4000-8000-000000000201', sortOrder: 0 },
    images: [
      { ...img1, postId: '00000000-0000-4000-8000-000000000201', sortOrder: 0 },
      { ...img2, postId: '00000000-0000-4000-8000-000000000201', sortOrder: 1 },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export const mockPhotoComments: PhotoPostComment[] = [
  {
    id: '00000000-0000-4000-8000-000000000301',
    postId: '00000000-0000-4000-8000-000000000201',
    userId: '00000000-0000-4000-8000-000000000002',
    content: '멋져요!',
    isHidden: false,
    authorName: 'Member',
    createdAt: now,
    updatedAt: now,
  },
];

export const mockPhotoLikes = new Set<string>();
export const mockPhotoReports: PhotoPostReport[] = [];
export const mockPhotoBlocks: PhotoUserBlock[] = [];

export function photoLikeKey(userId: string, postId: string) {
  return `${userId}:${postId}`;
}
