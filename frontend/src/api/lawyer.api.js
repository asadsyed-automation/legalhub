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

  /**
   * Fetch approved lawyer's profile details
   * @returns {Promise<{ profile: object }>}
   */
  getProfile: () => apiClient.get('/lawyer/profile'),

  /**
   * Upsert lawyer's profile details
   * @param {object} payload { headline, about, languages, slotMinutes, isPublic }
   * @returns {Promise<{ profile: object }>}
   */
  updateProfile: (payload) => apiClient.put('/lawyer/profile', payload),

  /**
   * Fetch lawyer's consultation services
   * @returns {Promise<{ services: Array }>}
   */
  getServices: () => apiClient.get('/lawyer/services'),

  /**
   * Replace lawyer's full set of consultation services
   * @param {Array} services
   * @returns {Promise<{ services: Array }>}
   */
  updateServices: (services) => apiClient.put('/lawyer/services', { services }),

  /**
   * Fetch weekly availability rules
   * @returns {Promise<Array>}
   */
  getAvailability: () => apiClient.get('/lawyer/availability'),

  /**
   * Replace weekly availability rules
   * @param {Array} rules [{ weekday, startTime, endTime }]
   * @returns {Promise<Array>}
   */
  updateAvailability: (rules) => apiClient.put('/lawyer/availability', { rules }),

  /**
   * Fetch blocked dates
   * @returns {Promise<Array>}
   */
  getBlockedDates: () => apiClient.get('/lawyer/blocked-dates'),

  /**
   * Add a new blocked date
   * @param {object} payload { date: 'YYYY-MM-DD', reason?: string }
   * @returns {Promise<object>}
   */
  addBlockedDate: (payload) => apiClient.post('/lawyer/blocked-dates', payload),

  /**
   * Delete a blocked date by ID
   * @param {string} id
   * @returns {Promise<object>}
   */
  deleteBlockedDate: (id) => apiClient.delete(`/lawyer/blocked-dates/${id}`),
};

export default lawyerApi;
