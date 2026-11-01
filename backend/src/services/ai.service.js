const config = require('../config/env');

/**
 * Service to interface with the Python FastAPI AI Document Summarizer & Bilingual Search microservice.
 * Uses Node 20 built-in global fetch with AbortSignal timeout and heuristic fallback.
 */

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Heuristic fallback summarizer if AI service is offline or warming up.
 */
const heuristicSummarize = (text, maxLength = 250) => {
  const urduMatch = text.match(/[\u0600-\u06FF]/g);
  const isUrdu = urduMatch && urduMatch.length / text.length > 0.15;
  const lang = isUrdu ? 'ur' : 'en';

  const sentences = text
    .split(/[.!?۔\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const selected = sentences.slice(0, 3);
  const summary = selected.join(isUrdu ? '۔ ' : '. ') + (selected.length > 0 ? (isUrdu ? '۔' : '.') : '');
  const words = text.trim().split(/\s+/).filter(Boolean);

  return {
    summary: summary || text.slice(0, 200),
    key_clauses: selected.slice(0, 2),
    entities: {
      statutes: [],
      courts: [],
      parties: [],
      dates: []
    },
    language: lang,
    word_count: words.length,
    reading_time_minutes: Math.round((words.length / 200) * 100) / 100,
    source: 'heuristic_fallback'
  };
};

/**
 * Heuristic fallback search if AI service is offline.
 */
const heuristicSearch = (query, documents, topK = 10) => {
  const qLower = query.trim().toLowerCase();
  const tokens = qLower.split(/[\s,;.!?۔]+/).filter((t) => t.length > 1);

  const results = [];

  for (const doc of documents) {
    const textLower = (doc.text || '').toLowerCase();
    const titleLower = (doc.title || '').toLowerCase();

    let score = 0;
    if (textLower.includes(qLower)) score += 5;
    if (titleLower.includes(qLower)) score += 4;

    for (const token of tokens) {
      if (textLower.includes(token)) score += 1;
      if (titleLower.includes(token)) score += 2;
    }

    if (score > 0) {
      const matchIndex = textLower.indexOf(tokens[0] || qLower);
      const start = Math.max(0, matchIndex - 40);
      const end = Math.min(doc.text.length, matchIndex + 100);
      let snippet = doc.text.substring(start, end).trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < doc.text.length) snippet = snippet + '...';

      results.push({
        id: doc.id,
        title: doc.title || 'Untitled Document',
        score: Math.min(score / 10, 1.0),
        snippet: snippet || doc.text.substring(0, 120)
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return {
    query,
    total_matches: results.length,
    results: results.slice(0, topK),
    source: 'heuristic_fallback'
  };
};

/**
 * Summarize a legal text document via FastAPI AI service.
 *
 * @param {object} params
 * @param {string} params.text - Document content
 * @param {string} [params.language='auto'] - 'auto', 'en', or 'ur'
 * @param {number} [params.maxLength=250] - Desired summary word limit
 * @returns {Promise<object>} Summary, extracted entities, and metadata
 */
const summarizeDocument = async ({ text, language = 'auto', maxLength = 250 }) => {
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    throw new Error('Document text must be at least 10 characters long to summarize');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.aiServiceUrl}/api/v1/ai/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        language,
        max_length: maxLength
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[AI_SERVICE_WARN] AI service returned HTTP ${res.status}. Falling back to heuristic.`);
      return heuristicSummarize(text, maxLength);
    }

    const data = await res.json();
    return {
      ...data,
      source: 'ai_service'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[AI_SERVICE_CONNECT_NOTICE] Could not reach AI service at ${config.aiServiceUrl} (${err.message}). Using local heuristic summarizer.`);
    return heuristicSummarize(text, maxLength);
  }
};

/**
 * Perform bilingual search across case documents and diary entries.
 *
 * @param {object} params
 * @param {string} params.query - Search query (English or Urdu)
 * @param {Array<{ id: string, title?: string, text: string }>} params.documents - List of documents to search
 * @param {number} [params.topK=10]
 * @returns {Promise<object>} Search results
 */
const searchDocuments = async ({ query, documents, topK = 10 }) => {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Search query is required');
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    return {
      query,
      total_matches: 0,
      results: [],
      source: 'empty_corpus'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.aiServiceUrl}/api/v1/ai/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        documents,
        top_k: topK
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[AI_SERVICE_WARN] AI service returned HTTP ${res.status}. Falling back to heuristic search.`);
      return heuristicSearch(query, documents, topK);
    }

    const data = await res.json();
    return {
      ...data,
      source: 'ai_service'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[AI_SERVICE_CONNECT_NOTICE] Could not reach AI service at ${config.aiServiceUrl} (${err.message}). Using local heuristic search.`);
    return heuristicSearch(query, documents, topK);
  }
};

module.exports = {
  summarizeDocument,
  searchDocuments,
  heuristicSummarize,
  heuristicSearch
};
