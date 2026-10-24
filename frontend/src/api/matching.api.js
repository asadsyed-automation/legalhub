import apiClient from './client';

export const matchingApi = {
  /**
   * Classify free-text legal problem into practice area with confidence metrics
   * @param {string} text - Grievance description (10-1000 chars)
   * @returns {Promise<{ practiceArea: string|null, confidence: 'high'|'low'|'none', matchedKeywords: string[], alternatives: string[], followUpQuestions: Array }>}
   */
  classify: (text) => apiClient.post('/match/classify', { text }),

  /**
   * Search and score advocates based on multi-factor objective criteria
   * @param {object} criteria { practiceArea, city, urgency, maxFeePkr, mode, language, page, limit }
   * @returns {Promise<{ items: Array, total: number, page: number, limit: number }>}
   */
  search: (criteria) => apiClient.post('/match/search', criteria),
};

export default matchingApi;
