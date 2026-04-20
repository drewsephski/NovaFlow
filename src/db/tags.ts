import { getUnifiedDb } from "@/lib/db-unified"
import { loadStore } from "@/lib/storage"

export interface Tag {
  id: number
  name: string
  isLocked?: boolean
  isPin?: boolean
  sortOrder?: number
  total?: number
}

// Create tags table
export async function initTagsDb() {
  const db = await getUnifiedDb()
  
  // Web mode: IndexedDB auto-initializes via Dexie schema
  // Tauri mode: Need to create SQLite table manually
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    const { getDb } = await import('./index')
    const tauriDb = await getDb()
    if (tauriDb) {
      // Create table with all columns including new isLocked/isPin
      await tauriDb.execute(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          parentId INTEGER,
          isDefault BOOLEAN DEFAULT FALSE,
          isLocked BOOLEAN DEFAULT FALSE,
          isPin BOOLEAN DEFAULT FALSE,
          sortOrder INTEGER DEFAULT 0,
          isIdea BOOLEAN DEFAULT FALSE
        )
      `)
      
      // Check if sortOrder column exists (migration for old databases)
      try {
        await tauriDb.execute('SELECT sortOrder FROM tags LIMIT 1')
      } catch {
        // Add missing columns for older databases
        await tauriDb.execute('ALTER TABLE tags ADD COLUMN isLocked BOOLEAN DEFAULT FALSE')
        await tauriDb.execute('ALTER TABLE tags ADD COLUMN isPin BOOLEAN DEFAULT FALSE')
        await tauriDb.execute('ALTER TABLE tags ADD COLUMN sortOrder INTEGER DEFAULT 0')
      }
    }
  }
  
  // Check if we need to create default tag
  if (!db) throw new Error('Database not available')
  const existingTags = await db.getAllTags()
  if (existingTags.length === 0) {
    const tagId = await db.insertTag({
      name: 'Idea',
      isLocked: true,
      isPin: true,
      sortOrder: 0
    })
    // Save current tag ID to storage
    const store = await loadStore('store.json')
    await store.set('currentTagId', tagId)
    await store.save()
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    const db = await getUnifiedDb()
    if (!db) throw new Error('Database not available')
    const records = await db.getAllTags()
  // Transform records to Tag interface
  const tags: Tag[] = records.map(r => ({
    id: r.id!,
    name: r.name,
    isLocked: r.isLocked,
    isPin: r.isPin,
    sortOrder: r.sortOrder,
    total: 0 // Will be populated separately if needed
  }))
  
  return tags.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id)
  } catch (error) {
    console.error('[tags.ts] Failed to get tags:', error)
    throw error
  }
}

export async function insertTag(tag: Partial<Tag> & { name: string }): Promise<{ lastInsertId: number }> {
  try {
    const db = await getUnifiedDb()
    if (!db) throw new Error('Database not available')
    const id = await db.insertTag({
      name: tag.name,
      isLocked: tag.isLocked,
      isPin: tag.isPin,
      sortOrder: tag.sortOrder
    })
    return { lastInsertId: id }
  } catch (error) {
    console.error('[tags.ts] Failed to insert tag:', error)
    throw error
  }
}

export async function updateTag(tag: Tag) {
  const db = await getUnifiedDb()
  if (!db) throw new Error('Database not available')
  return db.updateTag(tag.id, {
    name: tag.name,
    isLocked: tag.isLocked,
    isPin: tag.isPin,
    sortOrder: tag.sortOrder
  })
}

export async function delTag(id: number) {
  const db = await getUnifiedDb()
  if (!db) throw new Error('Database not available')
  return db.deleteTag(id)
}

export async function deleteAllTags() {
  const db = await getUnifiedDb()
  if (!db) throw new Error('Database not available')
  const tags = await db.getAllTags()
  for (const tag of tags) {
    if (!tag.isLocked) {
      await db.deleteTag(tag.id!)
    }
  }
}

export async function insertTags(tags: Tag[]) {
  const db = await getUnifiedDb()
  if (!db) throw new Error('Database not available')
  for (const tag of tags) {
    if (tag.isLocked) continue
    const existing = await db.getTagById(tag.id)
    if (existing) {
      await db.updateTag(tag.id, {
        name: tag.name,
        isLocked: tag.isLocked,
        isPin: tag.isPin,
        sortOrder: tag.sortOrder
      })
    } else {
      await db.insertTag({
        name: tag.name,
        isLocked: tag.isLocked,
        isPin: tag.isPin,
        sortOrder: tag.sortOrder
      })
    }
  }
  return true
}

export async function updateTagsOrder(tags: { id: number; sortOrder: number }[]) {
  const db = await getUnifiedDb()
  if (!db) throw new Error('Database not available')
  for (const tag of tags) {
    await db.updateTag(tag.id, { sortOrder: tag.sortOrder })
  }
  return true
}