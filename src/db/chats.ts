import { getDb } from "./index"
import { insertActivityEvent } from './activity'
import { truncateActivityText } from '@/lib/activity/events'

export type Role = 'system' | 'user'
export type ChatType = 'chat' | 'note' | 'clipboard' | 'clear' | 'condensed'

export interface Chat {
  id: number
  tagId?: number // Optional, for backward compatibility
  conversationId?: number // Associated conversation ID
  content?: string
  role: Role
  type: ChatType
  image?: string
  images?: string // Multiple images, JSON string array
  inserted: boolean // Whether inserted into mark
  createdAt: number
  ragSources?: string // RAG referenced filenames, JSON string array
  ragSourceDetails?: string // RAG referenced details, JSON string array (contains file paths and text snippets)
  agentHistory?: string // Agent execution history, JSON string
  thinking?: string // AI thinking process
  quoteData?: string // Quote info, JSON string
  // Compression-related fields
  condensedContent?: string    // Condensed summary content (stored on this message)
  condensedAt?: number         // Condensation timestamp
}

// Create chats table
export async function initChatsDb() {
  const db = await getDb()
  if (!db) return
  await db.execute(`
    create table if not exists chats (
      id integer primary key autoincrement,
      tagId integer not null,
      content text default null,
      role text not null,
      type text not null,
      image text default null,
      images text default null,
      inserted boolean default false,
      createdAt integer not null,
      ragSources text default null,
      agentHistory text default null,
      thinking text default null,
      quoteData text default null
    )
  `)
  
  // Migration: add ragSources column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column ragSources text default null
    `)
  } catch {
    // If column already exists, ignore error
    // SQLite will throw "duplicate column name" error
  }
  
  // Migration: add agentHistory column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column agentHistory text default null
    `)
  } catch {
    // If column already exists, ignore error
  }
  
  // Migration: add images column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column images text default null
    `)
  } catch {
    // If column already exists, ignore error
  }
  
  // Migration: add thinking column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column thinking text default null
    `)
  } catch {
    // If column already exists, ignore error
  }
  
  // Migration: add quoteData column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column quoteData text default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add ragSourceDetails column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column ragSourceDetails text default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add condensedFrom column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column condensedFrom text default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add originalTokenCount column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column originalTokenCount integer default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add originalMessageCount column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column originalMessageCount integer default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add condensedAt column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column condensedAt integer default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add condensedContent column to existing table (if not exists)
  try {
    await db.execute(`
      alter table chats add column condensedContent text default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migration: add conversationId column to existing table (if not exists)
  // Note: This migration has been moved to initConversationsDb in conversations.ts
  // Kept here for backward compatibility, ensures column exists if conversations init fails
  try {
    await db.execute(`
      alter table chats add column conversationId integer default null
    `)
  } catch {
    // If column already exists, ignore error
  }
}

// Insert a chat
export async function insertChat(chat: Omit<Chat, 'id' | 'createdAt'>) {
  const db = await getDb()
  if (!db) throw new Error('Database not available')
  const createdAt = Date.now();
  const result = await db.execute(
    "insert into chats (tagId, conversationId, content, role, type, image, images, inserted, createdAt, ragSources, ragSourceDetails, agentHistory, thinking, quoteData, condensedContent, condensedAt) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
    [chat.tagId, chat.conversationId, chat.content, chat.role, chat.type, chat.image, chat.images, chat.inserted ? 1 : 0, createdAt, chat.ragSources, chat.ragSourceDetails, chat.agentHistory, chat.thinking, chat.quoteData, chat.condensedContent, chat.condensedAt]
  )

  if (chat.role === 'user' && chat.content?.trim()) {
    await insertActivityEvent({
      source: 'chat',
      title: truncateActivityText(chat.content, 64),
      description: truncateActivityText(chat.content, 140),
      tagId: chat.tagId ?? null,
      dedupeKey: result.lastInsertId ? `chat:${result.lastInsertId}` : `chat:${createdAt}`,
      createdAt,
    })
  }

  return result
}

// Get all chats
export async function getChats(tagId: number) {
  const db = await getDb()
  if (!db) return []
  const result = await db.select<Chat[]>(
    "select * from chats where tagId = $1 order by createdAt",
    [tagId]
  )
  return result
}

// Get chat history by conversation ID (new method)
export async function getChatsByConversation(conversationId: number) {
  const db = await getDb()
  if (!db) return []
  const result = await db.select<Chat[]>(
    "select * from chats where conversationId = $1 order by createdAt",
    [conversationId]
  )
  return result
}

// Get all chats (for sync)
export async function getAllChats() {
  const db = await getDb()
  if (!db) return []
  const result = await db.select<Chat[]>(
    "select * from chats order by createdAt",
    []
  )
  return result
}

// Insert multiple chats (for sync)
export async function insertChats(chats: Chat[]) {
  const db = await getDb()
  if (!db) return

  await db.execute('BEGIN TRANSACTION')
  try {
    for (const chat of chats) {
      await db.execute(
        "insert into chats (tagId, content, role, type, image, images, inserted, createdAt, ragSources) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [chat.tagId, chat.content, chat.role, chat.type, chat.image, chat.images, chat.inserted ? 1 : 0, chat.createdAt, chat.ragSources]
      )
    }
    await db.execute('COMMIT')
  } catch (error) {
    await db.execute('ROLLBACK')
    throw error
  }
}

// Delete all chats (for sync)
export async function deleteAllChats() {
  const db = await getDb()
  if (!db) return
  return await db.execute(
    "delete from chats",
    []
  )
}

// Update a chat
export async function updateChat(chat: Chat) {
  const db = await getDb()
  if (!db) return
  return await db.execute(
    "update chats set tagId = $1, conversationId = $2, content = $3, role = $4, type = $5, image = $6, images = $7, inserted = $8, ragSources = $9, ragSourceDetails = $10, agentHistory = $11, thinking = $12, quoteData = $13, condensedContent = $14, condensedAt = $15 where id = $16",
    [chat.tagId, chat.conversationId, chat.content, chat.role, chat.type, chat.image, chat.images, chat.inserted ? 1 : 0, chat.ragSources, chat.ragSourceDetails, chat.agentHistory, chat.thinking, chat.quoteData, chat.condensedContent, chat.condensedAt, chat.id])
}

// Clear all chats under tagId
export async function clearChatsByTagId(tagId: number) {
  const db = await getDb()
  if (!db) return
  return await db.execute(
    "delete from chats where tagId = $1",
    [tagId])
}

// Mark as inserted
export async function updateChatsInsertedById(id: number) {
  const db = await getDb()
  if (!db) return
  return await db.execute(
    "update chats set inserted = $1 where id = $2",
    [true, id])
}

// Delete a chat
export async function deleteChat(id: number) {
  const db = await getDb()
  if (!db) return
  return await db.execute(
    "delete from chats where id = $1",
    [id])
}

export async function updateChats(chats: Chat[]) {
  const db = await getDb()
  if (!db) return
  try {
    for (const chat of chats) {
      await db.execute(
        "update chats set tagId = $1, conversationId = $2, content = $3, role = $4, type = $5, image = $6, images = $7, inserted = $8, ragSources = $9, ragSourceDetails = $10, agentHistory = $11, thinking = $12, quoteData = $13, condensedContent = $14, condensedAt = $15 where id = $16",
        [chat.tagId, chat.conversationId, chat.content, chat.role, chat.type, chat.image, chat.images, chat.inserted ? 1 : 0, chat.ragSources, chat.ragSourceDetails, chat.agentHistory, chat.thinking, chat.quoteData, chat.condensedContent, chat.condensedAt, chat.id]
      )
    }
  } catch (error) {
    console.error('Error updating chats:', error);
    throw error;
  }
}

export async function deleteChats(ids: number[]) {
  const db = await getDb()
  if (!db) return
  try {
    for (const id of ids) {
      await db.execute(
        "delete from chats where id = $1",
        [id]
      )
    }
  } catch (error) {
    console.error('Error deleting chats:', error);
    throw error;
  }
}

/**
 * Update message condensed summary content
 * @param chatId Message ID
 * @param condensedContent Condensed summary content
 */
export async function updateChatCondensedContent(chatId: number, condensedContent: string) {
  const db = await getDb()
  if (!db) return
  try {
    await db.execute(
      "update chats set condensedContent = $1, condensedAt = $2 where id = $3",
      [condensedContent, Date.now(), chatId]
    )
  } catch (error) {
    console.error('Error updating chat condensed content:', error);
    throw error;
  }
}
