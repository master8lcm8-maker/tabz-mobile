/* lib/ownerToken.ts
   Legacy helper kept for compatibility.
   DO NOT hardcode base URLs or tokens here.
*/
import { getAuthToken, hydrateSession } from "./api";

export const OWNER_USER_ID = "3";

export async function ensureOwnerSessionReady() {
  await hydrateSession();
  const tok = getAuthToken();
  if (!tok) throw new Error("Not authenticated. Please log in first.");
  return tok;
}

export const ownerAuthHeaders = async () => {
  const tok = await ensureOwnerSessionReady();
  return {
    Authorization: `Bearer ${tok}`,
    "Content-Type": "application/json",
    "x-user-id": OWNER_USER_ID,
  };
};
