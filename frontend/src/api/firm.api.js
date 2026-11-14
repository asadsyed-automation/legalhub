import apiClient from './client';

export const firmApi = {
  /**
   * Fetch all associate members of the Law Firm chamber
   */
  getMembers: () => apiClient.get('/firm/members'),

  /**
   * Add / invite a lawyer to the firm chamber
   * @param {object} payload - { lawyerEmail, enrolmentNo, designation }
   */
  addMember: (payload) => apiClient.post('/firm/members', payload),

  /**
   * Update member designation or active status
   * @param {string} memberId
   * @param {object} payload - { designation, status }
   */
  updateMember: (memberId, payload) => apiClient.patch(`/firm/members/${memberId}`, payload),

  /**
   * Remove an associate lawyer from the firm chamber
   * @param {string} memberId
   */
  removeMember: (memberId) => apiClient.delete(`/firm/members/${memberId}`),

  /**
   * Assign or delegate a firm case to an associate advocate
   * @param {string} caseId
   * @param {string|null} assignedLawyerId
   */
  assignCase: (caseId, assignedLawyerId) =>
    apiClient.patch(`/firm/cases/${caseId}/assign`, { assignedLawyerId }),

  /**
   * Fetch aggregated dashboard statistics for the Law Firm
   */
  getFirmStats: () => apiClient.get('/firm/stats'),

  /**
   * Search available practicing advocates to add to firm
   * @param {string} q
   */
  searchLawyers: (q) => apiClient.get('/firm/lawyers/search', { params: { q } })
};

export default firmApi;

