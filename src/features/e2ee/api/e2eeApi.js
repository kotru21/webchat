import apiClient from "@shared/api/client";

/**
 * @param {string} userId
 * @returns {Promise<{ userId: string, publicKeyJwk: JsonWebKey, updatedAt: string }>}
 */
export async function getPeerPublicKey(userId) {
  const res = await apiClient.get(`/api/e2ee/keys/${userId}`);
  return res.data;
}

/**
 * @param {JsonWebKey} publicKeyJwk
 */
export async function putOwnPublicKey(publicKeyJwk) {
  const res = await apiClient.put("/api/e2ee/keys", { publicKeyJwk });
  return res.data;
}

export default { getPeerPublicKey, putOwnPublicKey };
