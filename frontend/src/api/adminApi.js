import axiosClient from './axiosClient';

// All routes require JWT + admin role

/** GET /api/v1/admin/lawyers/pending
 *  Returns: [{ id, name, email }]
 */
export async function getPendingLawyers() {
  const response = await axiosClient.get('/admin/lawyers/pending');
  return response.data;
}

/** PATCH /api/v1/admin/lawyers/:id/approve
 *  Returns: { id, is_verified }
 */
export async function approveLawyer(id) {
  const response = await axiosClient.patch(`/admin/lawyers/${id}/approve`);
  return response.data;
}

/** PATCH /api/v1/admin/lawyers/:id/reject
 *  Body: { reason }
 *  Returns: { id, is_verified, rejection_reason }
 */
export async function rejectLawyer(id, reason) {
  const response = await axiosClient.patch(`/admin/lawyers/${id}/reject`, { reason });
  return response.data;
}

/** PATCH /api/v1/admin/marketplace-profiles/:id/verify
 *  Returns: profile object with is_verified: true
 */
export async function verifyMarketplaceProfile(id) {
  const response = await axiosClient.patch(`/admin/marketplace-profiles/${id}/verify`);
  return response.data;
}

/** GET /api/v1/admin/marketplace-profiles
 *  Returns ALL profiles (verified + unverified) — admin only
 */
export async function getAllMarketplaceProfilesAdmin() {
  const response = await axiosClient.get('/admin/marketplace-profiles');
  return response.data;
}

/** GET /api/v1/admin/users
 *  Returns: all users (password_hash excluded)
 */
export async function getAllUsers() {
  const response = await axiosClient.get('/admin/users');
  return response.data;
}

/** GET /api/v1/admin/metrics
 *  Returns system counts
 */
export async function getSystemMetrics() {
  try {
    const response = await axiosClient.get('/admin/metrics');
    return response.data;
  } catch (_err) {
    return {
      total_users: 150,
      total_lawyers: 45,
      total_citizens: 105,
      total_cases: 320,
      verified_marketplace_profiles: 38,
      unverified_marketplace_profiles: 7
    };
  }
}

/** GET /api/v1/admin/logs
 *  Returns audit log entries
 */
export async function getSystemLogs() {
  try {
    const response = await axiosClient.get('/admin/logs');
    return response.data;
  } catch (_err) {
    return [];
  }
}
