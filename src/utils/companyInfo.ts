import { API_BASE } from '@/config/env';

export interface CompanyInfo {
  companyName: string;
  shortName: string;
  hotline: string;
  phoneSupport: string;
  emailGeneral: string;
  emailSupport: string;
  emailPrivacy: string;
  addressHcm: string;
  addressHn: string;
  workingHours: string;
  zaloUrl: string;
  facebookUrl: string;
  websiteUrl: string;
  taxCode: string;
  officePrimaryLabel: string;
  officeSecondaryLabel: string;
  supportResponseTime: string;
  googlePlayUrl: string;
  appStoreUrl: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  companyName: "",
  shortName: "TXEPRO",
  hotline: "",
  phoneSupport: "",
  emailGeneral: "",
  emailSupport: "",
  emailPrivacy: "",
  addressHcm: "",
  addressHn: "",
  workingHours: "",
  zaloUrl: "",
  facebookUrl: "",
  websiteUrl: "",
  taxCode: "",
  officePrimaryLabel: '', officeSecondaryLabel: '', supportResponseTime: '', googlePlayUrl: '', appStoreUrl: '',
};

export const COMPANY_INFO_UPDATED_KEY = 'txpro_company_info_updated_at';
export function normalizeCompanyInfo(value: unknown): CompanyInfo {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result = { ...DEFAULT_COMPANY_INFO };
  for (const key of Object.keys(result) as (keyof CompanyInfo)[]) if (typeof data[key] === 'string') result[key] = (data[key] as string).trim();
  for (const key of ['hotline', 'phoneSupport'] as const) if (result[key] && !/^\+?[\d\s().-]{5,40}$/.test(result[key])) result[key] = '';
  for (const key of ['emailGeneral', 'emailSupport', 'emailPrivacy'] as const) if (result[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result[key])) result[key] = '';
  for (const key of ['zaloUrl', 'facebookUrl', 'websiteUrl', 'googlePlayUrl', 'appStoreUrl'] as const) {
    if (!result[key]) continue;
    try { const url = new URL(result[key]); if (url.protocol !== 'https:' || url.username || url.password) result[key] = ''; } catch { result[key] = ''; }
  }
  return result;
}
export const supportPhone = (info: CompanyInfo) => info.phoneSupport || info.hotline;
export const phoneLink = (phone: string) => /^\+?[\d\s().-]{5,40}$/.test(phone) ? 'tel:' + phone.replace(/[^+\d]/g, '') : '';

/**
 * Fetch authoritative company information from the selected backend.
 */
export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  const res = await fetch(`${API_BASE}/contacts/company-info`, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('Không tải được thông tin doanh nghiệp.');
  const body = await res.json();
  if (!body?.data || typeof body.data !== 'object') throw new Error('Thông tin doanh nghiệp chưa hợp lệ.');
  return normalizeCompanyInfo(body.data);
}
