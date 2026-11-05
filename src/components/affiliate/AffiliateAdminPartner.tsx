'use client';
import { useState } from 'react';
import { ArrowLeft, Check, Copy, Gift, Users, UserCheck, Wallet } from 'lucide-react';
import { affiliateMoney as money, type AffiliatePage, type Payout, type Reward } from '@/utils/affiliate';
import { useAffiliateAdminData, affiliateDate, type AdminMember, type AdminPartnerDetail } from './affiliate-admin-data';
import { AdminButton, AdminEmpty, AdminError, AdminLoading, AdminMetrics, AdminPager, AdminPayoutsTable, AdminStatus } from './AffiliateAdminUI';
import s from './AffiliateAdmin.module.css';

export default function AffiliateAdminPartner({ id, revision, onBack, onReview }: { id: string; revision: number; onBack: () => void; onReview?: (payout: Payout) => void }) {
  const [section, setSection] = useState<'referrals' | 'rewards' | 'payouts'>('referrals');
  const [pages, setPages] = useState({ referrals: 1, rewards: 1, payouts: 1 });
  const [copyState, setCopyState] = useState('');
  const detail = useAffiliateAdminData<AdminPartnerDetail>(`/admin/affiliates/partners/${id}`, revision);
  const records = useAffiliateAdminData<AffiliatePage<AdminMember | Reward | Payout>>(`/admin/affiliates/partners/${id}/${section}?page=${pages[section]}`, revision);
  const data = detail.data;
  return <div><button className={s.back} onClick={onBack}><ArrowLeft size={17} />Danh sách đối tác</button>
    {detail.error && <AdminError message={detail.error} />}{detail.loading && <AdminLoading />}
    {data && <>
      <section className={s.profileHero}><div className={s.person}><span className={s.avatar}><Users size={27} /></span><div>
        <h2>{data.partner.userId?.name || 'Chưa cập nhật tên'}</h2><div className={s.profileMeta}><span>{data.partner.userId?.phone || 'Chưa cập nhật số điện thoại'}</span><span>Tham gia {affiliateDate(data.partner.acceptedAt)}</span><AdminStatus value={data.partner.status} /></div>
        {data.partner.suspensionReason && data.partner.status === 'suspended' && <p className={s.muted}>Lý do tạm ngưng: {data.partner.suspensionReason}</p>}
      </div></div><div className={s.actions}><span className={s.code}>{data.partner.code}</span><button className={s.iconButton} aria-label='Sao chép mã giới thiệu' onClick={() => { void navigator.clipboard.writeText(data.partner.code).then(() => setCopyState('Đã sao chép mã')).catch(() => setCopyState('Không sao chép được. Vui lòng chọn và sao chép mã.')); }}><Copy size={16} /></button><span role='status' className={s.muted}>{copyState}</span></div></section>
      <AdminMetrics items={[
        { label: 'Thành viên giới thiệu', value: data.stats.registered.toLocaleString('vi-VN'), hint: `${data.stats.drivers} tài xế · ${data.stats.shippers} chủ hàng`, icon: Users },
        { label: 'Đủ điều kiện nhận thưởng', value: data.stats.qualified.toLocaleString('vi-VN'), hint: `${data.stats.pending} thành viên đang chờ đủ điều kiện`, icon: UserCheck, tone: 'green' },
        { label: 'Tổng tiền thưởng', value: money(data.partner.totalEarned), hint: `Đã thanh toán ${money(data.partner.paidAmount)}`, icon: Gift, tone: 'purple' },
        { label: 'Số dư khả dụng', value: money(data.partner.balance), hint: `Đang giữ thanh toán ${money(data.partner.reservedAmount)}`, icon: Wallet, tone: 'amber' },
      ]} />
      <div className={s.split}>
        <section className={s.panel}><header className={s.panelHeader}><div><h2>Tăng trưởng thành viên</h2><p>Lượt đăng ký mới trong 6 tháng gần nhất · múi giờ Việt Nam</p></div></header><div className={s.panelBody}><div className={s.chart} role='img' aria-label={data.monthlyRegistrations.map(v => `${v.month}: ${v.count} thành viên`).join('; ')}>
          {data.monthlyRegistrations.map(row => <div key={row.month} className={s.chartCol}><strong>{row.count}</strong><div className={s.bar} style={{ height: `${row.count / Math.max(1, ...data.monthlyRegistrations.map(v => v.count)) * 75}%` }} /><span>{row.month.slice(5)}/{row.month.slice(2, 4)}</span></div>)}
        </div></div></section>
        <section className={s.panel}><header className={s.panelHeader}><div><h2>Cơ cấu tiền thưởng</h2><p>Dựa trên các khoản thưởng đã ghi nhận</p></div></header><div className={`${s.panelBody} ${s.balanceRows}`}>
          {data.rewards.map(row => <div key={row.kind} className={s.balanceRow}><span>{({ driver: 'Giới thiệu tài xế', shipper: 'Giới thiệu chủ hàng', milestone: 'Thưởng mốc thành viên' } as Record<string, string>)[row.kind]}<em>{row.count} khoản thưởng</em></span><strong>{money(row.amount)}</strong></div>)}
          <div className={s.balanceRow}><span>Tài xế đủ điều kiện</span><strong>{data.stats.qualifiedDrivers} / {data.stats.drivers}</strong></div><div className={s.balanceRow}><span>Chủ hàng đủ điều kiện</span><strong>{data.stats.qualifiedShippers} / {data.stats.shippers}</strong></div>
        </div></section>
      </div>
      <section className={s.panel}><header className={s.panelHeader}><div><h2>Cấp độ thành viên</h2><p>Chính sách đã đồng ý: {data.partner.termsVersion} · {data.partner.policySnapshot?.milestoneBasis === 'registered' ? 'Tính theo số đăng ký' : 'Tính theo người đủ điều kiện'}</p></div></header>
        {data.partner.policySnapshot && ['registered', 'qualified'].includes(data.partner.policySnapshot.milestoneBasis) && data.partner.policySnapshot.milestoneMode !== 'unconfigured' ? <div className={s.tiers}>{[...data.partner.policySnapshot.milestones].sort((a, b) => a.count - b.count).map(tier => {
          const count = data.partner.policySnapshot?.milestoneBasis === 'registered' ? data.stats.registered : data.stats.qualified;
          const paid = data.milestoneRewards.some(v => v.threshold === tier.count);
          return <div className={s.tier} key={tier.count} data-paid={paid}><small>Mốc {tier.count.toLocaleString('vi-VN')} thành viên</small><strong>{money(tier.amount)}</strong><progress className={s.progress} max={tier.count} value={Math.min(count, tier.count)} aria-label={`Tiến độ mốc ${tier.count}`} /><small>{Math.min(count, tier.count).toLocaleString('vi-VN')} / {tier.count.toLocaleString('vi-VN')}</small>{paid && <span className={s.badge} data-status='qualified'><Check size={13} />Đã ghi thưởng</span>}</div>;
        })}</div> : <div className={s.panelBody}><p className={s.muted}>Chính sách đăng ký của đối tác chưa kích hoạt thưởng theo mốc.</p></div>}
      </section>
    </>}
    {data && <section className={s.panel}><div className={s.tabs} role='tablist' aria-label='Thông tin chi tiết đối tác' style={{ marginBottom: 0 }}>{([['referrals', 'Thành viên'], ['rewards', 'Lịch sử thưởng'], ['payouts', 'Thanh toán']] as const).map(([key, label]) => <button key={key} role='tab' aria-selected={section === key} onClick={() => setSection(key)}>{label}</button>)}</div>
      {records.loading && <AdminLoading />}{records.error && <AdminError message={records.error} />}
      {records.data && <>
        {section === 'referrals' && (records.data.items.length ? <div className={s.tableWrap}><table><thead><tr><th>Thành viên</th><th>Vai trò đăng ký</th><th>Đăng ký / Đủ điều kiện</th><th>Trạng thái</th><th>Thưởng giới thiệu</th></tr></thead><tbody>{(records.data.items as AdminMember[]).map(row => <tr key={row._id}><td><strong>{row.userId?.name || 'Tài khoản không còn hiển thị'}</strong><small>{row.userId?.phone || '—'}</small></td><td>{row.role === 'tai-xe' ? 'Tài xế' : 'Chủ hàng'}</td><td>{affiliateDate(row.registeredAt, true)}<small>Đủ điều kiện: {affiliateDate(row.qualifiedAt, true)}</small></td><td><span className={s.badge} data-status={row.qualifiedAt ? 'qualified' : 'pending'}>{row.qualifiedAt ? 'Đủ điều kiện' : 'Chờ đủ điều kiện'}</span></td><td>{row.qualifiedAt ? money(row.rewardAmount) : <span className={s.muted}>Dự kiến {money(row.rewardAmount)}</span>}</td></tr>)}</tbody></table></div> : <AdminEmpty title='Chưa có thành viên giới thiệu' />)}
        {section === 'rewards' && (records.data.items.length ? <div className={s.tableWrap}><table><thead><tr><th>Thời gian</th><th>Nội dung</th><th>Số tiền</th></tr></thead><tbody>{(records.data.items as Reward[]).map(row => <tr key={row._id}><td>{affiliateDate(row.createdAt, true)}</td><td>{row.kind === 'milestone' ? `Mốc ${row.threshold} thành viên` : row.kind === 'driver' ? 'Giới thiệu tài xế' : 'Giới thiệu chủ hàng'}</td><td><strong>{money(row.amount)}</strong></td></tr>)}</tbody></table></div> : <AdminEmpty title='Chưa ghi nhận tiền thưởng' />)}
        {section === 'payouts' && <AdminPayoutsTable payouts={records.data.items as Payout[]} onReview={onReview} />}
        <AdminPager pagination={records.data.pagination} onPage={page => setPages(v => ({ ...v, [section]: page }))} />
      </>}
    </section>}
    <AdminButton secondary onClick={onBack}><ArrowLeft size={16} />Quay lại danh sách</AdminButton>
  </div>;
}
