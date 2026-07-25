import axiosClient from './axiosClient';

export async function getFees(caseId) {
  const response = await axiosClient.get(`/fees/case/${caseId}`);
  return response.data;
}

export async function addFee(data) {
  const response = await axiosClient.post('/fees', data);
  return response.data;
}

export async function updateFeeStatus(feeId, status) {
  const response = await axiosClient.patch(`/fees/${feeId}/status`, { status });
  return response.data;
}