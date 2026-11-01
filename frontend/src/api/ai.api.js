/**
 * AI Microservice Client
 * Communicates with the FastAPI AI Document Summarizer & Bilingual Search microservice.
 * Provides graceful degradation when the service is unreachable or unconfigured.
 */

const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
const AI_REQUEST_TIMEOUT_MS = 6000;

export const aiApi = {
  /**
   * Summarizes previous case diary entries.
   *
   * @param {Array<object>} entries - Array of case diary entries
   * @param {number} [maxLength=200] - Word limit for the extractive summary
   * @returns {Promise<{ available: boolean, summary?: string, error?: string, reason?: string }>}
   */
  summarizePreviousEntries: async (entries, maxLength = 200) => {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return { available: false, reason: 'no_entries' };
    }

    // Extract text from the latest entries (prioritize hearing or order entries, otherwise recent entries)
    const sorted = [...entries].sort((a, b) => {
      const dateA = new Date(a.entryDate || a.createdAt || 0);
      const dateB = new Date(b.entryDate || b.createdAt || 0);
      return dateB - dateA;
    });

    const recent = sorted.slice(0, 3);
    const textPieces = recent
      .map((e) => {
        const typeLabel = e.entryType ? `[${e.entryType.toUpperCase()}] ` : '';
        const title = e.title ? `${e.title}. ` : '';
        const body = e.body || '';
        return `${typeLabel}${title}${body}`.trim();
      })
      .filter((t) => t.length > 5);

    const contentToSummarize = textPieces.join('\n\n');

    if (!contentToSummarize || contentToSummarize.length < 10) {
      return {
        available: false,
        reason: 'insufficient_text',
        message: 'Previous entries do not contain sufficient text for AI summarization.',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${AI_BASE_URL}/api/v1/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: contentToSummarize,
          language: 'auto',
          max_length: maxLength,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          available: false,
          reason: 'unavailable',
          message: `AI service returned HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        available: true,
        summary: data.summary,
        keyClauses: data.key_clauses || [],
        entities: data.entities || {},
        language: data.language || 'en',
        wordCount: data.word_count || 0,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      return {
        available: false,
        reason: 'unavailable',
        error: err.message || 'Connection failed',
      };
    }
  },

  /**
   * Health check probe for AI microservice.
   *
   * @returns {Promise<boolean>}
   */
  checkHealth: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${AI_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },
};

export default aiApi;
