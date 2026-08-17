/** Lightweight IndexedDB helpers for workout drafts + sync queue (no Dexie). */

const DB_NAME = 'machinefit-workout-offline';
const DB_VERSION = 1;
const DRAFTS = 'workoutDrafts';
const QUEUE = 'syncQueue';
const META = 'meta';

export type WorkoutDraftRecord = {
  key: string;
  gymId: string;
  memberId: string;
  machineCode: string;
  logDate: string;
  targetMuscleGroup?: string;
  setCount: number;
  setWeightsKg: number[];
  setCompleted: boolean[];
  diary?: string;
  updatedAt: number;
};

export type SyncQueueItem = {
  id: string;
  clientActionId: string;
  idempotencyKey: string;
  method: 'PUT';
  path: '/workout-logs';
  body: Record<string, unknown>;
  attempts: number;
  nextAt: number;
  createdAt: number;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFTS)) {
        db.createObjectStore(DRAFTS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUEUE)) {
        db.createObjectStore(QUEUE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB tx failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB tx aborted'));
  });
}

export function draftKey(parts: {
  gymId: string;
  memberId: string;
  machineCode: string;
  logDate: string;
  targetMuscleGroup?: string;
}): string {
  return [
    parts.gymId,
    parts.memberId,
    parts.machineCode,
    parts.logDate,
    parts.targetMuscleGroup ?? '',
  ].join('|');
}

export async function putWorkoutDraft(draft: WorkoutDraftRecord): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(DRAFTS, 'readwrite');
    tx.objectStore(DRAFTS).put(draft);
    await txDone(tx);
    db.close();
  } catch {
    /* private mode / blocked — ignore */
  }
}

export async function getWorkoutDraft(key: string): Promise<WorkoutDraftRecord | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(DRAFTS, 'readonly');
    const req = tx.objectStore(DRAFTS).get(key);
    const row = await new Promise<WorkoutDraftRecord | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as WorkoutDraftRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    return row ?? null;
  } catch {
    return null;
  }
}

export async function enqueueSyncItem(
  item: Omit<SyncQueueItem, 'attempts' | 'nextAt' | 'createdAt' | 'updatedAt'> & {
    attempts?: number;
  }
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE, 'readwrite');
    const store = tx.objectStore(QUEUE);
    const now = Date.now();
    // Coalesce by idempotencyKey: replace older pending body for same key.
    const allReq = store.getAll();
    const existing = await new Promise<SyncQueueItem[]>((resolve, reject) => {
      allReq.onsuccess = () => resolve((allReq.result as SyncQueueItem[]) ?? []);
      allReq.onerror = () => reject(allReq.error);
    });
    for (const row of existing) {
      if (row.idempotencyKey === item.idempotencyKey) {
        store.delete(row.id);
      }
    }
    const full: SyncQueueItem = {
      ...item,
      attempts: item.attempts ?? 0,
      nextAt: now,
      createdAt: now,
      updatedAt: now,
    };
    store.put(full);
    await txDone(tx);
    db.close();
  } catch {
    /* ignore */
  }
}

export async function listDueSyncItems(now = Date.now()): Promise<SyncQueueItem[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE, 'readonly');
    const req = tx.objectStore(QUEUE).getAll();
    const rows = await new Promise<SyncQueueItem[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as SyncQueueItem[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    return rows.filter((r) => r.nextAt <= now).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function countSyncQueue(): Promise<number> {
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE, 'readonly');
    const req = tx.objectStore(QUEUE).count();
    const n = await new Promise<number>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    return n;
  } catch {
    return 0;
  }
}

export async function removeSyncItem(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE, 'readwrite');
    tx.objectStore(QUEUE).delete(id);
    await txDone(tx);
    db.close();
  } catch {
    /* ignore */
  }
}

export async function bumpSyncItem(id: string, attempts: number, nextAt: number): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(QUEUE, 'readwrite');
    const store = tx.objectStore(QUEUE);
    const req = store.get(id);
    const row = await new Promise<SyncQueueItem | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as SyncQueueItem | undefined);
      req.onerror = () => reject(req.error);
    });
    if (row) {
      store.put({ ...row, attempts, nextAt, updatedAt: Date.now() });
    }
    await txDone(tx);
    db.close();
  } catch {
    /* ignore */
  }
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(META, 'readwrite');
    tx.objectStore(META).put({ key, value });
    await txDone(tx);
    db.close();
  } catch {
    /* ignore */
  }
}
