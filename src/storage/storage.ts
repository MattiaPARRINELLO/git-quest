import { createStore, del, get, set } from 'idb-keyval';
import { MemoryStorageAdapter } from './StorageAdapter';
import type { StorageAdapter } from './StorageAdapter';

const DB_NAME = 'gitquest';
const STORE_NAME = 'kv';

class IndexedDbAdapter implements StorageAdapter {
  private readonly store = createStore(DB_NAME, STORE_NAME);

  async get<T>(key: string, fallback: T): Promise<T> {
    const value = await get<T>(key, this.store);
    return value === undefined ? fallback : value;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await set(key, value, this.store);
  }

  async remove(key: string): Promise<void> {
    await del(key, this.store);
  }
}

export function createStorage(): StorageAdapter {
  if (typeof indexedDB === 'undefined') return new MemoryStorageAdapter();
  return new IndexedDbAdapter();
}

export const storage = createStorage();
