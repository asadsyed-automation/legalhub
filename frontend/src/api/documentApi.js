import axiosClient from './axiosClient';

export async function getDocuments(caseId) {
  const response = await axiosClient.get(`/documents/case/${caseId}`);
  return response.data;
}

export async function uploadDocument(formData) {
  const response = await axiosClient.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}