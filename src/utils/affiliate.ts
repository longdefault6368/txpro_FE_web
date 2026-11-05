import { appStoreUrl } from './app-downloads';

export type AffiliatePolicy = { enabled: boolean; version: string; terms: string; driverReward: number; shipperReward: number;
  milestoneBasis: 'qualified' | 'registered' | 'unconfigured'; milestoneMode: 'each' | 'difference' | 'unconfigured'; minPayout: number; milestones: { count: number; amount: number }[] };
export type AffiliateMemberStats = { registered: number; qualified: number; pending: number; drivers: number; shippers: number; qualifiedDrivers: number; qualifiedShippers: number };
export type Partner = { _id: string; code: string; status: string; balance: number; totalEarned: number; reservedAmount: number; paidAmount: number; suspensionReason?: string;
  userId?: { _id?: string; name?: string; phone?: string; email?: string; role?: string } | null; termsVersion: string; acceptedAt?: string; createdAt?: string; stats?: AffiliateMemberStats; policySnapshot?: AffiliatePolicy };
export type Referral = { id: string; role: string; registeredAt: string; qualifiedAt?: string; rewardAmount: number };
export type Reward = { _id: string; kind: string; amount: number; threshold?: number; createdAt: string };
export type Payout = { _id: string; amount: number; bankName: string; accountNumber: string; accountName: string; status: string; createdAt: string; transferReference: string; note: string; partnerId?: { _id?: string; code?: string } };
export type AffiliateSummary = { partner: Partner | null; policy: AffiliatePolicy; currentPolicy?: AffiliatePolicy; referralLink?: string; portalUrl?: string; stats?: { registered: number; qualified: number } };
export type AffiliatePage<T> = { items: T[]; pagination: { page: number; total: number; hasMore: boolean } };
export const affiliateMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
const STORAGE_KEY = 'txepro_affiliate_referral';
export function validReferralCode(value: unknown) { return typeof value === 'string' && /^[A-Z0-9-]{3,50}$/.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : ''; }
export function saveReferralCode(storage: Storage, code: string, now = Date.now()) {
  const value = validReferralCode(code); if (!value) return;
  const existing = readReferralCode(storage, now);
  if (!existing) storage.setItem(STORAGE_KEY, JSON.stringify({ code: value, expiresAt: now + 30 * 86400000 }));
}
export function readReferralCode(storage: Storage, now = Date.now()) {
  try { const item = JSON.parse(storage.getItem(STORAGE_KEY) || 'null'); if (item?.expiresAt > now) return validReferralCode(item.code); storage.removeItem(STORAGE_KEY); } catch { /* Optional browser storage. */ }
  return '';
}
export function clearReferralCode(storage: Storage) { try { storage.removeItem(STORAGE_KEY); } catch { /* Account registration already succeeded. */ } }
export function googlePlayReferralUrl(raw: string, code: string) {
  if (!validReferralCode(code)) return null;
  try { const safe = appStoreUrl(raw, 'android'); if (!safe) return null; const url = new URL(safe);
    url.searchParams.set('referrer', new URLSearchParams({ referral_code: validReferralCode(code) }).toString()); return url.href; } catch { return null; }
}
export function referralClipboardPayload(code: string, now = Date.now()) {
  const valid = validReferralCode(code);
  return valid ? `TXEPRO_REFERRAL:${valid}:${now}` : '';
}
