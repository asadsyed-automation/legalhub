import axiosClient from './axiosClient';

export async function getCases() {
  const response = await axiosClient.get('/cases');
  return response.data;
}

export async function getCaseById(id) {
  const response = await axiosClient.get(`/cases/${id}`);
  return response.data;
}

export async function createCase(data) {
  // data: { case_number, court_name, case_type, client_id? }
  const response = await axiosClient.post('/cases', data);
  return response.data;
}

export async function updateCaseStatus(id, status) {
  const response = await axiosClient.patch(`/cases/${id}/status`, { status });
  return response.data;
}