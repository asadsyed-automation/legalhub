import axiosClient from './axiosClient';

export async function getEntries(caseId) {
  const response = await axiosClient.get(`/case-entries/case/${caseId}`);
  return response.data;
}

export async function addEntry(data) {
  const response = await axiosClient.post('/case-entries', data);
  return response.data;
}