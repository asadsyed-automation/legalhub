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