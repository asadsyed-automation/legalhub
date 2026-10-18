import apiClient from './client';

export const adminApi = {
  /**
   * List advocate applications with optional status filter
   * @param {string} [status] - 'pending' | 'approved' | 'rejected'
   * @returns {Promise<{ success: boolean, data: { applications: Array<object> } }>}
   */
  getApplications: (status) =>
    apiClient.get('/admin/applications', {
      params: status ? { status } : {},
    }),

  /**
   * Approve an advocate's application
   * @param {string} id - Application UUID
   * @returns {Promise<{ success: boolean, data: { application: object } }>}
   */
  approveApplication: (id) =>
    apiClient.patch(`/admin/applications/${id}/approve`),

  /**
   * Reject an advocate's application with mandatory reason (>= 10 chars)
   * @param {string} id - Application UUID
   * @param {string} rejectionReason - Explanation of at least 10 characters
   * @returns {Promise<{ success: boolean, data: { application: object } }>}
   */
  rejectApplication: (id, rejectionReason) =>
    apiClient.patch(`/admin/applications/${id}/reject`, { rejectionReason }),
};

export default adminApi;
