import axiosClient from './axiosClient';

/** GET /api/v1/citizen-profiles/me */
export async function getMyCitizenProfile() {
  const response = await axiosClient.get('/citizen-profiles/me');
  return response.data;
}

/** PATCH /api/v1/citizen-profiles/me */
export async function updateMyCitizenProfile(data) {
  const response = await axiosClient.patch('/citizen-profiles/me', data);
  return response.data;
}

/** GET /api/v1/citizen-profiles/:citizenId (For Lawyers viewing Client Fiverr Profile) */
export async function getPublicCitizenProfile(citizenId) {
  const response = await axiosClient.get(`/citizen-profiles/${citizenId}`);
  return response.data;
}
