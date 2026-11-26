'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Award,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Gift,
  Handshake,
  LayoutDashboard,
  Link2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import AffiliateAttendancePanel from './AffiliateAttendancePanel';
import { postingRequest } from '@/utils/posting-api';
import { commitRegistrationSession } from '@/utils/web-registration';
import { affiliateMoney as money, type AffiliateSummary, type AffiliatePage, type Payout, type Referral, type Reward } from '@/utils/affiliate';
import s from './Affiliate.module.css';

export default function AffiliatePortal() {
  const [data, setData] = useState<AffiliateSummary | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [referrals, setReferrals] = useState<AffiliatePage<Referral> | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [page, setPage] = useState(1);
  const [bank, setBank] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' });
  const lock = useRef(false);
  const ticketExchange = useRef<Promise<void> | null>(null);
  const loadRevision = useRef(0);
  const payoutAttempt = useRef<{ signature: string; key: string } | null>(null);
  const displayedSession = useRef<string | null>(null);
  const policyVersion = useRef('');
  const [activeSection, setActiveSection] = useState('overview');
  const [userName, setUserName] = useState('');

  const load = useCallback(async () => {
    const revision = ++loadRevision.current;
    const expected = localStorage.getItem('txpro_user_session');
    const same = () => {
      if (localStorage.getItem('txpro_user_session') !== expected) {
        throw new Error('Tài khoản đã thay đổi. Vui lòng tải lại trang.');
      }
    };
    const summary = await postingRequest<AffiliateSummary>('/affiliate/me');
    same();
    if (revision !== loadRevision.current) return;
    displayedSession.current = expected;
    if (policyVersion.current !== summary.policy.version) {
      policyVersion.current = summary.policy.version;
      setAccepted(false);
    }
    setData(summary);
    try {
      setUserName(summary.partner?.userId?.name || (expected ? JSON.parse(expected).name : '') || 'Tài khoản đối tác');
    } catch {
      setUserName('Tài khoản đối tác');
    }
    if (summary.partner) {
      if (activeSection === 'referrals') {
        const refs = await postingRequest<AffiliatePage<Referral>>('/affiliate/referrals?page=' + page);
        same();
        if (revision !== loadRevision.current) return;
        setReferrals(refs);
      } else if (activeSection === 'rewards') {
        const credits = await postingRequest<AffiliatePage<Reward>>('/affiliate/rewards?limit=100');
        same();
        if (revision !== loadRevision.current) return;
        setRewards(credits.items);
      } else if (activeSection === 'history' && !summary.partner.attendanceEnabled) {
        const withdrawals = await postingRequest<AffiliatePage<Payout>>('/affiliate/payouts?limit=100');
        same();
        if (revision !== loadRevision.current) return;
        setPayouts(withdrawals.items);
      }
    }
  }, [page, activeSection]);

  useEffect(() => {
    const onSessionChanged = () => {
      if (displayedSession.current !== null && displayedSession.current !== localStorage.getItem('txpro_user_session')) {
        loadRevision.current++;
        displayedSession.current = null;
        setData(null);
        setUserName('');
        setReferrals(null);
        setRewards([]);
        setPayouts([]);
        setAccepted(false);
        setBank({ amount: '', bankName: '', accountNumber: '', accountName: '' });
        payoutAttempt.current = null;
        setError('Tài khoản đã thay đổi. Vui lòng tải lại trang đối tác.');
      }
    };
    window.addEventListener('storage', onSessionChanged);
    window.addEventListener('txpro_session_updated', onSessionChanged);
    return () => {
      window.removeEventListener('storage', onSessionChanged);
      window.removeEventListener('txpro_session_updated', onSessionChanged);
    };
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
            const result = await postingRequest<Parameters<typeof commitRegistrationSession>[1]>(
              '/public/affiliate/web-session',
              { method: 'POST', body: JSON.stringify({ ticket }) },
              false
            );
            const previous = expected ? (JSON.parse(expected) as { id?: string }) : null;
            if (previous?.id && previous.id !== (result.user?.id || result.user?._id)) {
              throw new Error('Website đang dùng tài khoản khác với app. Hãy đăng xuất rồi mở lại trang đối tác từ app.');
            }
            commitRegistrationSession(localStorage, result, expected);
            if (!localStorage.getItem('txpro_device_id')) localStorage.setItem('txpro_device_id', crypto.randomUUID());
            window.dispatchEvent(new Event('txpro_session_updated'));
          })();
        }
        if (ticketExchange.current) await ticketExchange.current;
        if (active) await load();
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Không tải được trang đối tác.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    const revisionState = loadRevision;
    return () => {
      active = false;
      revisionState.current++;
    };
  }, [load]);

  function navigate(section: string) {
    if (section === activeSection) return;
    setReferrals(null);
    setRewards([]);
    setPayouts([]);
    setLoading(true);
    setError('');
    setNotice('');
    setPage(1);
    setActiveSection(section);
  }

  function changePage(next: number) {
    setReferrals(null);
    setLoading(true);
    setError('');
    setPage(next);
  }

  async function action(work: () => Promise<void>) {
    if (displayedSession.current !== localStorage.getItem('txpro_user_session')) {
      setError('Tài khoản đã thay đổi. Vui lòng tải lại trang đối tác.');
      return;
    }
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa thực hiện được yêu cầu.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Đã sao chép vào bộ nhớ tạm.');
    } catch {
      setNotice('Bạn có thể chọn và sao chép thông tin hiển thị bên dưới.');
    }
  }

  async function payout(event: FormEvent) {
    event.preventDefault();
    const payload = { ...bank, amount: Number(bank.amount) };
    const signature = JSON.stringify(payload);
    if (payoutAttempt.current?.signature !== signature) {
      payoutAttempt.current = { signature, key: crypto.randomUUID() };
    }
    const requestKey = payoutAttempt.current.key;
    await action(async () => {
      await postingRequest('/affiliate/payouts', {
        method: 'POST',
        body: JSON.stringify({ ...payload, requestKey }),
      });
      setNotice('Đã gửi yêu cầu thanh toán. Tiền đang chờ quản trị viên đối soát.');
      setBank((v) => ({ ...v, amount: '' }));
      payoutAttempt.current = null;
    });
  }

  const partner = data?.partner;
  const policy = data?.policy;
  const minPayout = data?.currentPolicy?.minPayout || policy?.minPayout || 20000;
  const registeredCount = data?.stats?.registered || 0;
  const qualifiedCount = data?.stats?.qualified || 0;
  const conversionRate = registeredCount > 0 ? Math.round((qualifiedCount / registeredCount) * 100) : 0;
  const count = policy?.milestoneBasis === 'registered' ? registeredCount : qualifiedCount;
  const tiers = [...(policy?.milestones || [])].sort((a, b) => a.count - b.count);
  const nextIndex = tiers.findIndex((tier) => count < tier.count);
  const previousCount = nextIndex > 0 ? tiers[nextIndex - 1].count : 0;
  const progress = !tiers.length
    ? 0
    : nextIndex < 0
    ? 100
    : ((nextIndex + (count - previousCount) / (tiers[nextIndex].count - previousCount)) / tiers.length) * 100;

  const hasAttendancePayroll = Boolean(partner?.attendanceEnabled);
  const menu = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    ...(partner
      ? [
          ...(hasAttendancePayroll ? [{ id: 'attendance', label: 'Chấm công & lương', icon: CalendarClock }] : []),
          { id: 'sharing', label: 'Link giới thiệu', icon: Link2 },
          { id: 'referrals', label: 'Người được giới thiệu', icon: Users },
          { id: 'rewards', label: 'Tiền thưởng & cấp độ', icon: Gift },
          ...(!hasAttendancePayroll
            ? [
                { id: 'payment', label: 'Yêu cầu thanh toán', icon: Wallet },
                { id: 'history', label: 'Lịch sử thanh toán', icon: FileText },
              ]
            : []),
        ]
      : []),
    ...(policy ? [{ id: 'policy', label: 'Chính sách đối tác', icon: ShieldCheck }] : []),
  ];
  const currentSection =
    (activeSection === 'attendance' && !hasAttendancePayroll) ||
    ((activeSection === 'payment' || activeSection === 'history') && hasAttendancePayroll)
      ? 'overview'
      : activeSection;

  return (
    <>
      <Header />
      <div className={s.workspaceBg}>
        <main className={`${s.page} ${s.workspace}`}>
          <div className={s.workspaceHeading}>
            <div>
              <span className={s.eyebrow}>
                <span className={s.eyebrowDot} />
                TXE PRO AFFILIATE
              </span>
              <h1>Trung tâm đối tác</h1>
              <p>Theo dõi hiệu quả giới thiệu, cấp độ thưởng và chủ động rút hoa hồng minh bạch.</p>
            </div>
            <div className={s.headingActions}>
              {partner && currentSection !== 'attendance' && (
                <button
                  type="button"
                  className={s.refreshPill}
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      await postingRequest('/affiliate/refresh', { method: 'POST' });
                    })
                  }
                >
                  <RefreshCw size={14} className={busy ? s.spin : undefined} />
                  <span>Cập nhật kết quả</span>
                </button>
              )}
              <span className={s.workspaceLabel} data-active={partner?.status === 'active' ? 'true' : undefined}>
                <ShieldCheck size={15} />
                {partner ? (partner.status === 'active' ? 'Đối tác đang hoạt động' : 'Tài khoản tạm ngưng') : 'Khu vực đối tác'}
              </span>
            </div>
          </div>

          <div className={s.workspaceLayout}>
            <aside className={s.sidebar} aria-label="Menu quản lý đối tác">
              <div className={s.sidebarIdentity}>
                <span className={s.partnerMark}>
                  <Handshake size={24} />
                </span>
                <div>
                  <strong className={s.identityName}>
                    {userName || 'Tài khoản đối tác'}
                    {partner && <CheckCircle2 size={16} aria-label="Đã xác nhận đối tác" />}
                  </strong>
                  <small>{partner ? 'Mã: ' + partner.code : 'Cùng xây dựng kết nối'}</small>
                </div>
              </div>

              <span className={s.navCaption}>QUẢN LÝ ĐỐI TÁC</span>
              <nav className={s.workspaceNav} aria-label="Điều hướng đối tác">
                {menu.map(({ id, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={id}
                    aria-current={currentSection === id ? 'page' : undefined}
                    onClick={() => {
                      navigate(id);
                    }}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    <span>{label}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </nav>

              {!loading && !data && (
                <div className={s.sidebarAuth}>
                  <p>Bắt đầu hành trình đối tác của bạn.</p>
                  <Link href="/doi-tac/dang-nhap">
                    Đăng nhập đối tác
                    <ChevronRight size={15} />
                  </Link>
                  <Link href="/doi-tac/dang-ky">
                    Đăng ký đối tác
                    <ChevronRight size={15} />
                  </Link>
                </div>
              )}

              <div className={s.sidebarHelp}>
                <ShieldCheck size={18} />
                <p>Quyền lợi lưu cố định theo phiên bản chính sách đã đồng ý. Mỗi lượt đủ điều kiện được cộng thưởng tự động.</p>
              </div>
            </aside>

            <div className={s.workspaceContent}>
              {currentSection === 'overview' && (
                <header className={`${s.hero} ${s.portalHero}`} id="affiliate-overview">
                  <div>
                    <span className={s.eyebrow}>
                      <Sparkles size={13} />
                      MỖI KẾT NỐI, THÊM GIÁ TRỊ
                    </span>
                    <h2>Đồng hành cùng TXE PRO</h2>
                    <p>
                      Chia sẻ lời mời đến Tài xế và Chủ hàng, theo dõi trạng thái đủ điều kiện theo thời gian thực và rút thưởng trực tiếp về ngân hàng.
                    </p>
                    {partner && (
                      <div className={s.heroActions}>
                        <button type="button" className={s.heroAction} onClick={() => navigate('sharing')}>
                          <span>Chia sẻ link giới thiệu</span>
                          <ChevronRight size={16} />
                        </button>
                        <button type="button" className={s.heroSecondaryAction} onClick={() => void copy(partner.code)}>
                          <Copy size={14} />
                          <span>Mã: {partner.code}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span className={s.heroSymbol}>
                    <Handshake size={56} strokeWidth={1.3} />
                  </span>
                </header>
              )}

              {error && (
                <div className={s.error} role="alert">
                  {error}
                </div>
              )}
              {notice && (
                <div className={s.notice} role="status">
                  {notice}
                </div>
              )}

              {loading ? (
                <div className={s.loadingShell} role="status">
                  <p style={{ margin: 0, fontWeight: 600, color: '#4f6b8a' }}>Đang tải thông tin đối tác…</p>
                  <div className={s.skeletonBar} style={{ width: '52%' }} />
                  <div className={s.skeletonBar} style={{ width: '88%' }} />
                  <div className={s.skeletonBar} style={{ width: '68%' }} />
                </div>
              ) : !data ? (
                <section className={s.panel}>
                  <h2>
                    <Handshake size={20} color="#136dec" />
                    Tham gia TXE PRO Affiliate
                  </h2>
                  <p>
                    Đăng nhập khu vực đối tác hoặc tạo tài khoản mới trong 1 phút để nhận mã giới thiệu và bắt đầu kiếm hoa hồng không giới hạn.
                  </p>
                  <div className={s.guestHighlights}>
                    <div className={s.guestHighlight}>
                      <span>Thưởng giới thiệu Tài xế</span>
                      <strong>30.000 ₫ / người</strong>
                    </div>
                    <div className={s.guestHighlight}>
                      <span>Thưởng giới thiệu Chủ hàng</span>
                      <strong>20.000 ₫ / người</strong>
                    </div>
                    <div className={s.guestHighlight}>
                      <span>Thưởng mốc thành viên</span>
                      <strong>Tới 60.000.000 ₫</strong>
                    </div>
                  </div>
                  <div className={s.buttons}>
                    <Link className={s.primary} href="/doi-tac/dang-nhap">
                      Đăng nhập đối tác
                      <ChevronRight size={16} />
                    </Link>
                    <Link className={s.secondary} href="/doi-tac/dang-ky">
                      Đăng ký đối tác
                    </Link>
                  </div>
                </section>
              ) : !partner ? (
                <section className={s.panel} id="affiliate-policy">
                  <div className={s.panelHeader}>
                    <div>
                      <h2>
                        <ShieldCheck size={20} color="#136dec" />
                        ĐỐI TÁC TXE PRO
                      </h2>
                      <p className={s.panelSub}>Giới thiệu thành viên – Nhận thưởng hấp dẫn!</p>
                    </div>
                    <span className={s.pill} data-tone="blue">
                      Phiên bản {policy!.version}
                    </span>
                  </div>
                  <div className={s.terms} tabIndex={0}>
                    {policy!.terms}
                  </div>
                  <label className={s.check}>
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      disabled={busy}
                    />
                    <span>Tôi đã đọc và đồng ý chính sách phiên bản {policy!.version}.</span>
                  </label>
                  <button
                    className={s.primary}
                    disabled={!accepted || busy || !policy!.enabled}
                    onClick={() =>
                      void action(async () => {
                        await postingRequest('/affiliate/enroll', {
                          method: 'POST',
                          body: JSON.stringify({ accepted: true, version: policy!.version }),
                        });
                      })
                    }
                  >
                    <CheckCircle2 size={17} />
                    Đồng ý và trở thành đối tác
                  </button>
                </section>
              ) : (
                <>
                  {partner.status !== 'active' && (
                    <div className={s.notice}>
                      Đối tác đang tạm ngưng. {partner.suspensionReason}
                    </div>
                  )}

                  {currentSection === 'attendance' && partner.attendanceEnabled && (
                    <AffiliateAttendancePanel partner={partner} />
                  )}

                  {currentSection === 'overview' && (
                    <>
                      <div className={s.grid}>
                        {[
                          { title: 'Tổng tiền thưởng', value: partner.totalEarned, tone: 'blue', icon: TrendingUp },
                          {
                            title: 'Có thể yêu cầu thanh toán',
                            value: partner.balance,
                            tone: 'emerald',
                            icon: Wallet,
                            cta: !hasAttendancePayroll && partner.balance >= minPayout,
                          },
                          { title: 'Đang chờ thanh toán', value: partner.reservedAmount, tone: 'amber', icon: Clock },
                          { title: 'Đã thanh toán', value: partner.paidAmount, tone: 'indigo', icon: CheckCircle2 },
                        ].map(({ title, value, tone, icon: Icon, cta }) => (
                          <div className={s.stat} data-tone={tone} key={title}>
                            <div className={s.statHead}>
                              <span className={s.statIcon}>
                                <Icon size={18} />
                              </span>
                            </div>
                            <span className={s.statLabel}>{title}</span>
                            <strong>{money(Number(value))}</strong>
                            {cta && (
                              <button type="button" className={s.statAction} onClick={() => navigate('payment')}>
                                Rút tiền ngay <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <section className={s.panel}>
                        <div className={s.panelHeader}>
                          <div>
                            <h2>
                              <Users size={19} color="#136dec" />
                              Kết quả giới thiệu
                            </h2>
                            <p className={s.panelSub}>Tổng hợp thành viên đăng ký qua mã và tỷ lệ đạt chuẩn nhận thưởng.</p>
                          </div>
                          <button type="button" className={s.secondary} onClick={() => navigate('referrals')}>
                            Xem danh sách
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className={s.funnelGrid}>
                          <div className={s.funnelBox}>
                            <span>Đã đăng ký</span>
                            <strong>{registeredCount.toLocaleString('vi-VN')}</strong>
                          </div>
                          <div className={s.funnelBox} data-tone="emerald">
                            <span>Đã đủ điều kiện nhận thưởng</span>
                            <strong>{qualifiedCount.toLocaleString('vi-VN')}</strong>
                          </div>
                          <div className={s.funnelBox}>
                            <span>Tỷ lệ đạt điều kiện</span>
                            <strong>{conversionRate}%</strong>
                          </div>
                        </div>
                        <p className={s.funnelNote}>
                          Mỗi tài khoản được ghi nhận một lần theo vai trò đăng ký ban đầu. Đổi vai trò không tạo thêm lượt thưởng.
                        </p>
                      </section>
                    </>
                  )}

                  {currentSection === 'sharing' && (
                    <section className={s.panel} id="affiliate-sharing">
                      <div className={s.panelHeader}>
                        <div>
                          <h2>
                            <Link2 size={19} color="#136dec" />
                            Chia sẻ và giới thiệu
                          </h2>
                          <p className={s.panelSub}>
                            Gửi mã hoặc link mời để hệ thống tự động ghi nhận thành viên cho tài khoản đối tác của bạn.
                          </p>
                        </div>
                      </div>

                      <div className={s.shareCodeHero}>
                        <div>
                          <span className={s.shareCodeLabel}>Mã giới thiệu của bạn</span>
                          <div className={s.shareCodeValue}>{partner.code}</div>
                        </div>
                        <button type="button" className={s.primary} onClick={() => void copy(partner.code)}>
                          <Copy size={16} />
                          Sao chép mã
                        </button>
                      </div>

                      <div className={s.shareCard}>
                        <p className={s.shareCardTitle}>
                          <Link2 size={15} color="#136dec" />
                          Link giới thiệu trực tiếp
                        </p>
                        <div className={s.code}>{data.referralLink}</div>
                        <div className={s.buttons} style={{ marginBottom: 0 }}>
                          <button
                            type="button"
                            className={s.primary}
                            disabled={!data.referralLink}
                            onClick={() => void copy(data.referralLink!)}
                          >
                            <Copy size={16} />
                            Sao chép link
                          </button>
                        </div>
                      </div>

                      {(data.googlePlayUrl || data.appStoreUrl) && (
                        <div className={s.shareGrid}>
                          {data.googlePlayUrl && (
                            <div className={s.shareCard}>
                              <p className={s.shareCardTitle}>
                                <Smartphone size={15} color="#059669" />
                                Google Play kèm mã giới thiệu
                              </p>
                              <div className={s.code}>{data.googlePlayUrl}</div>
                              <button
                                type="button"
                                className={s.secondary}
                                onClick={() => void copy(data.googlePlayUrl!)}
                              >
                                <Copy size={15} />
                                Sao chép link Google Play
                              </button>
                            </div>
                          )}
                          {data.appStoreUrl && (
                            <div className={s.shareCard}>
                              <p className={s.shareCardTitle}>
                                <Smartphone size={15} color="#136dec" />
                                App Store kèm mã giới thiệu
                              </p>
                              <div className={s.code}>{data.appStoreUrl}</div>
                              <button
                                type="button"
                                className={s.secondary}
                                onClick={() => void copy(data.appStoreUrl!)}
                              >
                                <Copy size={15} />
                                Sao chép link App Store
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={s.shareSteps}>
                        <div className={s.shareStep}>
                          <b>1</b>
                          <span>Chia sẻ link hoặc mã giới thiệu đến Tài xế, Chủ hàng qua Zalo, Facebook.</span>
                        </div>
                        <div className={s.shareStep}>
                          <b>2</b>
                          <span>Người được mời đăng ký &amp; hoàn tất xác thực eKYC (Tài xế) hoặc đơn đầu (Chủ hàng).</span>
                        </div>
                        <div className={s.shareStep}>
                          <b>3</b>
                          <span>Tiền thưởng và tiến độ mốc tự động cộng vào ví đối tác của bạn.</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {(currentSection === 'rewards' || currentSection === 'overview') && (
                    <section className={s.panel} id="affiliate-rewards">
                      <div className={s.panelHeader}>
                        <div>
                          <h2>
                            <Award size={19} color="#136dec" />
                            Cấp độ thành viên
                          </h2>
                          <p className={s.panelSub}>
                            Tính theo {policy!.milestoneBasis === 'registered' ? 'người đã đăng ký' : 'người đã đủ điều kiện nhận thưởng'}.{' '}
                            {policy!.milestoneMode === 'each'
                              ? 'Mỗi mốc nhận thêm khoản thưởng riêng.'
                              : policy!.milestoneMode === 'difference'
                              ? 'Mỗi mốc nhận phần chênh lệch để đạt tổng thưởng công bố.'
                              : 'Quy tắc mốc đang chờ cấu hình.'}
                          </p>
                        </div>
                      </div>

                      <div className={s.progressCount}>
                        <strong>{count.toLocaleString('vi-VN')}</strong>
                        <span>lượt đã đạt</span>
                        {nextIndex >= 0 && (
                          <span className={s.nextTierChip}>
                            Còn {Math.max(0, tiers[nextIndex].count - count).toLocaleString('vi-VN')} lượt đến mốc tiếp theo
                          </span>
                        )}
                      </div>

                      {tiers.length > 0 && (
                        <div className={s.milestoneScroll}>
                          <div className={s.milestoneChart} style={{ minWidth: Math.max(460, tiers.length * 130) }}>
                            <div
                              className={s.milestoneTrack}
                              role="progressbar"
                              aria-label="Tiến độ cấp độ thành viên"
                              aria-valuemin={0}
                              aria-valuemax={tiers[tiers.length - 1].count}
                              aria-valuenow={Math.min(count, tiers[tiers.length - 1].count)}
                              aria-valuetext={count + ' lượt đã đạt'}
                            >
                              <span style={{ width: progress + '%' }} />
                            </div>
                            <div className={s.milestoneStart}>0</div>
                            {tiers.map((tier, index) => (
                              <div
                                className={s.milestone}
                                key={tier.count}
                                data-achieved={count >= tier.count}
                                style={{ left: ((index + 1) / tiers.length) * 100 + '%' }}
                              >
                                <span className={s.milestoneDot}>{count >= tier.count && <CheckCircle2 size={14} />}</span>
                                <strong>{tier.count.toLocaleString('vi-VN')} người</strong>
                                <small>{money(tier.amount)}</small>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {currentSection === 'referrals' && (
                    <section className={s.panel} id="affiliate-referrals">
                      <div className={s.panelHeader}>
                        <div>
                          <h2>
                            <Users size={19} color="#136dec" />
                            Danh sách giới thiệu
                          </h2>
                          <p className={s.panelSub}>
                            Chỉ hiển thị thông tin đối soát cần thiết, bảo mật tuyệt đối dữ liệu cá nhân của thành viên.
                          </p>
                        </div>
                      </div>

                      {!!referrals?.items.length ? (
                        <>
                          <div className={s.table}>
                            <table>
                              <thead>
                                <tr>
                                  <th>Mã ghi nhận</th>
                                  <th>Vai trò</th>
                                  <th>Đăng ký</th>
                                  <th>Điều kiện</th>
                                  <th>Thưởng</th>
                                </tr>
                              </thead>
                              <tbody>
                                {referrals.items.map((item) => (
                                  <tr key={item.id}>
                                    <td data-label="Mã ghi nhận">
                                      <strong>{item.id.slice(-8).toUpperCase()}</strong>
                                    </td>
                                    <td data-label="Vai trò">
                                      <span className={s.pill} data-tone={item.role === 'tai-xe' ? 'emerald' : 'blue'}>
                                        {item.role === 'tai-xe' ? 'Tài xế' : 'Chủ hàng'}
                                      </span>
                                    </td>
                                    <td data-label="Đăng ký">{new Date(item.registeredAt).toLocaleDateString('vi-VN')}</td>
                                    <td data-label="Điều kiện">
                                      <span className={s.pill} data-tone={item.qualifiedAt ? 'emerald' : 'amber'}>
                                        {item.qualifiedAt ? 'Đã đủ điều kiện' : 'Đang chờ đủ điều kiện'}
                                      </span>
                                    </td>
                                    <td data-label="Thưởng">
                                      {item.qualifiedAt ? (
                                        <strong style={{ color: '#059669' }}>{money(item.rewardAmount)}</strong>
                                      ) : (
                                        <span style={{ color: '#6b8199' }}>Chưa ghi thưởng</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className={s.buttons} aria-label="Phân trang giới thiệu">
                            <button
                              type="button"
                              className={s.secondary}
                              disabled={page === 1 || busy}
                              onClick={() => changePage(page - 1)}
                            >
                              Trước
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#4f6b8a' }}>Trang {page}</span>
                            <button
                              type="button"
                              className={s.secondary}
                              disabled={!referrals?.pagination.hasMore || busy}
                              onClick={() => changePage(page + 1)}
                            >
                              Sau
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className={s.emptyState}>
                          <span className={s.emptyIcon}>
                            <Users size={22} />
                          </span>
                          <p>Chưa có người đăng ký qua mã của bạn.</p>
                        </div>
                      )}
                    </section>
                  )}

                  {currentSection === 'payment' && (
                    <section className={s.panel} id="affiliate-payment">
                      <div className={s.panelHeader}>
                        <div>
                          <h2>
                            <Wallet size={19} color="#136dec" />
                            Yêu cầu thanh toán
                          </h2>
                          <p className={s.panelSub}>
                            Tối thiểu {money(minPayout)}. Điền chính xác tài khoản ngân hàng để kế toán đối soát và chuyển khoản.
                          </p>
                        </div>
                      </div>

                      <div className={s.balanceStrip}>
                        <div>
                          <span>Số dư có thể rút hiện tại</span>
                          <strong>{money(partner.balance)}</strong>
                        </div>
                        <span className={s.pill} data-tone={partner.balance >= minPayout ? 'emerald' : 'amber'}>
                          {partner.balance >= minPayout ? 'Đủ điều kiện rút tiền' : `Cần tối thiểu ${money(minPayout)}`}
                        </span>
                      </div>

                      <form onSubmit={payout}>
                        <fieldset disabled={busy || partner.status !== 'active'} style={{ border: 0, padding: 0, margin: 0 }}>
                          <div className={s.fields}>
                            {[
                              ['amount', 'Số tiền (₫)'],
                              ['bankName', 'Ngân hàng'],
                              ['accountNumber', 'Số tài khoản'],
                              ['accountName', 'Tên chủ tài khoản'],
                            ].map(([key, title]) => (
                              <label key={key}>
                                {title}
                                <input
                                  required
                                  type={key === 'amount' ? 'number' : 'text'}
                                  min={key === 'amount' ? minPayout : undefined}
                                  max={key === 'amount' ? partner.balance : undefined}
                                  value={bank[key as keyof typeof bank]}
                                  onChange={(e) => setBank((v) => ({ ...v, [key]: e.target.value }))}
                                />
                              </label>
                            ))}
                          </div>
                          <button type="submit" className={s.primary} disabled={busy || partner.balance < minPayout}>
                            <Wallet size={16} />
                            Gửi yêu cầu thanh toán
                          </button>
                        </fieldset>
                      </form>
                    </section>
                  )}

                  {currentSection === 'rewards' && (
                    <section className={s.panel}>
                      <h2>
                        <Gift size={19} color="#136dec" />
                        Ghi nhận thưởng gần đây
                      </h2>
                      {rewards.length ? (
                        <div className={s.rewardList}>
                          {rewards.map((reward) => (
                            <div className={s.rewardRow} data-kind={reward.kind} key={reward._id}>
                              <div className={s.rewardLeft}>
                                <span className={s.rewardIcon}>
                                  {reward.kind === 'milestone' ? <Award size={18} /> : <Gift size={18} />}
                                </span>
                                <div className={s.rewardMeta}>
                                  <span className={s.rewardTitle}>
                                    {reward.kind === 'milestone'
                                      ? 'Thưởng mốc ' + reward.threshold + ' người'
                                      : reward.kind === 'driver'
                                      ? 'Giới thiệu tài xế'
                                      : 'Giới thiệu chủ hàng'}
                                  </span>
                                  {reward.createdAt && (
                                    <span className={s.rewardDate}>
                                      {new Date(reward.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <strong className={s.rewardAmount}>+{money(reward.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={s.emptyState}>
                          <span className={s.emptyIcon}>
                            <Gift size={22} />
                          </span>
                          <p>Chưa phát sinh tiền thưởng.</p>
                        </div>
                      )}
                    </section>
                  )}

                  {currentSection === 'history' && (
                    <section className={s.panel} id="affiliate-history">
                      <div className={s.panelHeader}>
                        <div>
                          <h2>
                            <FileText size={19} color="#136dec" />
                            Lịch sử thanh toán
                          </h2>
                          <p className={s.panelSub}>Theo dõi trạng thái đối soát và mã giao dịch chuyển khoản của từng đợt rút.</p>
                        </div>
                      </div>
                      {payouts.length ? (
                        <div className={s.table}>
                          <table>
                            <thead>
                              <tr>
                                <th>Ngày yêu cầu</th>
                                <th>Số tiền</th>
                                <th>Tài khoản nhận</th>
                                <th>Trạng thái</th>
                                <th>Đối soát</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payouts.map((item) => (
                                <tr key={item._id}>
                                  <td data-label="Ngày yêu cầu">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                                  <td data-label="Số tiền">
                                    <strong>{money(item.amount)}</strong>
                                  </td>
                                  <td data-label="Tài khoản nhận">
                                    {item.bankName} · {item.accountNumber}
                                  </td>
                                  <td data-label="Trạng thái">
                                    <span
                                      className={s.pill}
                                      data-tone={
                                        item.status === 'paid'
                                          ? 'emerald'
                                          : item.status === 'rejected'
                                          ? 'rose'
                                          : 'amber'
                                      }
                                    >
                                      {item.status === 'paid'
                                        ? 'Đã chuyển khoản'
                                        : item.status === 'rejected'
                                        ? 'Đã từ chối, hoàn số dư'
                                        : 'Chờ đối soát'}
                                    </span>
                                  </td>
                                  <td data-label="Đối soát">{item.transferReference || item.note || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={s.emptyState}>
                          <span className={s.emptyIcon}>
                            <FileText size={22} />
                          </span>
                          <p>Chưa có yêu cầu thanh toán.</p>
                        </div>
                      )}
                    </section>
                  )}

                  {currentSection === 'policy' && (
                    <section className={s.panel} id="affiliate-policy">
                      <div className={s.panelHeader}>
                        <div>
                          <h2>
                            <ShieldCheck size={19} color="#136dec" />
                            Chính sách đã chấp nhận · {partner.termsVersion}
                          </h2>
                          <p className={s.panelSub}>Quyền lợi được bảo toàn theo đúng phiên bản bạn đã xác nhận khi tham gia.</p>
                        </div>
                        <span className={s.pill} data-tone="emerald">
                          Đang áp dụng
                        </span>
                      </div>
                      <div className={s.terms}>{policy!.terms}</div>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
