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

  /**
   * Verify email registration with 6-digit OTP code
   * @param {{ email: string, code: string }} payload
   * @returns {Promise<{ message: string, token: string, user: object }>}
   */
  verifyEmail: (payload) => apiClient.post('/auth/verify-email', payload),

  /**
   * Resend 6-digit email verification OTP code
   * @param {{ email: string }} payload
   * @returns {Promise<{ message: string }>}
   */
  resendCode: (payload) => apiClient.post('/auth/resend-code', payload),

  /**
   * Request password reset code
   * @param {{ email: string }} payload
   * @returns {Promise<{ message: string }>}
   */
  forgotPassword: (payload) => apiClient.post('/auth/forgot-password', payload),

  /**
   * Reset password with 6-digit OTP code and new password
   * @param {{ email: string, code: string, newPassword: string }} payload
   * @returns {Promise<{ message: string }>}
   */
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),
};

export default authApi;
