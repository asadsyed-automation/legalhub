import apiClient from './client';

export const lawyerApi = {
  /**
   * Fetch current lawyer's application
   * @returns {Promise<{ success: boolean, data: { application: object } }>}
   */
  getApplication: () => apiClient.get('/lawyer/application'),

  /**
   * Submit initial lawyer application
   * @param {object} payload
   * @returns {Promise<{ success: boolean, data: { application: object } }>}
   */
  submitApplication: (payload) => apiClient.post('/lawyer/application', payload),

  /**
   * Re-submit an application after rejection
   * @param {object} payload
   * @returns {Promise<{ success: boolean, data: { application: object } }>}
   */
  updateApplication: (payload) => apiClient.put('/lawyer/application', payload),
};

export default lawyerApi;
