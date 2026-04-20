/**
 * Storage abstraction layer for NovaFlow
 * Uses localStorage for web/Next.js, Tauri Store for desktop
 */

// Dynamically import Tauri Store only when needed
let Store: typeof import('@tauri-apps/plugin-store').Store | null = null;

async function getTauriStore() {
  if (!Store) {
    try {
      const mod = await import('@tauri-apps/plugin-store');
      Store = mod.Store;
    } catch {
      // Failed to load Tauri Store
      return null;
    }
  }
  return Store;
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

/**
 * Universal storage interface
 * Works in both Tauri desktop and Next.js web environments
 */
export class UniversalStore {
  private tauriStore: import('@tauri-apps/plugin-store').Store | null = null;
  private storeName: string;
  private isWebMode: boolean;

  constructor(storeName: string = 'store.json') {
    this.storeName = storeName;
    this.isWebMode = !isTauriEnvironment();
  }

  /**
   * Load or initialize the store
   */
  async load(): Promise<UniversalStore> {
    if (this.isWebMode) {
      // Web mode: load from localStorage
      return this;
    }
    
    // Tauri mode: use Tauri Store
    try {
      const TauriStore = await getTauriStore();
      if (!TauriStore) {
        // Fall back to web mode if Store can't be loaded
        this.isWebMode = true;
        return this;
      }
      this.tauriStore = await TauriStore.load(this.storeName);
    } catch {
      // Fall back to web mode on error
      this.isWebMode = true;
    }
    return this;
  }

  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isWebMode) {
      const value = localStorage.getItem(`notegen:${key}`);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    const value = await this.tauriStore.get<T>(key);
    return value ?? null;
  }

  /**
   * Set a value in storage
   */
  async set(key: string, value: unknown): Promise<void> {
    if (this.isWebMode) {
      if (value === undefined || value === null) {
        localStorage.removeItem(`notegen:${key}`);
      } else {
        localStorage.setItem(`notegen:${key}`, JSON.stringify(value));
      }
      return;
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    await this.tauriStore.set(key, value);
  }

  /**
   * Save changes to disk (Tauri only, no-op for web)
   */
  async save(): Promise<void> {
    if (this.isWebMode) {
      // localStorage is synchronous, no save needed
      return;
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    await this.tauriStore.save();
  }

  /**
   * Delete a key from storage
   */
  async delete(key: string): Promise<void> {
    if (this.isWebMode) {
      localStorage.removeItem(`notegen:${key}`);
      return;
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    await this.tauriStore.delete(key);
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    if (this.isWebMode) {
      return localStorage.getItem(`notegen:${key}`) !== null;
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    return this.tauriStore.has(key);
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    if (this.isWebMode) {
      const prefix = 'notegen:';
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keys.push(key.slice(prefix.length));
        }
      }
      return keys;
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    return this.tauriStore.keys();
  }

  /**
   * Clear all values
   */
  async clear(): Promise<void> {
    if (this.isWebMode) {
      const prefix = 'notegen:';
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return;
    }
    
    if (!this.tauriStore) {
      throw new Error('Store not loaded');
    }
    // Tauri Store doesn't have clear(), iterate and delete
    const keys = await this.tauriStore.keys();
    for (const key of keys) {
      await this.tauriStore.delete(key);
    }
  }
}

/**
 * Static method to load a store - matches Tauri Store API
 */
export async function loadStore(storeName: string = 'store.json'): Promise<UniversalStore> {
  const store = new UniversalStore(storeName);
  return store.load();
}

/**
 * Get AI configuration from environment or storage
 * Priority: Environment variables > Storage > Default config
 */
export async function getAIConfigFromEnvOrStorage(): Promise<{
  baseURL: string | null;
  apiKey: string | null;
}> {
  // Check for environment variables first (web deployment)
  const envBaseURL = process.env.NEXT_PUBLIC_AI_BASE_URL;
  const envApiKey = process.env.NEXT_PUBLIC_AI_API_KEY;
  
  if (envBaseURL && envApiKey) {
    return { baseURL: envBaseURL, apiKey: envApiKey };
  }
  
  // Fall back to storage (desktop app or configured web)
  try {
    const store = await loadStore('store.json');
    const baseURL = await store.get<string>('baseURL');
    const apiKey = await store.get<string>('apiKey');
    return { baseURL, apiKey };
  } catch {
    return { baseURL: null, apiKey: null };
  }
}

/**
 * Check if running in Tauri environment
 */
export function checkTauriEnvironment(): boolean {
  return isTauriEnvironment();
}
