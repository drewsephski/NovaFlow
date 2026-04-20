import { getDb } from './index';

// Vector database table schema definition
export interface VectorDocument {
  id: number;
  filename: string;   // Filename
  chunk_id: number;   // Chunk ID
  content: string;    // Chunk content
  embedding: string;  // Vector stored as JSON string
  updated_at: number; // Timestamp
}

// Vector cache item
interface CachedVector {
  id: number;
  filename: string;
  content: string;
  embedding: number[];  // Parsed vector
  updated_at: number;
}

// Vector cache management
class VectorCache {
  private cache: Map<number, CachedVector> = new Map();
  private vectorsByFilename: Map<string, number[]> = new Map(); // Filename to vector ID list mapping
  private lastUpdate: number = 0;
  private cacheVersion: number = 0;

  // Get cache version number, used to check if cache is expired
  getVersion(): number {
    return this.cacheVersion;
  }

  // Get all vectors from cache
  getAll(): CachedVector[] {
    return Array.from(this.cache.values());
  }

  // Get vectors by filename
  getByFilename(filename: string): CachedVector[] {
    const ids = this.vectorsByFilename.get(filename) || [];
    return ids.map(id => this.cache.get(id)).filter(Boolean) as CachedVector[];
  }

  // Update cache
  async update() {
    const db = await getDb()
    if (!db) return
    const docs = await db.select<VectorDocument[]>(`
      select id, filename, content, embedding, updated_at from vector_documents
    `);

    // Clear old cache
    this.cache.clear();
    this.vectorsByFilename.clear();

    // Build new cache
    for (const doc of docs) {
      try {
        const embedding = JSON.parse(doc.embedding) as number[];
        const cached: CachedVector = {
          id: doc.id,
          filename: doc.filename,
          content: doc.content,
          embedding,
          updated_at: doc.updated_at
        };
        this.cache.set(doc.id, cached);

        // Index by filename
        if (!this.vectorsByFilename.has(doc.filename)) {
          this.vectorsByFilename.set(doc.filename, []);
        }
        this.vectorsByFilename.get(doc.filename)!.push(doc.id);
      } catch (error) {
        console.error(`Failed to parse embedding for doc ${doc.id}:`, error);
      }
    }

    this.lastUpdate = Date.now();
    this.cacheVersion++;
  }

  // Add single vector to cache
  add(doc: VectorDocument) {
    try {
      const embedding = JSON.parse(doc.embedding) as number[];
      const cached: CachedVector = {
        id: doc.id,
        filename: doc.filename,
        content: doc.content,
        embedding,
        updated_at: doc.updated_at
      };
      this.cache.set(doc.id, cached);

      if (!this.vectorsByFilename.has(doc.filename)) {
        this.vectorsByFilename.set(doc.filename, []);
      }
      this.vectorsByFilename.get(doc.filename)!.push(doc.id);
      this.cacheVersion++;
    } catch (error) {
      console.error(`Failed to add vector to cache for doc ${doc.id}:`, error);
    }
  }

  // Delete all vectors for a file
  deleteByFilename(filename: string) {
    const ids = this.vectorsByFilename.get(filename) || [];
    for (const id of ids) {
      this.cache.delete(id);
    }
    this.vectorsByFilename.delete(filename);
    this.cacheVersion++;
  }

  // Check if cache needs update (expires after 5 minutes)
  needsUpdate(): boolean {
    return Date.now() - this.lastUpdate > 5 * 60 * 1000 || this.cache.size === 0;
  }
}

// Global vector cache instance
const vectorCache = new VectorCache();

// Initialize vector database tables
export async function initVectorDb() {
  const db = await getDb()
  if (!db) return
  await db.execute(`
    create table if not exists vector_documents (
      id integer primary key autoincrement,
      filename text not null,
      chunk_id integer not null,
      content text not null,
      embedding text not null,
      updated_at integer not null,
      unique(filename, chunk_id)
    )
  `);

  // Create index for fast file lookup
  await db.execute(`
    create index if not exists idx_vector_documents_filename
    on vector_documents(filename)
  `);

  // Initialize cache
  await vectorCache.update();
}

// Insert or update vector document
export async function upsertVectorDocument(doc: Omit<VectorDocument, 'id'>) {
  const db = await getDb()
  if (!db) return
  await db.execute(
    "insert into vector_documents (filename, chunk_id, content, embedding, updated_at) values ($1, $2, $3, $4, $5) on conflict(filename, chunk_id) do update set content = excluded.content, embedding = excluded.embedding, updated_at = excluded.updated_at",
    [doc.filename, doc.chunk_id, doc.content, doc.embedding, doc.updated_at]);

  // Get inserted document ID and update cache
  const inserted = await db!.select<VectorDocument[]>(
    "select * from vector_documents where filename = $1 and chunk_id = $2",
    [doc.filename, doc.chunk_id]
  );

  if (inserted.length > 0) {
    vectorCache.add(inserted[0]);
  }
}

// Get all vector documents for a filename
export async function getVectorDocumentsByFilename(filename: string) {
  const db = await getDb()
  if (!db) return []
  return await db.select<VectorDocument[]>(
    "select * from vector_documents where filename = $1 order by chunk_id",
    [filename]);
}

// Delete vector documents by filename
export async function deleteVectorDocumentsByFilename(filename: string) {
  const db = await getDb()
  if (!db) return
  await db.execute(
    "delete from vector_documents where filename = $1",
    [filename]);

  // Remove from cache
  vectorCache.deleteByFilename(filename);
}

// Check if file exists in vector database
export async function checkVectorDocumentExists(filename: string) {
  const db = await getDb()
  if (!db) return false
  const result = await db.select<{ count: number }[]>(
    "select count(*) as count from vector_documents where filename = $1",
    [filename]);
  
  return result[0]?.count > 0;
}

// Get most similar document chunks (optimized: uses cache)
export async function getSimilarDocuments(
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7
): Promise<{id: number, filename: string, content: string, similarity: number}[]> {
  // Check if cache needs update
  if (vectorCache.needsUpdate()) {
    await vectorCache.update();
  }

  // Get all vectors from cache (already parsed, avoids repeated JSON.parse)
  const cachedVectors = vectorCache.getAll();

  if (!cachedVectors.length) return [];

  // Calculate cosine similarity and sort
  const allSimilarities = cachedVectors.map(doc => {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);

    return {
      id: doc.id,
      filename: doc.filename,
      content: doc.content,
      similarity
    };
  });

  const results = allSimilarities
  .filter(doc => doc.similarity >= threshold)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, limit);

  return results;
}

// Cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vector dimensions do not match');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Clear vector database
export async function clearVectorDb() {
  const db = await getDb()
  if (!db) return
  await db.execute(`
    delete from vector_documents
  `);

  // Clear cache
  await vectorCache.update();
}

// Get list of all vector document filenames
export async function getAllVectorDocumentFilenames() {
  const db = await getDb()
  if (!db) return []
  return await db.select<{filename: string}[]>(`
    select distinct filename from vector_documents
  `);
}

// Manually refresh vector cache
export async function refreshVectorCache() {
  await vectorCache.update();
}
