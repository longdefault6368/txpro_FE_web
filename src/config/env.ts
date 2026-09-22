/**
 * Centralized Environment & App Configuration
 * Single source of truth for all API and Media URLs.
 * Controlled exclusively via environment variables (.env / .env.local).
 * Do NOT hardcode URL strings (e.g. localhost:5000 or production domains) in components.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.txepro.vn"
).replace(/\/+$/, "");

export const API_BASE = `${API_BASE_URL}/api/v1`;

// Optional fallback API base URL if defined in environment
export const API_FALLBACK_URL = process.env.NEXT_PUBLIC_API_FALLBACK
  ? process.env.NEXT_PUBLIC_API_FALLBACK.replace(/\/+$/, "")
  : "";

export const API_FALLBACK = API_FALLBACK_URL ? `${API_FALLBACK_URL}/api/v1` : "";

// MongoDB connection string for server-side routes
export const MONGODB_URI = process.env.MONGODB_URI || "";
