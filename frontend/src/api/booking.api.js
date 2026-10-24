import apiClient from './client';

export const bookingApi = {
  /**
   * Create a consultation booking appointment (Client action)
   * @param {{ lawyerId: string, mode: string, startsAt: string, issueSummary?: string, clientNotes?: string }} data
   * @returns {Promise<{ booking: object }>}
   */
  createBooking: (data) => apiClient.post('/bookings', data),

  /**
   * Fetch paginated consultation appointments for authenticated client
   * @param {{ status?: string, page?: number, limit?: number }} [params]
   * @returns {Promise<{ bookings: Array<object>, pagination: object }>}
   */
  getClientBookings: (params = {}) => apiClient.get('/bookings/my-appointments', { params }),

  /**
   * Fetch incoming consultation appointments for authenticated advocate
   * @param {{ status?: string, page?: number, limit?: number }} [params]
   * @returns {Promise<{ bookings: Array<object>, pagination: object }>}
   */
  getLawyerAppointments: (params = {}) => apiClient.get('/lawyer/appointments', { params }),

  /**
   * Fetch details of a single consultation appointment with timeline events
   * @param {string} id - Booking UUID
   * @returns {Promise<{ booking: object }>}
   */
  getBookingById: (id) => apiClient.get(`/bookings/${id}`),

  /**
   * Advocate accepts a consultation appointment request
   * @param {string} id - Booking UUID
   * @param {{ lawyerNotes?: string }} [data]
   * @returns {Promise<{ booking: object }>}
   */
  acceptBooking: (id, data = {}) => apiClient.patch(`/bookings/${id}/accept`, data),

  /**
   * Advocate declines a consultation appointment request
   * @param {string} id - Booking UUID
   * @param {{ reason: string }} data
   * @returns {Promise<{ booking: object }>}
   */
  declineBooking: (id, data) => apiClient.patch(`/bookings/${id}/decline`, data),

  /**
   * Client simulates sandbox payment for an accepted consultation
   * @param {string} id - Booking UUID
   * @param {{ method?: string }} [data]
   * @returns {Promise<{ booking: object, payment: object }>}
   */
  payBooking: (id, data = { method: 'sandbox' }) => apiClient.post(`/bookings/${id}/pay`, data),

  /**
   * Advocate confirms an appointment with session credentials or chamber details
   * @param {string} id - Booking UUID
   * @param {{ sessionInfo?: string, lawyerNotes?: string }} data
   * @returns {Promise<{ booking: object }>}
   */
  confirmBooking: (id, data) => apiClient.patch(`/bookings/${id}/confirm`, data),

  /**
   * Advocate marks a consultation session completed
   * @param {string} id - Booking UUID
   * @param {{ lawyerNotes?: string }} [data]
   * @returns {Promise<{ booking: object }>}
   */
  completeBooking: (id, data = {}) => apiClient.patch(`/bookings/${id}/complete`, data),

  /**
   * Client or Advocate cancels an active consultation with stated reason
   * @param {string} id - Booking UUID
   * @param {{ reason: string }} data
   * @returns {Promise<{ booking: object }>}
   */
  cancelBooking: (id, data) => apiClient.patch(`/bookings/${id}/cancel`, data),

  /**
   * Advocate fetches consultation notes
   * @param {string} id - Booking UUID
   * @returns {Promise<{ note: object }>}
   */
  getNotes: (id) => apiClient.get(`/bookings/${id}/notes`),

  /**
   * Advocate creates or updates consultation notes
   * @param {string} id - Booking UUID
   * @param {{ summary?: string, actionItems?: Array<string>, privateNotes?: string }} data
   * @returns {Promise<{ note: object }>}
   */
  upsertNotes: (id, data) => apiClient.put(`/bookings/${id}/notes`, data),

  /**
   * Client submits verified review for completed consultation
   * @param {string} id - Booking UUID
   * @param {{ rating: number, comment: string }} data
   * @returns {Promise<{ review: object }>}
   */
  submitReview: (id, data) => apiClient.post(`/bookings/${id}/review`, data),

  /**
   * Advocate replies to verified client review
   * @param {string} id - Booking UUID
   * @param {{ reply: string }} data
   * @returns {Promise<{ review: object }>}
   */
  replyReview: (id, data) => apiClient.post(`/bookings/${id}/review/reply`, data),
};

export default bookingApi;
