import apiClient from './client';

export const caseApi = {
  /**
   * Retrieves paginated cases accessible to the authenticated user.
   * Role-aware: Advocates receive chamber cases; Clients receive linked cases.
   *
   * @param {object} params - { status, practiceArea, court, page, limit }
   * @returns {Promise<{ success: boolean, message: string, data: { items: Array, total: number, page: number, limit: number, totalPages: number } }>}
   */
  getCases: async (params = {}) => {
    return apiClient.get('/cases', { params });
  },

  /**
   * Retrieves a single case file by UUID.
   *
   * @param {string} id - Case UUID
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  getCaseById: async (id) => {
    return apiClient.get(`/cases/${id}`);
  },

  /**
   * Creates a new case file (Approved advocates only).
   *
   * @param {object} payload - { title, practiceArea, court, caseOrFirNumber, filingDate, parties, bookingId, status, stage }
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  createCase: async (payload) => {
    return apiClient.post('/cases', payload);
  },

  /**
   * Updates an existing case file (Assigned advocate only).
   * Supports field updates, status/stage transitions, and full party replacement.
   *
   * @param {string} id - Case UUID
   * @param {object} payload - Partial update payload
   * @returns {Promise<{ success: boolean, message: string, data: object }>}
   */
  updateCase: async (id, payload) => {
    return apiClient.patch(`/cases/${id}`, payload);
  },

  // ==========================================
  // Case Diary Entries (/cases/:id/entries)
  // ==========================================

  getEntries: async (caseId, params = {}) => {
    return apiClient.get(`/cases/${caseId}/entries`, { params });
  },

  createEntry: async (caseId, payload) => {
    return apiClient.post(`/cases/${caseId}/entries`, payload);
  },

  updateEntry: async (caseId, entryId, payload) => {
    return apiClient.patch(`/cases/${caseId}/entries/${entryId}`, payload);
  },

  // ==========================================
  // Court Hearings (/cases/:id/hearings & /hearings)
  // ==========================================

  getHearings: async (caseId) => {
    return apiClient.get(`/cases/${caseId}/hearings`);
  },

  createHearing: async (caseId, payload) => {
    return apiClient.post(`/cases/${caseId}/hearings`, payload);
  },

  updateHearing: async (caseId, hearingId, payload) => {
    return apiClient.patch(`/cases/${caseId}/hearings/${hearingId}`, payload);
  },

  recordQuickOutcome: async (hearingId, payload) => {
    return apiClient.patch(`/hearings/${hearingId}/outcome`, payload);
  },

  listHearingsAcrossCases: async (params = {}) => {
    return apiClient.get('/hearings', { params });
  },
};

export default caseApi;
