import axiosClient from './axiosClient';

/** POST /api/v1/firms  — lawyer only
 *  Body: { name }
 *  Returns: firm object { id, name, owner_id, ... }
 */
export async function createFirm(name) {
  const response = await axiosClient.post('/firms', { name });
  return response.data;
}

/** GET /api/v1/firms/:id  — authenticated */
export async function getFirmById(id) {
  const response = await axiosClient.get(`/firms/${id}`);
  return response.data;
}

/** POST /api/v1/firms/:id/members  — lawyer only (firm owner)
 *  Body: { email }  — email of the lawyer to add
 *  Returns: { id, name, email }
 */
export async function addFirmMember(firmId, email) {
  const response = await axiosClient.post(`/firms/${firmId}/members`, { email });
  return response.data;
}

/** GET /api/v1/firms/:id/members  — authenticated
 *  Returns: [{ id, name, email, role }]
 */
export async function getFirmMembers(firmId) {
  const response = await axiosClient.get(`/firms/${firmId}/members`);
  return response.data;
}
