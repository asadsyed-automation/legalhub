import axiosClient from './axiosClient';

export async function getMessages(caseId) {
  const response = await axiosClient.get(`/messages/case/${caseId}`);
  return response.data;
}

export async function sendMessage(data) {
  // data: { case_id, message_text }
  const response = await axiosClient.post('/messages', data);
  return response.data;
}
