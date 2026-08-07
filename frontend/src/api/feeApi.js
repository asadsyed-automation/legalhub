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

export async function submitPaymentReceiptApi(feeId, { receipt_url, payment_method, transaction_id }) {
  const response = await axiosClient.post(`/fees/${feeId}/submit-receipt`, { receipt_url, payment_method, transaction_id });
  return response.data;
}

export async function verifyPaymentReceiptApi(feeId, { approved, rejection_reason }) {
  const response = await axiosClient.patch(`/fees/${feeId}/verify-receipt`, { approved, rejection_reason });
  return response.data;
}