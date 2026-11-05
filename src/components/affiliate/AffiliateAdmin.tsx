'use client';
import { useRef, useState, type FormEvent } from 'react';
import { BarChart3, ChevronRight, CircleDollarSign, Gift, LayoutDashboard, RefreshCw, Search, Settings2, UserCheck, Users, Wallet } from 'lucide-react';
import { postingRequest } from '@/utils/posting-api';
import { affiliateMoney as money, type AffiliatePolicy, type AffiliatePage, type Partner, type Payout } from '@/utils/affiliate';
import { useAffiliateAdminData, type AdminOverview } from './affiliate-admin-data';
import { AdminButton, AdminDialog, AdminError, AdminLoading, AdminMetrics, AdminPager, AdminPartnersTable, AdminPayoutsTable } from './AffiliateAdminUI';
import AffiliateAdminPartner from './AffiliateAdminPartner';
import AffiliateAdminPolicy from './AffiliateAdminPolicy';
import s from './AffiliateAdmin.module.css';

type Section = 'overview' | 'partners' | 'payouts' | 'policy';
const sections = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'partners', label: 'Đối tác', icon: Users },
  { id: 'payouts', label: 'Thanh toán', icon: Wallet },
  { id: 'policy', label: 'Chính sách', icon: Settings2 },
] as const;

export default function AffiliateAdmin() {
  const [section, setSection] = useState<Section>('overview');
  const [revision, setRevision] = useState(0);
  const [partnerPage, setPartnerPage] = useState(1), [payoutPage, setPayoutPage] = useState(1);
  const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [partnerStatus, setPartnerStatus] = useState(''), [payoutStatus, setPayoutStatus] = useState('');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Payout | null>(null), [decision, setDecision] = useState({ status: 'paid', note: '', transferReference: '' });
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null), [reason, setReason] = useState('');
  const [policyDraft, setPolicyDraft] = useState<AffiliatePolicy | null>(null);
  const lock = useRef(false);
  const overview = useAffiliateAdminData<AdminOverview>('/admin/affiliates/overview', revision);
  const account = useAffiliateAdminData<{ user: { role?: string; adminRole?: string } }>('/auth/me', 0);
  const adminRole = account.data?.user.role === 'admin' ? account.data.user.adminRole || 'super_admin' : '';
  const canManage = adminRole === 'super_admin', canPay = ['super_admin', 'accountant'].includes(adminRole);
  const partners = useAffiliateAdminData<AffiliatePage<Partner>>(section === 'partners' && !partnerId
    ? `/admin/affiliates/partners?page=${partnerPage}&q=${encodeURIComponent(search)}&status=${partnerStatus}` : null, revision);
  const recent = useAffiliateAdminData<AffiliatePage<Partner>>(section === 'overview' ? '/admin/affiliates/partners?limit=5' : null, revision);
  const payouts = useAffiliateAdminData<AffiliatePage<Payout>>(section === 'payouts' ? `/admin/affiliates/payouts?page=${payoutPage}&status=${payoutStatus}` : null, revision);
  const rules = useAffiliateAdminData<AffiliatePolicy>(section === 'policy' ? '/admin/affiliates/policy' : null, revision);
  const policy = policyDraft ?? rules.data;
  const stats = overview.data;

  async function action(work: () => Promise<void>, success: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); setRevision(v => v + 1); setNotice(success); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thực hiện được yêu cầu.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function openPartner(id: string) { setSection('partners'); setPartnerId(id); setError(''); setNotice(''); }
  function review(payout: Payout) { setError(''); setSelected(payout); setDecision({ status: 'paid', note: '', transferReference: '' }); }
  function savePolicy(event: FormEvent) {
    event.preventDefault(); if (!policy) return;
    const { enabled, version, terms, driverReward, shipperReward, milestoneBasis, milestoneMode, minPayout, milestones } = policy;
    void action(async () => {
      await postingRequest('/admin/affiliates/policy', { method: 'PUT', body: JSON.stringify({ enabled, version, terms, driverReward, shipperReward, milestoneBasis, milestoneMode, minPayout, milestones: milestones.map(({ count, amount }) => ({ count, amount })) }) });
      setPolicyDraft(null);
    }, 'Đã lưu chính sách mới. Quyền lợi của đối tác đã đăng ký được giữ nguyên theo phiên bản đã đồng ý.');
  }
  return <main className={s.root}>
    <header className={s.header}><div><span className={s.eyebrow}>QUẢN TRỊ<ChevronRight size={13} />TIẾP THỊ LIÊN KẾT</span><h1>Quản lý đối tác</h1><p>Theo dõi thành viên giới thiệu, tiền thưởng và thanh toán trong một nơi.</p></div><div className={s.actions}>
      <AdminButton secondary disabled={busy || overview.loading} onClick={() => setRevision(v => v + 1)}><RefreshCw size={16} />Làm mới</AdminButton>
      <AdminButton disabled={busy || !adminRole} onClick={() => void action(async () => { await postingRequest('/admin/affiliates/reconcile', { method: 'POST' }); }, 'Đã chạy đối soát thưởng. Các lượt còn lại sẽ tiếp tục được xử lý bởi tác vụ nền.')}><BarChart3 size={17} />{busy ? 'Đang xử lý…' : 'Đối soát thưởng'}</AdminButton>
    </div></header>
    <nav className={s.tabs} role='tablist' aria-label='Quản trị đối tác'>{sections.map(({ id, label, icon: Icon }) => <button key={id} role='tab' aria-selected={section === id} aria-controls={`affiliate-admin-${id}`} onClick={() => { setSection(id); setPartnerId(null); }}>
      <Icon size={18} />{label}{id === 'partners' && stats && <span className={s.count}>{stats.partners.total}</span>}{id === 'payouts' && !!stats?.payouts.pending.count && <span className={s.count}>{stats.payouts.pending.count}</span>}
    </button>)}</nav>
    {error && <AdminError message={error} />}{notice && <div className={s.notice} role='status'>{notice}</div>}
    {account.error && <AdminError message={account.error} />}{overview.error && <AdminError message={overview.error} />}
    <div id={`affiliate-admin-${section}`} role='tabpanel' aria-label={sections.find(v => v.id === section)?.label}>
      {section === 'overview' && <>
        {overview.loading && <AdminLoading />}
        {stats && <><AdminMetrics items={[
          { label: 'Tổng đối tác', value: stats.partners.total.toLocaleString('vi-VN'), hint: `${stats.partners.active} hoạt động · ${stats.partners.suspended} tạm ngưng`, icon: Users },
          { label: 'Thành viên giới thiệu', value: stats.members.registered.toLocaleString('vi-VN'), hint: `${stats.members.qualified} người đủ điều kiện nhận thưởng`, icon: UserCheck, tone: 'green' },
          { label: 'Tổng tiền thưởng', value: money(stats.partners.totalEarned), hint: `Đã thanh toán ${money(stats.partners.paidAmount)}`, icon: Gift, tone: 'purple' },
          { label: 'Chờ thanh toán', value: money(stats.payouts.pending.amount), hint: `${stats.payouts.pending.count} yêu cầu cần đối soát`, icon: Wallet, tone: 'amber' },
        ]} /><div className={s.split}><section className={s.panel}><header className={s.panelHeader}><div><h2>Thành viên trong chương trình</h2><p>Phân loại theo vai trò tại thời điểm đăng ký giới thiệu</p></div></header><div className={`${s.panelBody} ${s.balanceRows}`}>
          {[['Tài xế', stats.members.drivers, stats.members.qualifiedDrivers], ['Chủ hàng', stats.members.shippers, stats.members.qualifiedShippers]].map(([label, total, qualified]) => <div key={label}><div className={s.balanceRow}><span>{label}<em>{qualified} đủ điều kiện · {Number(total) - Number(qualified)} đang chờ</em></span><strong>{Number(total).toLocaleString('vi-VN')} thành viên</strong></div><progress className={s.progress} max={Math.max(1, Number(total))} value={Number(qualified)} aria-label={`Tỷ lệ đủ điều kiện ${label}`} /></div>)}
        </div></section><section className={s.panel}><header className={s.panelHeader}><div><h2>Phân bổ tiền thưởng</h2><p>Số dư thực tế trong chương trình đối tác</p></div></header><div className={`${s.panelBody} ${s.balanceRows}`}>
          <div className={s.balanceRow}><span>Khả dụng cho đối tác</span><strong>{money(stats.partners.balance)}</strong></div><div className={s.balanceRow}><span>Đang giữ để thanh toán</span><strong>{money(stats.partners.reservedAmount)}</strong></div><div className={s.balanceRow}><span>Đã thanh toán</span><strong>{money(stats.partners.paidAmount)}</strong></div>
          <AdminButton secondary onClick={() => { setSection('payouts'); setPayoutStatus('pending'); setPayoutPage(1); }}><CircleDollarSign size={17} />Xem yêu cầu chờ đối soát</AdminButton>
        </div></section></div></>}
        <section className={s.panel}><header className={s.panelHeader}><div><h2>Đối tác mới tham gia</h2><p>Bấm vào đối tác để xem thống kê và danh sách thành viên.</p></div><button className={s.textButton} onClick={() => setSection('partners')}>Xem tất cả<ChevronRight size={14} /></button></header>
          {recent.loading && <AdminLoading />}{recent.error && <AdminError message={recent.error} />}{recent.data && <AdminPartnersTable partners={recent.data.items} onSelect={openPartner} />}
        </section>
      </>}
      {section === 'partners' && (partnerId ? <AffiliateAdminPartner key={partnerId} id={partnerId} revision={revision} onBack={() => setPartnerId(null)} onReview={canPay ? review : undefined} /> : <section className={s.panel}>
        <header className={s.panelHeader}><div><h2>Danh sách đối tác</h2><p>Thành viên gồm tất cả lượt giới thiệu đã ghi nhận; mốc thưởng sử dụng số người đủ điều kiện theo chính sách.</p></div></header>
        <form className={s.toolbar} onSubmit={e => { e.preventDefault(); setPartnerPage(1); setSearch(query.trim()); }}><div className={s.search}><Search size={18} /><input aria-label='Tìm đối tác' placeholder='Tìm theo tên, số điện thoại hoặc mã giới thiệu' value={query} maxLength={80} onChange={e => setQuery(e.target.value)} /></div><div className={s.actions}>
          <select aria-label='Trạng thái đối tác' value={partnerStatus} onChange={e => { setPartnerStatus(e.target.value); setPartnerPage(1); }}><option value=''>Tất cả trạng thái</option><option value='active'>Đang hoạt động</option><option value='suspended'>Tạm ngưng</option></select><AdminButton secondary type='submit'><Search size={16} />Tìm kiếm</AdminButton>
        </div></form>
        {partners.loading && <AdminLoading />}{partners.error && <AdminError message={partners.error} />}{partners.data && <><AdminPartnersTable partners={partners.data.items} onSelect={openPartner} busy={busy} onStatus={canManage ? partner => { setError(''); setEditingPartner(partner); setReason(''); } : undefined} /><AdminPager pagination={partners.data.pagination} onPage={setPartnerPage} busy={busy} /></>}
      </section>)}
      {section === 'payouts' && <section className={s.panel}><header className={s.panelHeader}><div><h2>Yêu cầu thanh toán</h2><p>Chỉ ghi nhận đã thanh toán sau khi chuyển tiền thực tế. Hệ thống không tự chuyển khoản.</p></div><Wallet size={21} /></header><div className={s.toolbar}><span className={s.muted}>Theo dõi từng yêu cầu và thông tin đối soát.</span><select aria-label='Trạng thái thanh toán' value={payoutStatus} onChange={e => { setPayoutStatus(e.target.value); setPayoutPage(1); }}><option value=''>Tất cả yêu cầu</option><option value='pending'>Chờ đối soát</option><option value='paid'>Đã thanh toán</option><option value='rejected'>Đã từ chối</option></select></div>
        {payouts.loading && <AdminLoading />}{payouts.error && <AdminError message={payouts.error} />}{payouts.data && <><AdminPayoutsTable payouts={payouts.data.items} onReview={canPay ? review : undefined} /><AdminPager pagination={payouts.data.pagination} onPage={setPayoutPage} busy={busy} /></>}
      </section>}
      {section === 'policy' && <>{rules.loading && !policy && <AdminLoading />}{rules.error && <AdminError message={rules.error} />}{policy && <AffiliateAdminPolicy policy={policy} changed={!!policyDraft} busy={busy} canManage={canManage} onChange={setPolicyDraft} onReset={() => setPolicyDraft(null)} onSave={savePolicy} />}</>}
    </div>
    {editingPartner && <AdminDialog title={`${editingPartner.status === 'active' ? 'Tạm ngưng' : 'Khôi phục'} đối tác`} onClose={() => setEditingPartner(null)} busy={busy}>{error && <AdminError message={error} />}<p>{editingPartner.userId?.name || editingPartner.code} · {editingPartner.code}</p><form onSubmit={e => { e.preventDefault(); void action(async () => { await postingRequest('/admin/affiliates/partners/' + editingPartner._id, { method: 'PATCH', body: JSON.stringify({ status: editingPartner.status === 'active' ? 'suspended' : 'active', reason }) }); setEditingPartner(null); }, 'Đã cập nhật trạng thái đối tác.'); }}><div className={s.fields}><label className={s.wide}>Lý do<input autoFocus required minLength={3} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /></label></div><div className={s.actions}><AdminButton type='submit' disabled={busy}>Xác nhận</AdminButton><AdminButton secondary disabled={busy} onClick={() => setEditingPartner(null)}>Đóng</AdminButton></div></form></AdminDialog>}
    {selected && <AdminDialog title={`Đối soát ${money(selected.amount)}`} onClose={() => setSelected(null)} busy={busy}>{error && <AdminError message={error} />}<p>Chỉ xác nhận “Đã chuyển khoản” sau khi đã chuyển tiền thực tế. Mã giao dịch và người duyệt sẽ được lưu để đối soát.</p><form onSubmit={e => { e.preventDefault(); void action(async () => { await postingRequest('/admin/affiliates/payouts/' + selected._id + '/review', { method: 'POST', body: JSON.stringify(decision) }); setSelected(null); }, 'Đã lưu kết quả đối soát thanh toán.'); }}><fieldset disabled={busy}><div className={s.fields}><label>Kết quả<select value={decision.status} onChange={e => setDecision(v => ({ ...v, status: e.target.value }))}><option value='paid'>Đã chuyển khoản</option><option value='rejected'>Từ chối và hoàn số dư</option></select></label><label>Mã giao dịch<input required={decision.status === 'paid'} maxLength={160} value={decision.transferReference} onChange={e => setDecision(v => ({ ...v, transferReference: e.target.value }))} /></label><label className={s.wide}>Ghi chú / lý do<input required minLength={3} maxLength={1000} value={decision.note} onChange={e => setDecision(v => ({ ...v, note: e.target.value }))} /></label></div><div className={s.actions}><AdminButton type='submit'>Lưu kết quả</AdminButton><AdminButton secondary onClick={() => setSelected(null)}>Đóng</AdminButton></div></fieldset></form></AdminDialog>}
  </main>;
}
