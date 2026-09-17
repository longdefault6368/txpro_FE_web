"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CompanyInfo, DEFAULT_COMPANY_INFO, fetchCompanyInfo } from "@/utils/companyInfo";

interface CompanyInfoContextType {
  companyInfo: CompanyInfo;
  loading: boolean;
  isLoaded: boolean;
  refreshCompanyInfo: () => Promise<void>;
}

const CompanyInfoContext = createContext<CompanyInfoContextType>({
  companyInfo: DEFAULT_COMPANY_INFO,
  loading: false,
  isLoaded: false,
  refreshCompanyInfo: async () => {},
});

export const CompanyInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshCompanyInfo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompanyInfo();
      setCompanyInfo(data);
    } catch {
      // Keep existing or default
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshCompanyInfo();

    // Listen for cross-tab or in-page update events
    const handleUpdate = () => {
      refreshCompanyInfo();
    };

    window.addEventListener("txpro_company_info_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("txpro_company_info_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refreshCompanyInfo]);

  return (
    <CompanyInfoContext.Provider value={{ companyInfo, loading, isLoaded, refreshCompanyInfo }}>
      {children}
    </CompanyInfoContext.Provider>
  );
};

export const useCompanyInfo = () => useContext(CompanyInfoContext);
