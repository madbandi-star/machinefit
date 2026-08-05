/** Simple in-memory TTL cache for hot catalog / cohort reads. */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  /** In-flight factories — collapses stampede on cache miss under concurrency. */
  private inflight = new Map<string, Promise<T>>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
    this.inflight.delete(key);
  }

  /** Remove all keys that equal prefix or start with `${prefix}:`. */
  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key === prefix || key.startsWith(`${prefix}:`)) {
        this.store.delete(key);
      }
    }
    for (const key of this.inflight.keys()) {
      if (key === prefix || key.startsWith(`${prefix}:`)) {
        this.inflight.delete(key);
      }
    }
  }

  getOrSet(key: string, factory: () => Promise<T>, ttlMs = this.defaultTtlMs): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return Promise.resolve(hit);

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const created = factory()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, created);
    return created;
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }
}
