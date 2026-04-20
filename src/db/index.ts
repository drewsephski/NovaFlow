
import Database from '@tauri-apps/plugin-sql';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

// Database instance cache
let dbInstance: Database | null = null;

// Get database instance (lazy load)
export async function getDb(): Promise<Database | null> {
  if (!isTauriEnvironment()) {
    return null;
  }
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:note.db');
  }
  return dbInstance;
}

// For backward compatibility, keep db export but null in non-Tauri environment
export const db: Database | null = null;

// Initialize all databases
export async function initAllDatabases() {
  if (!isTauriEnvironment()) {
    console.log('Skipping database initialization: not in Tauri environment');
    return;
  }

  // Import database initialization functions
  const { initChatsDb } = await import('./chats');
  const { initMarksDb } = await import('./marks');
  const { initNotesDb } = await import('./notes');
  const { initTagsDb } = await import('./tags');
  const { initVectorDb } = await import('./vector');
  const { initConversationsDb } = await import('./conversations');
  const { initMemoriesDb } = await import('./memories');
  const { initActivityDb } = await import('./activity');

  // Execute initialization: ensure base tables exist first, then migrate/add columns for conversations
  await initChatsDb();
  await initConversationsDb();
  await initMarksDb();
  await initNotesDb();
  await initTagsDb();
  await initVectorDb();
  await initMemoriesDb();
  await initActivityDb();
}
