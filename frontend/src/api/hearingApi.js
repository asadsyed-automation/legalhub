import axiosClient from './axiosClient';

export async function getHearings(caseId) {
  const response = await axiosClient.get(`/hearings/case/${caseId}`);
  return response.data;
}

export async function addHearing(data) {
  const response = await axiosClient.post('/hearings', data);
  return response.data;
}