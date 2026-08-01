export type ThreadableComment = {
  id: string;
  parentId?: string | null;
  createdAt: string;
};

export type CommentThread<T extends ThreadableComment> = {
  root: T;
  replies: T[];
};

function sortByCreatedAt<T extends ThreadableComment>(a: T, b: T): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/** Walk up parent links to the top-level comment id. */
export function resolveReplyRootId<T extends ThreadableComment>(
  commentId: string,
  comments: T[]
): string {
  const byId = new Map(comments.map((c) => [c.id, c]));
  let current = byId.get(commentId);
  if (!current) return commentId;
  let guard = 0;
  while (current.parentId && byId.has(current.parentId) && guard < 32) {
    current = byId.get(current.parentId)!;
    guard += 1;
  }
  return current.id;
}

/**
 * One-level threads: top-level comments with their direct/indirect replies
 * collapsed under the root, sorted by createdAt within each group.
 */
export function buildCommentThreads<T extends ThreadableComment>(
  comments: T[]
): CommentThread<T>[] {
  const byId = new Map(comments.map((c) => [c.id, c]));
  const roots: T[] = [];
  const repliesByRoot = new Map<string, T[]>();

  for (const comment of comments) {
    const parentId = comment.parentId || undefined;
    if (!parentId || !byId.has(parentId)) {
      roots.push(comment);
      continue;
    }

    const rootId = resolveReplyRootId(parentId, comments);
    // Never nest a comment under itself.
    if (rootId === comment.id) {
      roots.push(comment);
      continue;
    }
    const list = repliesByRoot.get(rootId) ?? [];
    list.push(comment);
    repliesByRoot.set(rootId, list);
  }

  roots.sort(sortByCreatedAt);
  return roots.map((root) => ({
    root,
    replies: (repliesByRoot.get(root.id) ?? []).sort(sortByCreatedAt),
  }));
}
