import apiClient from './client';

export const directoryApi = {
  /**
   * Search public lawyer directory with filters and pagination
   * @param {{ city?: string, practiceArea?: string, page?: number, limit?: number }} params
   * @returns {Promise<{ success: boolean, data: { lawyers: Array<object>, pagination: object } }>}
   */
  getLawyers: (params = {}) => apiClient.get('/lawyers', { params }),

  /**
   * Fetch public detail for a single verified advocate
   * @param {string} id - Lawyer UUID
   * @returns {Promise<{ success: boolean, data: { lawyer: object } }>}
   */
  getLawyerById: (id) => apiClient.get(`/lawyers/${id}`),

  /**
   * Fetch available calendar slots for an advocate
   * @param {string} id - Lawyer UUID
   * @param {string} from - YYYY-MM-DD
   * @param {string} to - YYYY-MM-DD
   * @returns {Promise<{ slots: Array, lawyerId: string }>}
   */
  getSlots: (id, from, to) => apiClient.get(`/lawyers/${id}/slots`, { params: { from, to } }),

  /**
   * Fetch verified public reviews for an advocate
   * @param {string} id - Lawyer UUID
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @returns {Promise<{ reviews: Array, pagination: object, stats: object }>}
   */
  getReviews: (id, page = 1, limit = 10) =>
    apiClient.get(`/lawyers/${id}/reviews`, { params: { page, limit } }),
};

export default directoryApi;
