/**
 * BM25 Retrieval Module
 * Chinese-friendly BM25 algorithm implementation, no external tokenizer required
 */

/**
 * Document item structure
 */
export interface BM25Document {
  id: string;           // Document unique identifier (usually filename)
  content: string;      // Document content
}

/**
 * Search result
 */
export interface BM25Result {
  id: string;           // Document ID
  score: number;        // BM25 score
}

/**
 * BM25 Index class
 */
export class BM25Index {
  private documents: Map<string, string> = new Map(); // id -> content
  private docVectors: Map<string, Map<string, number>> = new Map(); // id -> token -> frequency
  private idfCache: Map<string, number> = new Map(); // token -> IDF
  private docLengths: Map<string, number> = new Map(); // id -> document length
  private averageDocLength: number = 0;

  // BM25 parameters
  private k1: number;  // Term frequency saturation parameter
  private b: number;   // Length normalization parameter

  constructor(k1: number = 1.2, b: number = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  /**
   * Chinese-friendly tokenization function
   * Uses hybrid strategy: boundary split + filter single chars + filter numbers
   *
   * Example:
   * "RAG检索增强生成系统用于智能问答"
   * -> ["RAG", "检索", "增强", "生成", "系统", "用于", "智能", "问答"]
   */
  private tokenize(text: string): string[] {
    // 1. Split by boundaries: punctuation, spaces, Chinese-English boundaries
    // Match: English words, numbers, consecutive Chinese (2 or more)
    const tokens: string[] = [];

    // Regex patterns:
    // - English words/numbers: [a-zA-Z0-9]+
    // - Chinese words (2+ chars): [\u4e00-\u9fa5]{2,}
    const pattern = /[a-zA-Z0-9]+|[\u4e00-\u9fa5]{2,}/g;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const token = match[0];

      // 2. Filter pure numbers (e.g., "123", "2024")
      if (/^\d+$/.test(token)) {
        continue;
      }

      // 3. Convert to lowercase (English)
      const normalizedToken = token.toLowerCase();

      tokens.push(normalizedToken);
    }

    return tokens;
  }

  /**
   * Build index
   * @param documents List of documents
   */
  index(documents: BM25Document[]): void {
    // Clear existing index
    this.documents.clear();
    this.docVectors.clear();
    this.idfCache.clear();
    this.docLengths.clear();

    const N = documents.length;
    let totalLength = 0;

    // 1. Process each document
    for (const doc of documents) {
      const tokens = this.tokenize(doc.content);
      const tokenFreq = new Map<string, number>();

      // Calculate term frequency
      for (const token of tokens) {
        tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
      }

      // Store document and term frequency vector
      this.documents.set(doc.id, doc.content);
      this.docVectors.set(doc.id, tokenFreq);
      this.docLengths.set(doc.id, tokens.length);
      totalLength += tokens.length;
    }

    // 2. Calculate average document length
    this.averageDocLength = N > 0 ? totalLength / N : 0;

    // 3. Calculate IDF
    this.calculateIDF(N);
  }

  /**
   * Calculate IDF (Inverse Document Frequency)
   * @param N Total number of documents
   */
  private calculateIDF(N: number): void {
    // Count how many documents each token appears in
    const docFreq = new Map<string, number>();

    for (const [, tokenFreq] of this.docVectors.entries()) {
      for (const token of tokenFreq.keys()) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    // Calculate IDF: log((N - df + 0.5) / (df + 0.5) + 1)
    for (const [token, df] of docFreq.entries()) {
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
      this.idfCache.set(token, idf);
    }
  }

  /**
   * Search
   * @param query Query text
   * @param limit Return result count limit
   * @returns Sorted search results
   */
  search(query: string, limit: number = 10): BM25Result[] {
    const queryTokens = this.tokenize(query);

    const results: Map<string, number> = new Map();

    // Calculate BM25 score for each document
    for (const [docId, docVector] of this.docVectors.entries()) {
      const docLength = this.docLengths.get(docId) || 0;
      let score = 0;

      // BM25 formula:
      // score = Σ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgDl))
      for (const token of queryTokens) {
        // Check if token is in document
        const freq = docVector.get(token) || 0;
        if (freq === 0) continue;

        // Get IDF
        const idf = this.idfCache.get(token) || 0;

        // Calculate BM25 score component
        const numerator = freq * (this.k1 + 1);
        const denominator = freq + this.k1 * (1 - this.b + this.b * (docLength / this.averageDocLength));
        const componentScore = idf * (numerator / denominator);

        score += componentScore;
      }

      if (score > 0) {
        results.set(docId, score);
      }
    }

    // Sort by score descending
    const sortedResults = Array.from(results.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, score]) => ({ id, score }));

    return sortedResults;
  }

  /**
   * Update single document
   * @param document Document to update
   */
  update(document: BM25Document): void {
    // If document exists, delete first
    if (this.documents.has(document.id)) {
      this.delete(document.id);
    }

    // Add new document
    this.index([document]);
  }

  /**
   * Delete document
   * @param docId Document ID
   */
  delete(docId: string): void {
    if (!this.documents.has(docId)) {
      return;
    }

    // Delete document
    this.documents.delete(docId);
    this.docVectors.delete(docId);
    this.docLengths.delete(docId);

    // Recalculate IDF (because document frequency changed)
    this.calculateIDF(this.documents.size);

    // Recalculate average document length
    const totalLength = Array.from(this.docLengths.values()).reduce((a, b) => a + b, 0);
    this.averageDocLength = this.documents.size > 0 ? totalLength / this.documents.size : 0;
  }

  /**
   * Get document count in index
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Clear index
   */
  clear(): void {
    this.documents.clear();
    this.docVectors.clear();
    this.idfCache.clear();
    this.docLengths.clear();
    this.averageDocLength = 0;
  }
}

/**
 * Global BM25 index instance
 */
let globalBM25Index: BM25Index | null = null;

/**
 * Initialize global BM25 index
 * @param documents List of documents
 */
export function initBM25Index(documents: BM25Document[]): BM25Index {
  if (!globalBM25Index) {
    globalBM25Index = new BM25Index();
  }
  globalBM25Index.index(documents);
  return globalBM25Index;
}

/**
 * Get global BM25 index
 */
export function getBM25Index(): BM25Index | null {
  return globalBM25Index;
}

/**
 * Clear global BM25 index
 */
export function clearBM25Index(): void {
  if (globalBM25Index) {
    globalBM25Index.clear();
    globalBM25Index = null;
  }
}
