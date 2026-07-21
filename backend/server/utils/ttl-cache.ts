/** Simple in-memory TTL cache for hot catalog / cohort reads. */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

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

  getOrSet(key: string, factory: () => Promise<T>, ttlMs = this.defaultTtlMs): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return Promise.resolve(hit);
    return factory().then((value) => {
      this.set(key, value, ttlMs);
      return value;
    });
  }

  clear(): void {
    this.store.clear();
  }
}
