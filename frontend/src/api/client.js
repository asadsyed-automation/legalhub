import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Automatically attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize API error structure from backend API Contract
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend returned our standardized error envelope { error: "message", details: [...] } or { error: { message } }
    if (error.response && error.response.data && error.response.data.error) {
      const backendError = error.response.data.error;
      const errorMessage =
        typeof backendError === 'string'
          ? backendError
          : backendError.message || 'An unexpected error occurred';
      const normalizedError = new Error(errorMessage);
      normalizedError.code = typeof backendError === 'object' ? backendError.code || 'API_ERROR' : 'API_ERROR';
      normalizedError.status = error.response.status;
      normalizedError.details = error.response.data.details || (backendError.details || null);
      return Promise.reject(normalizedError);
    }

    // Network / timeout error fallback
    const networkError = new Error(
      error.message === 'Network Error' || error.code === 'ERR_NETWORK'
        ? 'Unable to connect to the LegalHub API server. Please verify your internet or backend status.'
        : error.message || 'Network request failed'
    );
    networkError.code = 'NETWORK_ERROR';
    networkError.status = error.response ? error.response.status : 500;
    networkError.details = null;
    return Promise.reject(networkError);
  }
);

export default apiClient;
