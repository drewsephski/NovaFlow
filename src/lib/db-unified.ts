/**
 * Unified Database Layer for NoteGen
 * 
 * Uses SQLite (via @tauri-apps/plugin-sql) in Tauri desktop mode
 * Uses IndexedDB (via Dexie) in web/Next.js mode
 */

import { checkTauriEnvironment } from './storage';
import type Database from '@tauri-apps/plugin-sql';

// Type definitions for database records
export interface NoteRecord {
  id?: number;
  tagId: number;
  content?: string;
  locale: string;
  count: string;
  createdAt: number;
}

export interface TagRecord {
  id?: number;
  name: string;
  description?: string;
  parentId?: number;
  isDefault?: boolean;
  isLocked?: boolean;
  isPin?: boolean;
  sortOrder?: number;
  isIdea?: boolean;
}

export interface ChatRecord {
  id?: number;
  tagId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: string;
  image?: string;
  model?: string;
  createdAt: number;
  inserted?: boolean;
  parentId?: number;
}

export interface MarkRecord {
  id?: number;
  tagId: number;
  content?: string;
  originContent?: string;
  originUrl?: string;
  createdAt: number;
}

export interface MemoryRecord {
  id?: number;
  content: string;
  type: 'preference' | 'fact' | 'context';
  createdAt: number;
  updatedAt: number;
}

export interface VectorRecord {
  id?: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ActivityRecord {
  id?: number;
  type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

// Unified database interface
export interface UnifiedDatabase {
  // Notes
  getNotesByTagId(tagId: number): Promise<NoteRecord[]>;
  getNoteById(id: number): Promise<NoteRecord | null>;
  getNoteByTagId(tagId: number): Promise<NoteRecord | null>;
  insertNote(note: Omit<NoteRecord, 'id' | 'createdAt'>): Promise<number>;
  updateNote(id: number, note: Partial<NoteRecord>): Promise<void>;
  deleteNote(id: number): Promise<void>;

  // Tags
  getAllTags(): Promise<TagRecord[]>;
  getTagById(id: number): Promise<TagRecord | null>;
  getTagByName(name: string): Promise<TagRecord | null>;
  insertTag(tag: Omit<TagRecord, 'id'>): Promise<number>;
  updateTag(id: number, tag: Partial<TagRecord>): Promise<void>;
  deleteTag(id: number): Promise<void>;

  // Chats
  getChatsByTagId(tagId: number): Promise<ChatRecord[]>;
  getChatById(id: number): Promise<ChatRecord | null>;
  insertChat(chat: Omit<ChatRecord, 'id'>): Promise<number>;
  updateChat(id: number, chat: Partial<ChatRecord>): Promise<void>;
  deleteChat(id: number): Promise<void>;

  // Marks
  getMarksByTagId(tagId: number): Promise<MarkRecord[]>;
  insertMark(mark: Omit<MarkRecord, 'id' | 'createdAt'>): Promise<number>;
  deleteMark(id: number): Promise<void>;

  // Memories
  getAllMemories(): Promise<MemoryRecord[]>;
  getMemoriesByType(type: string): Promise<MemoryRecord[]>;
  insertMemory(memory: Omit<MemoryRecord, 'id'>): Promise<number>;
  updateMemory(id: number, memory: Partial<MemoryRecord>): Promise<void>;
  deleteMemory(id: number): Promise<void>;

  // Vector (simplified for web - just metadata storage)
  getVectorDocuments(): Promise<VectorRecord[]>;
  insertVectorDocument(doc: Omit<VectorRecord, 'id'>): Promise<number>;
  deleteVectorDocument(id: number): Promise<void>;

  // Activity
  getRecentActivity(limit?: number): Promise<ActivityRecord[]>;
  insertActivity(activity: Omit<ActivityRecord, 'id'>): Promise<number>;

  // Lifecycle
  ready(): Promise<void>;
}

// Lazy-loaded database instances
let tauriDb: Database | null = null;
let webDb: DexieDatabase | null = null;

// ============================================
// Web Mode: IndexedDB via Dexie
// ============================================

class DexieDatabase implements UnifiedDatabase {
  private db: any; // Dexie instance
  private initPromise: Promise<void> | null = null;
  private initError: Error | null = null;

  constructor() {
    console.log('[DexieDatabase] Constructor called');
    // Start initialization immediately but store the promise
    this.initPromise = this.init().catch(err => {
      console.error('[DexieDatabase] Init failed:', err);
      this.initError = err;
      throw err;
    });
  }

  private async init() {
    console.log('[DexieDatabase] Starting init...');
    try {
      const Dexie = (await import('dexie')).default;
      console.log('[DexieDatabase] Dexie imported:', Dexie);
      
      this.db = new Dexie('NoteGenDB');
      console.log('[DexieDatabase] Dexie instance created');
      
      // Define schema - version 2 for new tag fields
      this.db.version(2).stores({
        notes: '++id, tagId, locale, createdAt',
        tags: '++id, name, parentId, isDefault, isLocked, isPin, sortOrder',
        chats: '++id, tagId, role, createdAt',
        marks: '++id, tagId, createdAt',
        memories: '++id, type, createdAt, updatedAt',
        vectors: '++id, createdAt',
        activity: '++id, type, createdAt',
      });
      console.log('[DexieDatabase] Schema defined');

      await this.db.open();
      console.log('[DexieDatabase] Database opened successfully');
    } catch (err) {
      console.error('[DexieDatabase] Error during init:', err);
      throw err;
    }
  }

  // Notes
  async getNotesByTagId(tagId: number): Promise<NoteRecord[]> {
    await this.ensureInit();
    return this.db.notes.where({ tagId }).sortBy('createdAt');
  }

  async getNoteById(id: number): Promise<NoteRecord | null> {
    await this.ensureInit();
    return this.db.notes.get(id) || null;
  }

  async getNoteByTagId(tagId: number): Promise<NoteRecord | null> {
    await this.ensureInit();
    const notes = await this.db.notes.where({ tagId }).reverse().sortBy('createdAt');
    return notes[0] || null;
  }

  async insertNote(note: Omit<NoteRecord, 'id' | 'createdAt'>): Promise<number> {
    await this.ensureInit();
    return this.db.notes.add({ ...note, createdAt: Date.now() });
  }

  async updateNote(id: number, note: Partial<NoteRecord>): Promise<void> {
    await this.ensureInit();
    await this.db.notes.update(id, note);
  }

  async deleteNote(id: number): Promise<void> {
    await this.ensureInit();
    await this.db.notes.delete(id);
  }

  // Tags
  async getAllTags(): Promise<TagRecord[]> {
    await this.ensureInit();
    return this.db.tags.toArray();
  }

  async getTagById(id: number): Promise<TagRecord | null> {
    await this.ensureInit();
    return this.db.tags.get(id) || null;
  }

  async getTagByName(name: string): Promise<TagRecord | null> {
    await this.ensureInit();
    return this.db.tags.where({ name }).first() || null;
  }

  async insertTag(tag: Omit<TagRecord, 'id'>): Promise<number> {
    await this.ensureInit();
    return this.db.tags.add(tag);
  }

  async updateTag(id: number, tag: Partial<TagRecord>): Promise<void> {
    await this.ensureInit();
    await this.db.tags.update(id, tag);
  }

  async deleteTag(id: number): Promise<void> {
    await this.ensureInit();
    await this.db.tags.delete(id);
    // Cascade delete related notes and chats
    await this.db.notes.where({ tagId: id }).delete();
    await this.db.chats.where({ tagId: id }).delete();
    await this.db.marks.where({ tagId: id }).delete();
  }

  // Chats
  async getChatsByTagId(tagId: number): Promise<ChatRecord[]> {
    await this.ensureInit();
    return this.db.chats.where({ tagId }).sortBy('createdAt');
  }

  async getChatById(id: number): Promise<ChatRecord | null> {
    await this.ensureInit();
    return this.db.chats.get(id) || null;
  }

  async insertChat(chat: Omit<ChatRecord, 'id'>): Promise<number> {
    await this.ensureInit();
    return this.db.chats.add({ ...chat, createdAt: chat.createdAt || Date.now() });
  }

  async updateChat(id: number, chat: Partial<ChatRecord>): Promise<void> {
    await this.ensureInit();
    await this.db.chats.update(id, chat);
  }

  async deleteChat(id: number): Promise<void> {
    await this.ensureInit();
    await this.db.chats.delete(id);
  }

  // Marks
  async getMarksByTagId(tagId: number): Promise<MarkRecord[]> {
    await this.ensureInit();
    return this.db.marks.where({ tagId }).sortBy('createdAt');
  }

  async insertMark(mark: Omit<MarkRecord, 'id' | 'createdAt'>): Promise<number> {
    await this.ensureInit();
    return this.db.marks.add({ ...mark, createdAt: Date.now() });
  }

  async deleteMark(id: number): Promise<void> {
    await this.ensureInit();
    await this.db.marks.delete(id);
  }

  // Memories
  async getAllMemories(): Promise<MemoryRecord[]> {
    await this.ensureInit();
    return this.db.memories.toArray();
  }

  async getMemoriesByType(type: string): Promise<MemoryRecord[]> {
    await this.ensureInit();
    return this.db.memories.where({ type }).sortBy('updatedAt');
  }

  async insertMemory(memory: Omit<MemoryRecord, 'id'>): Promise<number> {
    await this.ensureInit();
    return this.db.memories.add(memory);
  }

  async updateMemory(id: number, memory: Partial<MemoryRecord>): Promise<void> {
    await this.ensureInit();
    await this.db.memories.update(id, memory);
  }

  async deleteMemory(id: number): Promise<void> {
    await this.ensureInit();
    await this.db.memories.delete(id);
  }

  // Vector (metadata only in web mode)
  async getVectorDocuments(): Promise<VectorRecord[]> {
    await this.ensureInit();
    return this.db.vectors.toArray();
  }

  async insertVectorDocument(doc: Omit<VectorRecord, 'id'>): Promise<number> {
    await this.ensureInit();
    return this.db.vectors.add(doc);
  }

  async deleteVectorDocument(id: number): Promise<void> {
    await this.ensureInit();
    await this.db.vectors.delete(id);
  }

  // Activity
  async getRecentActivity(limit: number = 50): Promise<ActivityRecord[]> {
    await this.ensureInit();
    return this.db.activity.reverse().limit(limit).toArray();
  }

  async insertActivity(activity: Omit<ActivityRecord, 'id'>): Promise<number> {
    await this.ensureInit();
    return this.db.activity.add(activity);
  }

  private async ensureInit() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // Public method to wait for initialization
  async ready(): Promise<void> {
    await this.ensureInit();
  }
}

// ============================================
// Tauri Mode: SQLite wrapper
// ============================================

class TauriDatabase implements UnifiedDatabase {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Notes
  async getNotesByTagId(tagId: number): Promise<NoteRecord[]> {
    return this.db.select<NoteRecord[]>(
      'SELECT * FROM notes WHERE tagId = ? ORDER BY createdAt DESC',
      [tagId]
    );
  }

  async getNoteById(id: number): Promise<NoteRecord | null> {
    const results = await this.db.select<NoteRecord[]>(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  async getNoteByTagId(tagId: number): Promise<NoteRecord | null> {
    const results = await this.db.select<NoteRecord[]>(
      'SELECT * FROM notes WHERE tagId = ? ORDER BY createdAt DESC LIMIT 1',
      [tagId]
    );
    return results[0] || null;
  }

  async insertNote(note: Omit<NoteRecord, 'id' | 'createdAt'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO notes (tagId, content, locale, count, createdAt) VALUES (?, ?, ?, ?, ?)',
      [note.tagId, note.content, note.locale, note.count, Date.now()]
    );
    return result.lastInsertId || 0;
  }

  async updateNote(id: number, note: Partial<NoteRecord>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    
    if (note.content !== undefined) {
      sets.push('content = ?');
      values.push(note.content);
    }
    if (note.count !== undefined) {
      sets.push('count = ?');
      values.push(note.count);
    }
    
    if (sets.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE notes SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  async deleteNote(id: number): Promise<void> {
    await this.db.execute('DELETE FROM notes WHERE id = ?', [id]);
  }

  // Tags
  async getAllTags(): Promise<TagRecord[]> {
    return this.db.select<TagRecord[]>('SELECT * FROM tags ORDER BY sortOrder');
  }

  async getTagById(id: number): Promise<TagRecord | null> {
    const results = await this.db.select<TagRecord[]>(
      'SELECT * FROM tags WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  async getTagByName(name: string): Promise<TagRecord | null> {
    const results = await this.db.select<TagRecord[]>(
      'SELECT * FROM tags WHERE name = ?',
      [name]
    );
    return results[0] || null;
  }

  async insertTag(tag: Omit<TagRecord, 'id'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO tags (name, description, parentId, isDefault, isLocked, isPin, sortOrder, isIdea) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tag.name, tag.description, tag.parentId, tag.isDefault, tag.isLocked, tag.isPin, tag.sortOrder, tag.isIdea]
    );
    return result.lastInsertId || 0;
  }

  async updateTag(id: number, tag: Partial<TagRecord>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    
    if (tag.name !== undefined) {
      sets.push('name = ?');
      values.push(tag.name);
    }
    if (tag.description !== undefined) {
      sets.push('description = ?');
      values.push(tag.description);
    }
    if (tag.isLocked !== undefined) {
      sets.push('isLocked = ?');
      values.push(tag.isLocked);
    }
    if (tag.isPin !== undefined) {
      sets.push('isPin = ?');
      values.push(tag.isPin);
    }
    if (tag.sortOrder !== undefined) {
      sets.push('sortOrder = ?');
      values.push(tag.sortOrder);
    }
    
    if (sets.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE tags SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  async deleteTag(id: number): Promise<void> {
    await this.db.execute('DELETE FROM tags WHERE id = ?', [id]);
  }

  // Chats
  async getChatsByTagId(tagId: number): Promise<ChatRecord[]> {
    return this.db.select<ChatRecord[]>(
      'SELECT * FROM chats WHERE tagId = ? ORDER BY createdAt',
      [tagId]
    );
  }

  async getChatById(id: number): Promise<ChatRecord | null> {
    const results = await this.db.select<ChatRecord[]>(
      'SELECT * FROM chats WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  async insertChat(chat: Omit<ChatRecord, 'id'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO chats (tagId, role, content, type, image, model, createdAt, inserted, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [chat.tagId, chat.role, chat.content, chat.type, chat.image, chat.model, chat.createdAt, chat.inserted, chat.parentId]
    );
    return result.lastInsertId || 0;
  }

  async updateChat(id: number, chat: Partial<ChatRecord>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    
    if (chat.content !== undefined) {
      sets.push('content = ?');
      values.push(chat.content);
    }
    if (chat.inserted !== undefined) {
      sets.push('inserted = ?');
      values.push(chat.inserted);
    }
    
    if (sets.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE chats SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  async deleteChat(id: number): Promise<void> {
    await this.db.execute('DELETE FROM chats WHERE id = ?', [id]);
  }

  // Marks
  async getMarksByTagId(tagId: number): Promise<MarkRecord[]> {
    return this.db.select<MarkRecord[]>(
      'SELECT * FROM marks WHERE tagId = ? ORDER BY createdAt DESC',
      [tagId]
    );
  }

  async insertMark(mark: Omit<MarkRecord, 'id' | 'createdAt'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO marks (tagId, content, originContent, originUrl, createdAt) VALUES (?, ?, ?, ?, ?)',
      [mark.tagId, mark.content, mark.originContent, mark.originUrl, Date.now()]
    );
    return result.lastInsertId || 0;
  }

  async deleteMark(id: number): Promise<void> {
    await this.db.execute('DELETE FROM marks WHERE id = ?', [id]);
  }

  // Memories
  async getAllMemories(): Promise<MemoryRecord[]> {
    return this.db.select<MemoryRecord[]>('SELECT * FROM memories ORDER BY updatedAt DESC');
  }

  async getMemoriesByType(type: string): Promise<MemoryRecord[]> {
    return this.db.select<MemoryRecord[]>(
      'SELECT * FROM memories WHERE type = ? ORDER BY updatedAt DESC',
      [type]
    );
  }

  async insertMemory(memory: Omit<MemoryRecord, 'id'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO memories (content, type, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [memory.content, memory.type, memory.createdAt, memory.updatedAt]
    );
    return result.lastInsertId || 0;
  }

  async updateMemory(id: number, memory: Partial<MemoryRecord>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    
    if (memory.content !== undefined) {
      sets.push('content = ?');
      values.push(memory.content);
    }
    if (memory.updatedAt !== undefined) {
      sets.push('updatedAt = ?');
      values.push(memory.updatedAt);
    }
    
    if (sets.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE memories SET ${sets.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  async deleteMemory(id: number): Promise<void> {
    await this.db.execute('DELETE FROM memories WHERE id = ?', [id]);
  }

  // Vector (placeholder - full implementation in Tauri)
  async getVectorDocuments(): Promise<VectorRecord[]> {
    return this.db.select<VectorRecord[]>('SELECT * FROM vectors ORDER BY createdAt DESC');
  }

  async insertVectorDocument(doc: Omit<VectorRecord, 'id'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO vectors (content, embedding, metadata, createdAt) VALUES (?, ?, ?, ?)',
      [doc.content, JSON.stringify(doc.embedding), JSON.stringify(doc.metadata), doc.createdAt]
    );
    return result.lastInsertId || 0;
  }

  async deleteVectorDocument(id: number): Promise<void> {
    await this.db.execute('DELETE FROM vectors WHERE id = ?', [id]);
  }

  // Activity
  async getRecentActivity(limit: number = 50): Promise<ActivityRecord[]> {
    return this.db.select<ActivityRecord[]>(
      'SELECT * FROM activity ORDER BY createdAt DESC LIMIT ?',
      [limit]
    );
  }

  async insertActivity(activity: Omit<ActivityRecord, 'id'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO activity (type, content, metadata, createdAt) VALUES (?, ?, ?, ?)',
      [activity.type, activity.content, JSON.stringify(activity.metadata), activity.createdAt]
    );
    return result.lastInsertId || 0;
  }

  // No-op for Tauri - already initialized
  async ready(): Promise<void> {}
}

// ============================================
// Factory function to get the right database
// ============================================

export async function getUnifiedDb(): Promise<UnifiedDatabase | null> {
  try {
    if (checkTauriEnvironment()) {
      // Tauri mode: Use SQLite
      if (!tauriDb) {
        const { default: Database } = await import('@tauri-apps/plugin-sql');
        tauriDb = await Database.load('sqlite:note.db');
      }
      return new TauriDatabase(tauriDb);
    } else {
      // Web mode: Use IndexedDB via Dexie
      if (!webDb) {
        webDb = new DexieDatabase();
      }
      // Wait for initialization to complete
      await webDb.ready();
      return webDb;
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return null;
  }
}

// Initialize database (creates tables in Tauri, initializes IndexedDB in web)
export async function initUnifiedDatabase(): Promise<void> {
  console.log('Initializing unified database...');
  try {
    if (checkTauriEnvironment()) {
      console.log('Tauri environment detected, using SQLite');
      // Initialize all Tauri database tables
      const { initAllDatabases } = await import('@/db');
      await initAllDatabases();
    } else {
      console.log('Web environment detected, using IndexedDB');
      // Web mode: IndexedDB auto-initializes on first use
      await getUnifiedDb();
      console.log('IndexedDB initialized successfully for web mode');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
