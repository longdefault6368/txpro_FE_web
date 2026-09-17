import { executeFetch, API_BASE } from "./api";

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
};

/**
 * Fetch company information from backend, falling back to defaults if offline or unavailable
 */
export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  try {
    const res = await executeFetch(`${API_BASE}/contacts/company-info`);
    if (res.ok) {
      const data = await res.json();
      return { ...DEFAULT_COMPANY_INFO, ...(data.data || {}) };
    }
  } catch {
    // Return default on error
  }
  return DEFAULT_COMPANY_INFO;
}
