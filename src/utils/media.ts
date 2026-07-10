import { API_BASE_URL } from "./api";
const LOCAL_MEDIA_ORIGIN = API_BASE_URL;
const API_MEDIA_ORIGIN = "http://api.txepro.vn";
const SECURE_API_MEDIA_ORIGIN = "https://api.txepro.vn";
const ACTIVE_MEDIA_ORIGIN = LOCAL_MEDIA_ORIGIN;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, "");

export const getServerMediaUrl = (path?: string | null) => {
  if (!path) return null;

  const value = path.trim();
  if (!value) return null;

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  const localOrigin = trimTrailingSlash(ACTIVE_MEDIA_ORIGIN);
  if (value.startsWith(API_BASE_URL)) {
    return value.replace(API_BASE_URL, localOrigin);
  }

  if (value.startsWith(API_BASE_URL)) {
    return value.replace(API_BASE_URL, localOrigin);
  }

  if (value.startsWith(API_MEDIA_ORIGIN)) {
    return value.replace(API_MEDIA_ORIGIN, localOrigin);
  }

  if (value.startsWith(SECURE_API_MEDIA_ORIGIN)) {
    return value.replace(SECURE_API_MEDIA_ORIGIN, localOrigin);
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${localOrigin}/${trimLeadingSlash(value)}`;
};
