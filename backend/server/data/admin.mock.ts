import type { Report } from '@machinefit/shared';

export const mockReports: Report[] = [
  {
    id: 'report-1',
    reporterId: 'user-2',
    postId: 'post-1',
    reason: 'spam',
    description: 'Looks like promotional content',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
