import { readPostingPage, type PostingPage, type PostingVehicle } from './posting-contract';

export type DriverKycAccess = { kycStatus?: string; verificationEligibility?: string; hasFullFeatureAccess?: boolean };
export function driverIdentityVerified(access: DriverKycAccess) {
  // Prefer the backend decision. Status fallback supports older API releases.
  return typeof access.hasFullFeatureAccess === 'boolean' ? access.hasFullFeatureAccess
    : access.kycStatus === 'verified' || access.verificationEligibility === 'verified';
}
export function driverVerificationLabel(access: DriverKycAccess) {
  if (driverIdentityVerified(access)) return 'Đã xác minh';
  const status = access.verificationEligibility || access.kycStatus;
  if (['pending_review', 'manual_review', 'pending'].includes(status || '')) return 'Đang chờ xét duyệt';
  if (status === 'rejected') return 'Hồ sơ chưa được duyệt';
  if (status === 'missing_documents') return 'Cần bổ sung giấy tờ';
  return 'Chưa xác minh danh tính';
}
export async function readDriverVehicles<T extends PostingVehicle>(request: <R>(path: string) => Promise<R>) {
  const vehicles: T[] = [];
  for (let page = 1; page <= 100; page++) {
    const data = await request<T[] | PostingPage<T>>('/tai-xe/vehicles?paginated=true&limit=100&page=' + page);
    const result = readPostingPage(data, 100);
    vehicles.push(...result.items);
    if (!result.hasMore) return vehicles;
  }
  throw new Error('Danh sách phương tiện quá lớn. Vui lòng liên hệ hỗ trợ.');
}
