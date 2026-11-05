'use client';
import { createContext, useContext, type ReactNode } from 'react';

const AffiliateAuthContext = createContext(false);
export function AffiliateAuthProvider({ children }: { children: ReactNode }) {
  return <AffiliateAuthContext.Provider value={true}>{children}</AffiliateAuthContext.Provider>;
}
export function useAffiliateAuth() { return useContext(AffiliateAuthContext); }
