import apiClient from './client';

export const engagementApi = {
  /**
   * Create a legal case engagement from a completed consultation or direct request
   * @param {{ clientId?: string, lawyerId?: string, bookingId?: string, title: string, practiceArea?: string, notes?: string }} data
   * @returns {Promise<{ engagement: object }>}
   */
  createEngagement: (data) => apiClient.post('/engagements', data),

  /**
   * Fetch paginated legal engagements for current participant
   * @param {{ status?: string, page?: number, limit?: number }} [params]
   * @returns {Promise<{ engagements: Array<object>, pagination: object }>}
   */
  getEngagements: (params = {}) => apiClient.get('/engagements', { params }),

  /**
   * Fetch details of a single legal engagement
   * @param {string} id - Engagement UUID
   * @returns {Promise<{ engagement: object }>}
   */
  getEngagementById: (id) => apiClient.get(`/engagements/${id}`),

  /**
   * Update legal engagement status or notes
   * @param {string} id - Engagement UUID
   * @param {{ status?: string, notes?: string }} data
   * @returns {Promise<{ engagement: object }>}
   */
  updateEngagement: (id, data) => apiClient.patch(`/engagements/${id}`, data),
};

export default engagementApi;
