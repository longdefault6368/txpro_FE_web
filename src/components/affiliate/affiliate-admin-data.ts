'use client';
import { useEffect, useState } from 'react';
import { postingRequest } from '@/utils/posting-api';
import type { AffiliateMemberStats, Partner, Reward } from '@/utils/affiliate';

export type AdminOverview = {
  partners: { total: number; active: number; suspended: number; totalEarned: number; balance: number; reservedAmount: number; paidAmount: number };
  members: AffiliateMemberStats;
  payouts: Record<'pending' | 'paid' | 'rejected', { count: number; amount: number }>;
  updatedAt: string;
};
export type AdminPartnerDetail = {
  partner: Partner;
  stats: AffiliateMemberStats;
  rewards: { kind: string; count: number; amount: number }[];
  monthlyRegistrations: { month: string; count: number }[];
  milestoneRewards: Pick<Reward, '_id' | 'threshold' | 'amount' | 'createdAt'>[];
  payouts: { status: string; count: number; amount: number }[];
};
export type AdminMember = { _id: string; userId?: { name?: string; phone?: string } | null; role: string; registeredAt: string; qualifiedAt?: string; rewardAmount: number };

export function useAffiliateAdminData<T>(url: string | null, revision: number) {
  const key = `${url}:${revision}`;
  const [result, setResult] = useState<{ key: string; data: T | null; error: string }>({ key: '', data: null, error: '' });
  useEffect(() => {
    if (!url) return;
    let current = true;
    void postingRequest<T>(url).then(data => {
      if (current) setResult({ key, data, error: '' });
    }).catch(error => {
      if (current) setResult({ key, data: null, error: error instanceof Error ? error.message : 'Không tải được dữ liệu. Vui lòng thử lại.' });
    });
    return () => { current = false; };
  }, [url, key]);
  return result.key === key ? { ...result, loading: false } : { data: null, error: '', loading: !!url };
}

export function affiliateDate(value?: string, withTime = false) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } as const : {}) }).format(new Date(value));
}
