import { API_BASE_URL } from "./api";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, "");

export const getActiveMediaOrigin = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }
  return API_BASE_URL || "https://api.txepro.vn";
};

/**
 * Normalizes an image path for saving into the database.
 * Converts local or remote absolute upload URLs (e.g. http://localhost:5000/uploads/... or https://api.txepro.vn/uploads/...)
 * into relative paths (e.g. /uploads/...) so that both Web and Mobile app resolve them to their active environment.
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

  const activeOrigin = trimTrailingSlash(getActiveMediaOrigin());

  // If already a full URL
  if (/^https?:\/\//i.test(value)) {
    // If running on localhost and URL points to api.txepro.vn/uploads/, redirect to local backend
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        if (value.includes("api.txepro.vn/uploads/")) {
          return value.replace(/https?:\/\/api\.txepro\.vn/, "http://localhost:5000");
        }
      }
    }
    return value;
  }

  return `${activeOrigin}/${trimLeadingSlash(value)}`;
};
