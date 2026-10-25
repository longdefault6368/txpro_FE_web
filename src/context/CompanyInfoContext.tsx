"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { CompanyInfo, DEFAULT_COMPANY_INFO, fetchCompanyInfo, COMPANY_INFO_UPDATED_KEY } from "@/utils/companyInfo";

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
  const inFlight = useRef<Promise<void> | null>(null);
  const refreshPending = useRef(false);

  const refreshCompanyInfo = useCallback(async () => {
    if (inFlight.current) { refreshPending.current = true; return inFlight.current; }
    const task = (async () => {
      setLoading(true);
      try {
        do {
          refreshPending.current = false;
          setCompanyInfo(await fetchCompanyInfo());
        } while (refreshPending.current);
      }
      catch { /* Preserve the last server response; never insert invented contact details. */ }
      finally { setLoading(false); setIsLoaded(true); }
    })();
    inFlight.current = task;
    try { await task; } finally { inFlight.current = null; }
  }, []);

  useEffect(() => {
    refreshCompanyInfo();

    // Listen for cross-tab or in-page update events
    const handleUpdate = () => {
      refreshCompanyInfo();
    };

    window.addEventListener("txpro_company_info_updated", handleUpdate);
    const onStorage = (event: StorageEvent) => { if (event.key === COMPANY_INFO_UPDATED_KEY) handleUpdate(); };
    const onVisible = () => { if (!document.hidden) handleUpdate(); };
    const timer = window.setInterval(() => { if (!document.hidden) handleUpdate(); }, 60000);
    window.addEventListener("storage", onStorage);
    window.addEventListener('focus', handleUpdate);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener("txpro_company_info_updated", handleUpdate);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [refreshCompanyInfo]);

  return (
    <CompanyInfoContext.Provider value={{ companyInfo, loading, isLoaded, refreshCompanyInfo }}>
      {children}
    </CompanyInfoContext.Provider>
  );
};

export const useCompanyInfo = () => useContext(CompanyInfoContext);
