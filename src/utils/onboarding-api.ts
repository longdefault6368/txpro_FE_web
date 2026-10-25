import { API_BASE, API_BASE_URL } from '@/config/env';
import { postingRequest } from './posting-api';
export { postingRequest as onboardingRequest } from './posting-api';

// Private documents must stay on the chosen backend; never attach credentials
// to a URL supplied by another host or use the legacy API fallback.
export async function privateDocumentBlob(path: string): Promise<Blob> {
  const url = new URL(path, API_BASE_URL + '/');
  const base = new URL(API_BASE);
  if (url.origin !== base.origin || !/^\/api\/v1\/kyc\/submissions\/[a-f0-9]{24}\/documents\/(cccdFront|cccdBack|portrait)\/preview$/.test(url.pathname) || url.search || url.hash) throw new Error('Đường dẫn giấy tờ không hợp lệ.');
  // A read through the shared client refreshes expired credentials on the same backend.
  await postingRequest('/auth/me');
  const token = localStorage.getItem('txpro_token');
  if (!token) throw new Error('Vui lòng đăng nhập.');
  const response = await fetch(url.href, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Không tải được ảnh giấy tờ.');
  return response.blob();
}
