'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Copy, FileText, Gift, Handshake, LayoutDashboard, Link2, RefreshCw, ShieldCheck, Users, Wallet } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { postingRequest } from '@/utils/posting-api';
import { commitRegistrationSession } from '@/utils/web-registration';
import { affiliateMoney as money, type AffiliateSummary, type AffiliatePage, type Payout, type Referral, type Reward } from '@/utils/affiliate';
import s from './Affiliate.module.css';

export default function AffiliatePortal() {
  const [data, setData] = useState<AffiliateSummary | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [accepted, setAccepted] = useState(false);
  const [referrals, setReferrals] = useState<AffiliatePage<Referral> | null>(null), [rewards, setRewards] = useState<Reward[]>([]), [payouts, setPayouts] = useState<Payout[]>([]), [page, setPage] = useState(1);
  const [bank, setBank] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' });
  const lock = useRef(false), ticketExchange = useRef<Promise<void> | null>(null), loadRevision = useRef(0), payoutAttempt = useRef<{ signature: string; key: string } | null>(null);
  const displayedSession = useRef<string | null>(null), policyVersion = useRef('');
  const [activeSection, setActiveSection] = useState('overview');
  const [userName, setUserName] = useState('');
  const load = useCallback(async () => {
    const revision = ++loadRevision.current;
    const expected = localStorage.getItem('txpro_user_session');
    const same = () => { if (localStorage.getItem('txpro_user_session') !== expected) throw new Error('Tài khoản đã thay đổi. Vui lòng tải lại trang.'); };
    const summary = await postingRequest<AffiliateSummary>('/affiliate/me'); same(); if (revision !== loadRevision.current) return;
    displayedSession.current = expected;
    if (policyVersion.current !== summary.policy.version) { policyVersion.current = summary.policy.version; setAccepted(false); }
    setData(summary);
    try { setUserName(summary.partner?.userId?.name || (expected ? JSON.parse(expected).name : '') || 'Tài khoản đối tác'); } catch { setUserName('Tài khoản đối tác'); }
    if (summary.partner) {
      if (activeSection === 'referrals') {
        const refs = await postingRequest<AffiliatePage<Referral>>('/affiliate/referrals?page=' + page);
        same(); if (revision !== loadRevision.current) return; setReferrals(refs);
      } else if (activeSection === 'rewards') {
        const credits = await postingRequest<AffiliatePage<Reward>>('/affiliate/rewards?limit=100');
        same(); if (revision !== loadRevision.current) return; setRewards(credits.items);
      } else if (activeSection === 'history') {
        const withdrawals = await postingRequest<AffiliatePage<Payout>>('/affiliate/payouts?limit=100');
        same(); if (revision !== loadRevision.current) return; setPayouts(withdrawals.items);
      }
    }
  }, [page, activeSection]);
  useEffect(() => {
    const onSessionChanged = () => {
      if (displayedSession.current !== null && displayedSession.current !== localStorage.getItem('txpro_user_session')) {
        loadRevision.current++; displayedSession.current = null;
        setData(null); setUserName(''); setReferrals(null); setRewards([]); setPayouts([]); setAccepted(false);
        setBank({ amount: '', bankName: '', accountNumber: '', accountName: '' }); payoutAttempt.current = null;
        setError('Tài khoản đã thay đổi. Vui lòng tải lại trang đối tác.');
      }
    };
    window.addEventListener('storage', onSessionChanged);
    window.addEventListener('txpro_session_updated', onSessionChanged);
    return () => { window.removeEventListener('storage', onSessionChanged); window.removeEventListener('txpro_session_updated', onSessionChanged); };
  }, []);
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const ticket = fragment.get('ticket');
        if (ticket && !ticketExchange.current) {
          window.history.replaceState(null, '', window.location.pathname);
          const expected = localStorage.getItem('txpro_user_session');
          ticketExchange.current = (async () => {
            const result = await postingRequest<Parameters<typeof commitRegistrationSession>[1]>('/public/affiliate/web-session', { method: 'POST', body: JSON.stringify({ ticket }) }, false);
            const previous = expected ? JSON.parse(expected) as { id?: string } : null;
            if (previous?.id && previous.id !== (result.user?.id || result.user?._id)) throw new Error('Website đang dùng tài khoản khác với app. Hãy đăng xuất rồi mở lại trang đối tác từ app.');
            commitRegistrationSession(localStorage, result, expected);
            if (!localStorage.getItem('txpro_device_id')) localStorage.setItem('txpro_device_id', crypto.randomUUID());
            window.dispatchEvent(new Event('txpro_session_updated'));
          })();
        }
        if (ticketExchange.current) await ticketExchange.current;
        if (active) await load();
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Không tải được trang đối tác.'); }
      finally { if (active) setLoading(false); }
    };
    void init();
    const revisionState = loadRevision;
    return () => { active = false; revisionState.current++; };
  }, [load]);
  function navigate(section: string) {
    if (section === activeSection) return;
    setReferrals(null); setRewards([]); setPayouts([]);
    setLoading(true); setError(''); setNotice(''); setPage(1); setActiveSection(section);
  }
  function changePage(next: number) {
    setReferrals(null);
    setLoading(true); setError(''); setPage(next);
  }
  async function action(work: () => Promise<void>) {
    if (displayedSession.current !== localStorage.getItem('txpro_user_session')) { setError('Tài khoản đã thay đổi. Vui lòng tải lại trang đối tác.'); return; }
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Chưa thực hiện được yêu cầu.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setNotice('Đã sao chép.'); } catch { setNotice('Bạn có thể chọn và sao chép thông tin hiển thị bên dưới.'); } }
  async function payout(event: FormEvent) {
    event.preventDefault();
    const payload = { ...bank, amount: Number(bank.amount) }, signature = JSON.stringify(payload);
    if (payoutAttempt.current?.signature !== signature) payoutAttempt.current = { signature, key: crypto.randomUUID() };
    const requestKey = payoutAttempt.current.key;
    await action(async () => { await postingRequest('/affiliate/payouts', { method: 'POST', body: JSON.stringify({ ...payload, requestKey }) }); setNotice('Đã gửi yêu cầu. Tiền đang chờ quản trị viên đối soát.'); setBank(v => ({ ...v, amount: '' })); payoutAttempt.current = null; });
  }
  const partner = data?.partner, policy = data?.policy;
  const count = policy?.milestoneBasis === 'registered' ? data?.stats?.registered || 0 : data?.stats?.qualified || 0;
  const tiers = [...(policy?.milestones || [])].sort((a, b) => a.count - b.count);
  const nextIndex = tiers.findIndex(tier => count < tier.count);
  const previousCount = nextIndex > 0 ? tiers[nextIndex - 1].count : 0;
  const progress = !tiers.length ? 0 : nextIndex < 0 ? 100 :
    ((nextIndex + (count - previousCount) / (tiers[nextIndex].count - previousCount)) / tiers.length) * 100;
  const menu = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    ...(partner ? [
      { id: 'sharing', label: 'Link giới thiệu', icon: Link2 },
      { id: 'referrals', label: 'Người được giới thiệu', icon: Users },
      { id: 'rewards', label: 'Tiền thưởng & cấp độ', icon: Gift },
      { id: 'payment', label: 'Yêu cầu thanh toán', icon: Wallet },
      { id: 'history', label: 'Lịch sử thanh toán', icon: FileText },
    ] : []),
    ...(policy ? [{ id: 'policy', label: 'Chính sách đối tác', icon: ShieldCheck }] : []),
  ];
  return <><Header /><main className={`${s.page} ${s.workspace}`}>
    <div className={s.workspaceHeading}><div><span className={s.eyebrow}>TXE PRO AFFILIATE</span><h1>Trung tâm đối tác</h1><p>Kết nối, theo dõi và quản lý quyền lợi của bạn.</p></div><span className={s.workspaceLabel}><ShieldCheck size={16} />Khu vực đối tác</span></div>
    <div className={s.workspaceLayout}>
      <aside className={s.sidebar} aria-label='Menu quản lý đối tác'>
        <div className={s.sidebarIdentity}><span className={s.partnerMark}><Handshake size={26} /></span><div><strong className={s.identityName}>{userName || "Tài khoản đối tác"}{partner && <CheckCircle2 size={17} aria-label="Đã xác nhận đối tác" />}</strong><small>{partner ? 'Mã: ' + partner.code : 'Cùng xây dựng kết nối'}</small></div></div>
        <span className={s.navCaption}>QUẢN LÝ ĐỐI TÁC</span>
        <nav className={s.workspaceNav} aria-label='Điều hướng đối tác'>{menu.map(({ id, label, icon: Icon }) => <button type='button' key={id} aria-current={activeSection === id ? 'page' : undefined} onClick={() => { navigate(id); }}><Icon size={19} strokeWidth={1.8} /><span>{label}</span><ChevronRight size={14} /></button>)}</nav>
        {!loading && !data && <div className={s.sidebarAuth}><p>Bắt đầu hành trình đối tác của bạn.</p><Link href='/doi-tac/dang-nhap'>Đăng nhập đối tác<ChevronRight size={15} /></Link><Link href='/doi-tac/dang-ky'>Đăng ký đối tác<ChevronRight size={15} /></Link></div>}
        <div className={s.sidebarHelp}><ShieldCheck size={19} /><p>Quyền lợi theo chính sách đã đồng ý. Mỗi lượt đủ điều kiện được ghi nhận một lần.</p></div>
      </aside>
      <div className={s.workspaceContent}>
    {activeSection === 'overview' && <header className={`${s.hero} ${s.portalHero}`} id='affiliate-overview'><div><span className={s.eyebrow}>MỖI KẾT NỐI, THÊM GIÁ TRỊ</span><h2>Đồng hành cùng TXE PRO</h2><p>Chia sẻ lời mời, theo dõi kết quả và chủ động quản lý tiền thưởng.</p>{partner && <button type='button' className={s.heroAction} onClick={() => navigate('sharing')}>Chia sẻ link giới thiệu<ChevronRight size={17} /></button>}</div><span className={s.heroSymbol}><Handshake size={64} strokeWidth={1.1} /></span></header>}
    {error && <div className={s.error} role='alert'>{error}</div>}{notice && <div className={s.notice} role='status'>{notice}</div>}
    {loading ? <p role='status'>Đang tải thông tin đối tác…</p> : !data ? <section className={s.panel}><h2>Tham gia TXE PRO Affiliate</h2><p>Đăng nhập khu vực đối tác hoặc tạo tài khoản để bắt đầu.</p><div className={s.buttons}><Link className={s.primary} href='/doi-tac/dang-nhap'>Đăng nhập đối tác</Link><Link className={s.secondary} href='/doi-tac/dang-ky'>Đăng ký đối tác</Link></div></section> : !partner ? <section className={s.panel} id="affiliate-policy">
      <h2>Trở thành đối tác TXE PRO</h2><p>Giới thiệu tài xế đủ điều kiện: <strong>{money(policy!.driverReward)}</strong>. Giới thiệu chủ hàng hoàn thành đơn có doanh thu: <strong>{money(policy!.shipperReward)}</strong>.</p>
      <div className={s.terms} tabIndex={0}>{policy!.terms}</div><label className={s.check}><input type='checkbox' checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy} /><span>Tôi đã đọc và đồng ý chính sách phiên bản {policy!.version}.</span></label>
      <button className={s.primary} disabled={!accepted || busy || !policy!.enabled} onClick={() => void action(async () => { await postingRequest('/affiliate/enroll', { method: 'POST', body: JSON.stringify({ accepted: true, version: policy!.version }) }); })}>Đồng ý và trở thành đối tác</button>
    </section> : <>
      {partner.status !== 'active' && <div className={s.notice}>Đối tác đang tạm ngưng. {partner.suspensionReason}</div>}
      <div className={s.buttons}><button className={s.secondary} disabled={busy} onClick={() => void action(async () => { await postingRequest('/affiliate/refresh', { method: 'POST' }); })}><RefreshCw size={16} />Cập nhật kết quả</button></div>
      {activeSection === 'overview' && <div className={s.grid}>{[['Tổng tiền thưởng', partner.totalEarned], ['Có thể yêu cầu thanh toán', partner.balance], ['Đang chờ thanh toán', partner.reservedAmount], ['Đã thanh toán', partner.paidAmount]].map(([title, value]) => <div className={s.stat} key={title}><span><Wallet size={16} /> {title}</span><strong>{money(Number(value))}</strong></div>)}</div>}
      {activeSection === 'sharing' && <section className={s.panel} id="affiliate-sharing"><h2>Chia sẻ và giới thiệu</h2><p>Mã giới thiệu của bạn</p><div className={s.code}>{partner.code}</div><p>Link giới thiệu tải ứng dụng</p><div className={s.code}>{data.referralLink}</div><div className={s.buttons}><button className={s.secondary} onClick={() => void copy(partner.code)}><Copy size={16} />Sao chép mã</button><button className={s.primary} disabled={!data.referralLink} onClick={() => void copy(data.referralLink!)}><Copy size={16} />Sao chép link</button></div></section>}
      {activeSection === 'overview' && <section className={s.panel}><h2><Users size={20} /> Kết quả giới thiệu</h2><p>Đã đăng ký: <strong>{data.stats?.registered || 0}</strong></p><p>Đã đủ điều kiện nhận thưởng: <strong>{data.stats?.qualified || 0}</strong></p><p>Mỗi tài khoản được ghi nhận một lần theo vai trò đăng ký ban đầu. Đổi vai trò không tạo thêm lượt thưởng.</p></section>}
      {(activeSection === 'rewards' || activeSection === 'overview') && <section className={s.panel} id="affiliate-rewards"><h2>Cấp độ thành viên</h2><p>Tính theo {policy!.milestoneBasis === 'registered' ? 'người đã đăng ký' : 'người đã đủ điều kiện nhận thưởng'}. {policy!.milestoneMode === 'each' ? 'Mỗi mốc nhận thêm khoản thưởng riêng.' : policy!.milestoneMode === 'difference' ? 'Mỗi mốc nhận phần chênh lệch để đạt tổng thưởng công bố.' : 'Quy tắc mốc đang chờ cấu hình.'}</p><p className={s.progressCount}><strong>{count.toLocaleString('vi-VN')}</strong> lượt đã đạt{nextIndex >= 0 && <> · Còn {Math.max(0, tiers[nextIndex].count - count).toLocaleString('vi-VN')} lượt đến mốc tiếp theo</>}</p>
        {tiers.length > 0 && <div className={s.milestoneScroll}><div className={s.milestoneChart} style={{ minWidth: Math.max(420, tiers.length * 125) }}>
          <div className={s.milestoneTrack} role='progressbar' aria-label='Tiến độ cấp độ thành viên' aria-valuemin={0} aria-valuemax={tiers[tiers.length - 1].count} aria-valuenow={Math.min(count, tiers[tiers.length - 1].count)} aria-valuetext={count + ' lượt đã đạt'}><span style={{ width: progress + '%' }} /></div>
          <div className={s.milestoneStart}>0</div>
          {tiers.map((tier, index) => <div className={s.milestone} key={tier.count} data-achieved={count >= tier.count} style={{ left: ((index + 1) / tiers.length) * 100 + '%' }}><span className={s.milestoneDot}>{count >= tier.count && <CheckCircle2 size={15} />}</span><strong>{tier.count.toLocaleString('vi-VN')} người</strong><small>{money(tier.amount)}</small></div>)}
        </div></div>}</section>}
      {activeSection === 'referrals' && <section className={s.panel} id="affiliate-referrals"><h2>Danh sách giới thiệu</h2><p>Chỉ hiển thị thông tin đối soát cần thiết của người được giới thiệu.</p>{!!referrals?.items.length && <><div className={s.table}><table><thead><tr><th>Mã ghi nhận</th><th>Vai trò</th><th>Đăng ký</th><th>Điều kiện</th><th>Thưởng</th></tr></thead><tbody>{referrals?.items.map(item => <tr key={item.id}><td>{item.id.slice(-8).toUpperCase()}</td><td>{item.role === 'tai-xe' ? 'Tài xế' : 'Chủ hàng'}</td><td>{new Date(item.registeredAt).toLocaleDateString('vi-VN')}</td><td>{item.qualifiedAt ? 'Đã đủ điều kiện' : 'Đang chờ đủ điều kiện'}</td><td>{item.qualifiedAt ? money(item.rewardAmount) : 'Chưa ghi thưởng'}</td></tr>)}</tbody></table></div><div className={s.buttons} aria-label="Phân trang giới thiệu"><button className={s.secondary} disabled={page === 1 || busy} onClick={() => changePage(page - 1)}>Trước</button><span>Trang {page}</span><button className={s.secondary} disabled={!referrals?.pagination.hasMore || busy} onClick={() => changePage(page + 1)}>Sau</button></div></>}{!referrals?.items.length && <p>Chưa có người đăng ký qua mã của bạn.</p>}</section>}
      {activeSection === 'payment' && <section className={s.panel} id="affiliate-payment"><h2>Yêu cầu thanh toán</h2><p>Tối thiểu {money(data.currentPolicy?.minPayout || policy!.minPayout)}. Điền đúng tài khoản ngân hàng để admin đối soát và chuyển khoản.</p><form onSubmit={payout}><fieldset disabled={busy || partner.status !== 'active'}><div className={s.fields}>{[['amount', 'Số tiền'], ['bankName', 'Ngân hàng'], ['accountNumber', 'Số tài khoản'], ['accountName', 'Tên chủ tài khoản']].map(([key, title]) => <label key={key}>{title}<input required type={key === 'amount' ? 'number' : 'text'} min={key === 'amount' ? data.currentPolicy?.minPayout || policy!.minPayout : undefined} max={key === 'amount' ? partner.balance : undefined} value={bank[key as keyof typeof bank]} onChange={e => setBank(v => ({ ...v, [key]: e.target.value }))} /></label>)}</div><button className={s.primary} disabled={busy || partner.balance < (data.currentPolicy?.minPayout || policy!.minPayout)}>Gửi yêu cầu thanh toán</button></fieldset></form></section>}
      {activeSection === 'rewards' && <section className={s.panel}><h2>Ghi nhận thưởng gần đây</h2>{rewards.length ? rewards.map(reward => <p key={reward._id}>{reward.kind === 'milestone' ? 'Mốc ' + reward.threshold + ' người' : reward.kind === 'driver' ? 'Giới thiệu tài xế' : 'Giới thiệu chủ hàng'} <strong>+{money(reward.amount)}</strong></p>) : <p>Chưa phát sinh tiền thưởng.</p>}</section>}
      {activeSection === 'history' && <section className={s.panel} id="affiliate-history"><h2>Lịch sử thanh toán</h2><div className={s.table}><table><thead><tr><th>Ngày yêu cầu</th><th>Số tiền</th><th>Tài khoản nhận</th><th>Trạng thái</th><th>Đối soát</th></tr></thead><tbody>{payouts.map(item => <tr key={item._id}><td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td><td>{money(item.amount)}</td><td>{item.bankName} · {item.accountNumber}</td><td>{item.status === 'paid' ? 'Đã chuyển khoản' : item.status === 'rejected' ? 'Đã từ chối, hoàn số dư' : 'Chờ đối soát'}</td><td>{item.transferReference || item.note || '—'}</td></tr>)}</tbody></table></div>{!payouts.length && <p>Chưa có yêu cầu thanh toán.</p>}</section>}
      {activeSection === 'policy' && <section className={s.panel} id="affiliate-policy"><h2>Chính sách đã chấp nhận · {partner.termsVersion}</h2><div className={s.terms}>{policy!.terms}</div></section>}
    </>}
      </div>
    </div>
  </main><Footer /></>;
}
