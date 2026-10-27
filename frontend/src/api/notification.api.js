import apiClient from './client';

export const notificationApi = {
  /**
   * Retrieves paginated notifications for the authenticated user.
   * @param {Object} [params] - Query parameters (page, limit, unreadOnly)
   * @returns {Promise<{ items: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  getNotifications: async (params = {}) => {
    return apiClient.get('/notifications', { params });
  },

  /**
   * Retrieves the current unread notifications count for the authenticated user.
   * @returns {Promise<{ count: number }>}
   */
  getUnreadCount: async () => {
    return apiClient.get('/notifications/unread-count');
  },

  /**
   * Marks a specific notification as read.
   * @param {string} id - Notification UUID
   * @returns {Promise<Object>}
   */
  markAsRead: async (id) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Marks all unread notifications as read for the authenticated user.
   * @returns {Promise<{ success: boolean, updatedCount: number }>}
   */
  markAllAsRead: async () => {
    return apiClient.patch('/notifications/read-all');
  },
};

export default notificationApi;
