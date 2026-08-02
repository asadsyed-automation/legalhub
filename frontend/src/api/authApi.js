import axiosClient from './axiosClient';

export async function loginRequest({ email, password }) {
  const response = await axiosClient.post('/auth/login', { email, password });
  return response.data;
}

export async function registerRequest({ name, email, password, role }) {
  const response = await axiosClient.post('/auth/register', { name, email, password, role });
  return response.data;
}

export async function googleLoginRequest(idToken) {
  const response = await axiosClient.post('/auth/google', { idToken });
  return response.data;
}

export async function setRoleRequest(role, tempToken) {
  const config = tempToken ? { headers: { Authorization: `Bearer ${tempToken}` } } : {};
  const response = await axiosClient.patch('/auth/set-role', { role }, config);
  return response.data;
}

export async function requestForgotPasswordApi({ email }) {
  const response = await axiosClient.post('/auth/forgot-password', { email });
  return response.data;
}

export async function verifyOtpApi({ email, code }) {
  const response = await axiosClient.post('/auth/verify-otp', { email, code });
  return response.data;
}

export async function resetPasswordApi({ email, resetToken, newPassword }) {
  const response = await axiosClient.post('/auth/reset-password', { email, resetToken, newPassword });
  return response.data;
}

export async function changePasswordApi({ currentPassword, newPassword }) {
  const response = await axiosClient.patch('/auth/change-password', { currentPassword, newPassword });
  return response.data;
}