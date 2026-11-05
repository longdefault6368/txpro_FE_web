import AffiliateInvite from '@/components/affiliate/AffiliateInvite';
export const metadata = { title: 'Lời mời tham gia TXE PRO', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <AffiliateInvite code={code} />; }
