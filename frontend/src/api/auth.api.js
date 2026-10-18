import apiClient from './client';

export const authApi = {
  /**
   * Register a new user (client or lawyer)
   * @param {{ name: string, email: string, password: string, role: 'client'|'lawyer' }} payload
   * @returns {Promise<{ success: boolean, data: { user: object, token: string } }>}
   */
  register: (payload) => apiClient.post('/auth/register', payload),

  /**
   * Log in an existing user
   * @param {{ email: string, password: string }} payload
   * @returns {Promise<{ success: boolean, data: { user: object, token: string } }>}
   */
  login: (payload) => apiClient.post('/auth/login', payload),

  /**
   * Retrieve current authenticated user profile
   * @returns {Promise<{ success: boolean, data: { user: object } }>}
   */
  getMe: () => apiClient.get('/auth/me'),
};

export default authApi;
