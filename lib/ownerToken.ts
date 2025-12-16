// lib/ownerToken.ts
// SINGLE SOURCE OF TRUTH — Option A Stabilization

export const BASE_URL = 'http://10.0.0.239:3000';

// ✅ VERIFIED WORKING TOKEN
// - userId = 3
// - bank-info POST works
// - cashout POST works (id 57 created)
export const OWNER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NTA0MTQ4LCJleHAiOjE3NjYxMDg5NDh9.DXHTW-nSHY55qXE9VY5lujcYikZd0LrYOWP5kg4mstM';

export const OWNER_USER_ID = '3';

export const ownerAuthHeaders = () => ({
  Authorization: `Bearer ${OWNER_TOKEN}`,
  'Content-Type': 'application/json',
  'x-user-id': OWNER_USER_ID,
});
