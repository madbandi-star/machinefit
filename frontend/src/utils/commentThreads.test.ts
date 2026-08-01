import { describe, expect, it } from 'vitest';
import { buildCommentThreads, resolveReplyRootId } from './commentThreads';

type C = { id: string; parentId?: string | null; createdAt: string; body: string };

function c(
  id: string,
  createdAt: string,
  parentId?: string | null,
  body = id
): C {
  return { id, createdAt, parentId, body };
}

describe('buildCommentThreads', () => {
  it('keeps top-level order and nests replies under the root', () => {
    const comments = [
      c('a', '2026-01-01T10:00:00Z'),
      c('b', '2026-01-01T11:00:00Z'),
      c('a1', '2026-01-01T12:00:00Z', 'a'),
      c('a2', '2026-01-01T13:00:00Z', 'a'),
      c('b1', '2026-01-01T14:00:00Z', 'b'),
    ];

    const threads = buildCommentThreads(comments);
    expect(threads.map((t) => t.root.id)).toEqual(['a', 'b']);
    expect(threads[0].replies.map((r) => r.id)).toEqual(['a1', 'a2']);
    expect(threads[1].replies.map((r) => r.id)).toEqual(['b1']);
  });

  it('collapses deep replies under the top-level root', () => {
    const comments = [
      c('root', '2026-01-01T10:00:00Z'),
      c('child', '2026-01-01T11:00:00Z', 'root'),
      c('grand', '2026-01-01T12:00:00Z', 'child'),
    ];

    const threads = buildCommentThreads(comments);
    expect(threads).toHaveLength(1);
    expect(threads[0].root.id).toBe('root');
    expect(threads[0].replies.map((r) => r.id)).toEqual(['child', 'grand']);
  });

  it('treats orphan parentId as a root', () => {
    const comments = [c('x', '2026-01-01T10:00:00Z', 'missing')];
    const threads = buildCommentThreads(comments);
    expect(threads).toHaveLength(1);
    expect(threads[0].root.id).toBe('x');
    expect(threads[0].replies).toEqual([]);
  });
});

describe('resolveReplyRootId', () => {
  it('returns the top-level parent for nested comments', () => {
    const comments = [
      c('root', '2026-01-01T10:00:00Z'),
      c('child', '2026-01-01T11:00:00Z', 'root'),
      c('grand', '2026-01-01T12:00:00Z', 'child'),
    ];
    expect(resolveReplyRootId('grand', comments)).toBe('root');
    expect(resolveReplyRootId('child', comments)).toBe('root');
    expect(resolveReplyRootId('root', comments)).toBe('root');
  });
});
