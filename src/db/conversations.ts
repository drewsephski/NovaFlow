import { getDb } from "./index"

export interface Conversation {
  id: number
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  isPinned: boolean
}

// Create conversations table
export async function initConversationsDb() {
  const db = await getDb()
  if (!db) return
  await db.execute(`
    create table if not exists conversations (
      id integer primary key autoincrement,
      title text not null,
      createdAt integer not null,
      updatedAt integer not null,
      messageCount integer default 0,
      isPinned integer default 0
    )
  `)

  // Create indexes
  await db.execute(`
    create index if not exists idx_conversations_created on conversations(createdAt desc)
  `)
  await db.execute(`
    create index if not exists idx_conversations_updated on conversations(updatedAt desc)
  `)

  // Check and add conversationId column to chats table
  try {
    await db.execute(`
      alter table chats add column conversationId integer default null
    `)
  } catch {
    // If column already exists, ignore error
  }

  // Migrate existing data to default conversation
  await migrateExistingChats()
}

// Migrate existing chat records to default conversation
async function migrateExistingChats() {
  const db = await getDb()
  if (!db) return

  // Get all existing chat records
  const allChats = await db.select<{ createdAt: number }[]>(
    "select createdAt from chats order by createdAt",
    []
  )

  // If no chat records, no migration needed
  if (allChats.length === 0) {
    return
  }

  // Check if there are chat records without conversationId
  const chatsWithoutConversation = await db.select<{ id: number }[]>(
    "select id from chats where conversationId is null limit 1",
    []
  )

  // If all chat records already have conversationId, no migration needed
  if (chatsWithoutConversation.length === 0) {
    return
  }

  // Check if default conversation already exists
  const existingConversations = await db.select<Conversation[]>(
    "select * from conversations where title = '历史对话' limit 1",
    []
  )

  let defaultConversationId: number

  if (existingConversations.length === 0) {
    // Create history conversation
    const firstChat = allChats[0]
    const lastChat = allChats[allChats.length - 1]
    const result = await db.execute(
      "insert into conversations (title, createdAt, updatedAt, messageCount, isPinned) values ($1, $2, $3, $4, $5)",
      ['历史对话', firstChat.createdAt, lastChat.createdAt, allChats.length, 0]
    )
    defaultConversationId = result.lastInsertId as number

    // Update all existing chat records with conversationId
    await db.execute(
      "update chats set conversationId = $1 where conversationId is null",
      [defaultConversationId]
    )
  } else {
    defaultConversationId = existingConversations[0].id
    // Update all chat records without conversationId
    await db.execute(
      "update chats set conversationId = $1 where conversationId is null",
      [defaultConversationId]
    )
  }
}

// Create new conversation
export async function createConversation(title: string): Promise<number> {
  const db = await getDb()
  if (!db) throw new Error('Database not available')
  const now = Date.now()
  const result = await db.execute(
    "insert into conversations (title, createdAt, updatedAt, messageCount, isPinned) values ($1, $2, $3, $4, $5)",
    [title, now, now, 0, 0]
  )
  return result.lastInsertId as number
}

// Get all conversations
export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDb()
  if (!db) return []
  const result = await db.select<Conversation[]>(
    "select * from conversations order by isPinned desc, updatedAt desc",
    []
  )
  return result
}

// Get single conversation
export async function getConversation(id: number): Promise<Conversation | null> {
  const db = await getDb()
  if (!db) return null
  const result = await db.select<Conversation[]>(
    "select * from conversations where id = $1",
    [id]
  )
  return result[0] || null
}

// Update conversation title
export async function updateConversationTitle(id: number, title: string): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.execute(
    "update conversations set title = $1, updatedAt = $2 where id = $3",
    [title, Date.now(), id]
  )
}

// Update conversation message count
export async function updateConversationMessageCount(id: number, delta: number): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.execute(
    "update conversations set messageCount = messageCount + $1, updatedAt = $2 where id = $3",
    [delta, Date.now(), id]
  )
}

// Update conversation last updated time
export async function updateConversationTime(id: number): Promise<void> {
  const db = await getDb()
  if (!db) return
  await db.execute(
    "update conversations set updatedAt = $1 where id = $2",
    [Date.now(), id]
  )
}

// Delete conversation and its related chat records
export async function deleteConversation(id: number): Promise<void> {
  const db = await getDb()
  if (!db) return
  // First delete all chat records of the conversation
  await db.execute(
    "delete from chats where conversationId = $1",
    [id]
  )
  // Then delete the conversation
  await db.execute(
    "delete from conversations where id = $1",
    [id]
  )
}

// Toggle conversation pin status
export async function toggleConversationPin(id: number): Promise<boolean> {
  const db = await getDb()
  if (!db) return false
  const conv = await getConversation(id)
  if (!conv) return false

  const newPinState = conv.isPinned ? 0 : 1
  await db.execute(
    "update conversations set isPinned = $1 where id = $2",
    [newPinState, id]
  )
  return !conv.isPinned
}

// Sync conversation message count (recount from actual messages)
export async function syncConversationMessageCount(conversationId: number): Promise<void> {
  const db = await getDb()
  if (!db) return
  const result = await db.select<{ count: number }[]>(
    "select count(*) as count from chats where conversationId = $1",
    [conversationId]
  )
  const actualCount = result[0]?.count || 0

  await db.execute(
    "update conversations set messageCount = $1 where id = $2",
    [actualCount, conversationId]
  )
}
