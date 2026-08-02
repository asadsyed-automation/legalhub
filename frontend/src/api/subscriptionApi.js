import axiosClient from './axiosClient';

/** GET /api/v1/subscriptions/me */
export async function getMySubscription() {
  const response = await axiosClient.get('/subscriptions/me');
  return response.data;
}
