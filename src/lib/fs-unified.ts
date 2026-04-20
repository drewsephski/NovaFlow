/**
 * Unified File System Layer for NoteGen
 * 
 * Uses Tauri FS APIs in desktop mode
 * Uses IndexedDB storage in web/Next.js mode (simulates file system)
 */

import { checkTauriEnvironment } from './storage';
import type { BaseDirectory } from '@tauri-apps/plugin-fs';

// File metadata
export interface FileMetadata {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: number;
}

// Unified file system interface
export interface UnifiedFileSystem {
  // Read operations
  readTextFile(path: string, baseDir?: BaseDirectory): Promise<string>;
  readFile(path: string, baseDir?: BaseDirectory): Promise<Uint8Array>;
  exists(path: string, baseDir?: BaseDirectory): Promise<boolean>;
  
  // Write operations
  writeTextFile(path: string, contents: string, baseDir?: BaseDirectory): Promise<void>;
  writeFile(path: string, contents: Uint8Array, baseDir?: BaseDirectory): Promise<void>;
  
  // Directory operations
  mkdir(path: string, baseDir?: BaseDirectory, recursive?: boolean): Promise<void>;
  readDir(path: string, baseDir?: BaseDirectory): Promise<FileMetadata[]>;
  
  // File operations
  remove(path: string, baseDir?: BaseDirectory): Promise<void>;
  rename(oldPath: string, newPath: string, baseDir?: BaseDirectory): Promise<void>;
  copyFile(source: string, destination: string, baseDir?: BaseDirectory): Promise<void>;
  stat(path: string, baseDir?: BaseDirectory): Promise<{ size: number; modifiedAt: number } | null>;
}

// ============================================
// Web Mode: IndexedDB-based file storage
// ============================================

class WebFileSystem implements UnifiedFileSystem {
  private db: IDBDatabase | null = null;
  private dbName = 'NoteGenFS';
  private storeName = 'files';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'path' });
          store.createIndex('parentPath', 'parentPath', { unique: false });
          store.createIndex('isDirectory', 'isDirectory', { unique: false });
        }
      };
    });
  }

  private async ensureInit(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  private getKey(path: string, baseDir?: BaseDirectory): string {
    // Normalize path and prefix with baseDir if provided
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\//, '');
    if (baseDir !== undefined) {
      return `appData/${normalizedPath}`;
    }
    return normalizedPath;
  }

  async readTextFile(path: string, baseDir?: BaseDirectory): Promise<string> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          reject(new Error(`File not found: ${path}`));
          return;
        }
        if (result.isDirectory) {
          reject(new Error(`Path is a directory: ${path}`));
          return;
        }
        // Convert stored content back to string
        const content = typeof result.content === 'string' 
          ? result.content 
          : new TextDecoder().decode(result.content);
        resolve(content);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async readFile(path: string, baseDir?: BaseDirectory): Promise<Uint8Array> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result || result.isDirectory) {
          reject(new Error(`File not found: ${path}`));
          return;
        }
        // Return as Uint8Array
        const content = typeof result.content === 'string'
          ? new TextEncoder().encode(result.content)
          : new Uint8Array(result.content);
        resolve(content);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async exists(path: string, baseDir?: BaseDirectory): Promise<boolean> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count(key);
      
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(request.error);
    });
  }

  async writeTextFile(path: string, contents: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    const parentPath = key.substring(0, key.lastIndexOf('/')) || null;
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data = {
        path: key,
        parentPath,
        content: contents,
        isDirectory: false,
        size: new TextEncoder().encode(contents).length,
        modifiedAt: Date.now(),
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async writeFile(path: string, contents: Uint8Array, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    const parentPath = key.substring(0, key.lastIndexOf('/')) || null;
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data = {
        path: key,
        parentPath,
        content: Array.from(contents), // Store as array for JSON serialization
        isDirectory: false,
        size: contents.length,
        modifiedAt: Date.now(),
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async mkdir(path: string, baseDir?: BaseDirectory, recursive: boolean = false): Promise<void> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    // If recursive, create parent directories
    if (recursive) {
      const parts = key.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        await this.createSingleDir(currentPath);
      }
    } else {
      await this.createSingleDir(key);
    }
  }

  private async createSingleDir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const parentPath = path.includes('/') 
        ? path.substring(0, path.lastIndexOf('/')) || null
        : null;
      
      const data = {
        path,
        parentPath,
        content: null,
        isDirectory: true,
        size: 0,
        modifiedAt: Date.now(),
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async readDir(path: string, baseDir?: BaseDirectory): Promise<FileMetadata[]> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('parentPath');
      
      const request = index.getAll(key || null);
      
      request.onsuccess = () => {
        const results = request.result.map((item: any) => ({
          name: item.path.split('/').pop() || item.path,
          path: item.path,
          isDirectory: item.isDirectory,
          size: item.size,
          modifiedAt: item.modifiedAt,
        }));
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async remove(path: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    // Check if it's a directory and remove children recursively
    const isDir = await this.isDirectory(key);
    if (isDir) {
      const children = await this.readDir(path, baseDir);
      for (const child of children) {
        const childPath = path ? `${path}/${child.name}` : child.name;
        await this.remove(childPath, baseDir);
      }
    }
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async isDirectory(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(path);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.isDirectory || false);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async rename(oldPath: string, newPath: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    const oldKey = this.getKey(oldPath, baseDir);
    
    // Read existing content
    const content = await this.readFile(oldPath, baseDir);
    const isDir = await this.isDirectory(oldKey);
    
    // Write to new path
    if (isDir) {
      await this.mkdir(newPath, baseDir, true);
      // Copy children
      const children = await this.readDir(oldPath, baseDir);
      for (const child of children) {
        const oldChildPath = oldPath ? `${oldPath}/${child.name}` : child.name;
        const newChildPath = newPath ? `${newPath}/${child.name}` : child.name;
        await this.rename(oldChildPath, newChildPath, baseDir);
      }
    } else {
      await this.writeFile(newPath, content, baseDir);
    }
    
    // Remove old path
    await this.remove(oldPath, baseDir);
  }

  async copyFile(source: string, destination: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    const content = await this.readFile(source, baseDir);
    await this.writeFile(destination, content, baseDir);
  }

  async stat(path: string, baseDir?: BaseDirectory): Promise<{ size: number; modifiedAt: number } | null> {
    await this.ensureInit();
    const key = this.getKey(path, baseDir);
    
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        resolve({
          size: result.size,
          modifiedAt: result.modifiedAt,
        });
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================
// Tauri Mode: Wrapper around Tauri FS APIs
// ============================================

class TauriFileSystem implements UnifiedFileSystem {
  private fs: typeof import('@tauri-apps/plugin-fs') | null = null;
  private path: typeof import('@tauri-apps/api/path') | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.fs = await import('@tauri-apps/plugin-fs');
    this.path = await import('@tauri-apps/api/path');
  }

  private async ensureInit(): Promise<void> {
    if (!this.fs) {
      await this.init();
    }
  }

  async readTextFile(path: string, baseDir?: BaseDirectory): Promise<string> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.readTextFile(path, { baseDir });
    }
    return this.fs.readTextFile(path);
  }

  async readFile(path: string, baseDir?: BaseDirectory): Promise<Uint8Array> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.readFile(path, { baseDir });
    }
    return this.fs.readFile(path);
  }

  async exists(path: string, baseDir?: BaseDirectory): Promise<boolean> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.exists(path, { baseDir });
    }
    return this.fs.exists(path);
  }

  async writeTextFile(path: string, contents: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.writeTextFile(path, contents, { baseDir });
    }
    return this.fs.writeTextFile(path, contents);
  }

  async writeFile(path: string, contents: Uint8Array, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.writeFile(path, contents, { baseDir });
    }
    return this.fs.writeFile(path, contents);
  }

  async mkdir(path: string, baseDir?: BaseDirectory, recursive: boolean = false): Promise<void> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.mkdir(path, { baseDir, recursive });
    }
    return this.fs.mkdir(path, { recursive });
  }

  async readDir(path: string, baseDir?: BaseDirectory): Promise<FileMetadata[]> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    let entries: any[];
    if (baseDir !== undefined) {
      entries = await this.fs.readDir(path, { baseDir });
    } else {
      entries = await this.fs.readDir(path);
    }
    
    return entries.map(entry => ({
      name: entry.name,
      path: entry.name,
      isDirectory: entry.isDirectory,
    }));
  }

  async remove(path: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.remove(path, { baseDir });
    }
    return this.fs.remove(path);
  }

  async rename(oldPath: string, newPath: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.rename(oldPath, newPath, { oldPathBaseDir: baseDir, newPathBaseDir: baseDir });
    }
    return this.fs.rename(oldPath, newPath);
  }

  async copyFile(source: string, destination: string, baseDir?: BaseDirectory): Promise<void> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    if (baseDir !== undefined) {
      return this.fs.copyFile(source, destination, { fromPathBaseDir: baseDir, toPathBaseDir: baseDir });
    }
    return this.fs.copyFile(source, destination);
  }

  async stat(path: string, baseDir?: BaseDirectory): Promise<{ size: number; modifiedAt: number } | null> {
    await this.ensureInit();
    if (!this.fs) throw new Error('FS not initialized');
    
    try {
      const info = baseDir !== undefined 
        ? await this.fs.stat(path, { baseDir })
        : await this.fs.stat(path);
      
      return {
        size: info.size,
        modifiedAt: info.mtime ? new Date(info.mtime).getTime() : Date.now(),
      };
    } catch {
      return null;
    }
  }
}

// ============================================
// Factory and exports
// ============================================

let webFs: WebFileSystem | null = null;
let tauriFs: TauriFileSystem | null = null;

export async function getUnifiedFs(): Promise<UnifiedFileSystem> {
  if (checkTauriEnvironment()) {
    if (!tauriFs) {
      tauriFs = new TauriFileSystem();
    }
    return tauriFs;
  } else {
    if (!webFs) {
      webFs = new WebFileSystem();
    }
    return webFs;
  }
}

// Re-export types
export { BaseDirectory };
