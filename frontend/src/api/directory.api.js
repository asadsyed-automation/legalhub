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
};

export default directoryApi;
