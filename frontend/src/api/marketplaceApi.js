import axiosClient from './axiosClient';

// ── Marketplace Profiles ─────────────────────────────────────────────────────

/** GET /api/v1/marketplace-profiles  — public, returns only is_verified profiles */
export async function getAllProfiles() {
  const response = await axiosClient.get('/marketplace-profiles');
  return response.data;
}

/** GET /api/v1/marketplace-profiles/:id  — public */
export async function getProfileById(id) {
  const response = await axiosClient.get(`/marketplace-profiles/${id}`);
  return response.data;
}

/** POST /api/v1/marketplace-profiles  — lawyer only
 *  Body: { bio, specialization, fee_structure }
 */
export async function createProfile(data) {
  const response = await axiosClient.post('/marketplace-profiles', data);
  return response.data;
}

/** PATCH /api/v1/marketplace-profiles  — lawyer only (uses JWT to find profile)
 *  Body: any subset of { bio, specialization, fee_structure }
 */
export async function updateProfile(data) {
  const response = await axiosClient.patch('/marketplace-profiles', data);
  return response.data;
}

// ── Gigs ─────────────────────────────────────────────────────────────────────

/** GET /api/v1/gigs/profile/:profileId  — public */
export async function getGigsForProfile(profileId) {
  const response = await axiosClient.get(`/gigs/profile/${profileId}`);
  return response.data;
}

/** POST /api/v1/gigs  — lawyer only
 *  Body: { title, description, price }
 */
export async function createGig(data) {
  const response = await axiosClient.post('/gigs', data);
  return response.data;
}

// ── Reviews ──────────────────────────────────────────────────────────────────

/** GET /api/v1/reviews/gig/:gigId  — public */
export async function getReviewsForGig(gigId) {
  const response = await axiosClient.get(`/reviews/gig/${gigId}`);
  return response.data;
}

/** POST /api/v1/reviews  — citizen only
 *  Body: { gig_id, rating (1-5), comment }
 */
export async function createReview(data) {
  const response = await axiosClient.post('/reviews', data);
  return response.data;
}
