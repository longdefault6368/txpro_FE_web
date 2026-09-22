import { API_BASE_URL } from "@/config/env";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, "");

export const getActiveMediaOrigin = () => {
  return API_BASE_URL;
};

/**
 * Normalizes an image path for saving into the database.
 * Converts local or remote absolute upload URLs into relative paths (e.g. /uploads/...)
 * so that both Web and Mobile app resolve them via their active environment.
 */
export const normalizePersistedImagePath = (path?: string | null): string => {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.pathname.startsWith("/uploads/")) {
      return url.pathname;
    }
  } catch {
    if (trimmed.startsWith("/uploads/")) {
      return trimmed;
    }
    if (trimmed.startsWith("uploads/")) {
      return `/${trimmed}`;
    }
  }

  return trimmed;
};

export const getServerMediaUrl = (path?: string | null) => {
  if (!path) return null;

  const value = path.trim();
  if (!value) return null;

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  // If already a full URL (external CDN, Cloudinary, S3, etc.)
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const activeOrigin = trimTrailingSlash(getActiveMediaOrigin());
  return `${activeOrigin}/${trimLeadingSlash(value)}`;
};
