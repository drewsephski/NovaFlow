import { BaseDirectory } from "@tauri-apps/plugin-fs"
import { getUnifiedDb } from "@/lib/db-unified"
import { getUnifiedFs } from "@/lib/fs-unified"
import { checkTauriEnvironment } from "@/lib/storage"

export interface Note {
  id: number
  tagId: number
  content?: string
  locale: string
  count: string
  createdAt: number
}

// Create notes table / storage
export async function initNotesDb() {
  const db = await getUnifiedDb()
  if (!db) return
  
  // In Tauri mode, create SQLite table and ensure article directory exists
  if (checkTauriEnvironment()) {
    const { getDb } = await import('./index')
    const tauriDb = await getDb()
    if (tauriDb) {
      await tauriDb.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tagId INTEGER NOT NULL,
          content TEXT DEFAULT NULL,
          locale TEXT NOT NULL,
          count TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        )
      `)
    }
    
    const fs = await getUnifiedFs()
    const isExist = await fs.exists('article', BaseDirectory.AppData)
    if (!isExist) {
      await fs.mkdir('article', BaseDirectory.AppData)
    }
  }
  // Web mode: IndexedDB auto-initializes
}

export async function insertNote(note: Partial<Note> & { tagId: number; locale: string; count: string }) {
  const db = await getUnifiedDb()
  if (!db) throw new Error('Database not available')
  return db.insertNote(note)
}

export async function getNoteByTagId(tagId: number) {
  const db = await getUnifiedDb()
  if (!db) return undefined
  return db.getNoteByTagId(tagId)
}

export async function getNoteById(id: number) {
  const db = await getUnifiedDb()
  if (!db) return undefined
  return db.getNoteById(id)
}

export async function getNotesByTagId(tagId: number) {
  const db = await getUnifiedDb()
  if (!db) return []
  return db.getNotesByTagId(tagId)
}

// Delete
export async function delNote(id: number) {
  const db = await getUnifiedDb()
  if (!db) return
  return db.deleteNote(id)
}
