import apiClient from './client';

export const feedApi = {
  /**
   * Fetch public questions list with filtering and pagination
   * @param {object} [params] - { page, limit, practiceArea, city, status, search }
   * @returns {Promise<{ questions: Array, pagination: object }>}
   */
  getQuestions: (params) => apiClient.get('/feed', { params }),

  /**
   * Fetch a single question by ID with advocate answers and lawyer cards
   * @param {string} id - Question UUID
   * @returns {Promise<{ question: object }>}
   */
  getQuestionById: (id) => apiClient.get(`/feed/${id}`),

  /**
   * Post a new legal enquiry / question (Client only)
   * @param {object} payload - { title, description, practiceArea, city }
   * @returns {Promise<object>}
   */
  createQuestion: (payload) => apiClient.post('/feed', payload),

  /**
   * Post an advocate answer to a question (Admin-Reviewed Advocate only)
   * @param {string} questionId
   * @param {object} payload - { content }
   * @returns {Promise<object>}
   */
  createAnswer: (questionId, payload) => apiClient.post(`/feed/${questionId}/answers`, payload),

  /**
   * Mark a question as resolved / closed (Client owner only)
   * @param {string} questionId
   * @returns {Promise<{ message: string, question: object }>}
   */
  closeQuestion: (questionId) => apiClient.patch(`/feed/${questionId}/close`),

  /**
   * Delete a question (Admin moderation or author Client)
   * @param {string} questionId
   * @returns {Promise<{ id: string, message: string }>}
   */
  deleteQuestion: (questionId) => apiClient.delete(`/feed/${questionId}`)
};

export default feedApi;

