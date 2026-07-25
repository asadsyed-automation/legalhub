import axiosClient from './axiosClient';

export async function getNotifications() {
  const response = await axiosClient.get('/notifications');
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await axiosClient.patch(`/notifications/${id}/read`);
  return response.data;
}
