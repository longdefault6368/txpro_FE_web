'use client';
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowDownLeft, ChevronLeft, ChevronRight, Eye, Users, X, type LucideIcon } from 'lucide-react';
import { affiliateMoney as money, type AffiliatePage, type Partner, type Payout } from '@/utils/affiliate';
import { affiliateDate } from './affiliate-admin-data';
import s from './AffiliateAdmin.module.css';

export function AdminButton({ children, secondary = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return <button type='button' {...props} className={`${secondary ? s.secondary : s.primary} ${props.className || ''}`}>{children}</button>;
}
export function AdminMetrics({ items }: { items: { label: string; value: string | number; hint: string; icon: LucideIcon; tone?: string }[] }) {
  return <div className={s.metrics}>{items.map(({ label, value, hint, icon: Icon, tone }) => <div className={s.metric} key={label}>
    <span className={s.metricIcon} data-tone={tone}><Icon size={20} /></span><span>{label}</span><strong>{value}</strong><small>{hint}</small>
  </div>)}</div>;
}
export function AdminEmpty({ title = 'Chưa có dữ liệu', children }: { title?: string; children?: ReactNode }) {
  return <div className={s.empty}><span><Users size={26} /></span><strong>{title}</strong>{children && <p>{children}</p>}</div>;
}
export function AdminLoading() { return <div className={s.loading} role='status' aria-label='Đang tải dữ liệu'><div /><div /><div /></div>; }
export function AdminError({ message }: { message: string }) { return <div role='alert' className={s.error}>{message}</div>; }
export function AdminStatus({ value }: { value: string }) {
  return <span className={s.badge} data-status={value}>{({ active: 'Hoạt động', suspended: 'Tạm ngưng', pending: 'Chờ đối soát', paid: 'Đã thanh toán', rejected: 'Đã từ chối' } as Record<string, string>)[value] || value}</span>;
}
export function AdminPager({ pagination, onPage, busy }: { pagination: AffiliatePage<unknown>['pagination']; onPage: (page: number) => void; busy?: boolean }) {
  if (!pagination.total) return null;
  return <div className={s.pagination}><span>{pagination.total.toLocaleString('vi-VN')} kết quả · Trang {pagination.page}</span><div>
    <AdminButton secondary disabled={busy || pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} aria-label='Trang trước'><ChevronLeft size={17} />Trước</AdminButton>
    <AdminButton secondary disabled={busy || !pagination.hasMore} onClick={() => onPage(pagination.page + 1)} aria-label='Trang sau'>Sau<ChevronRight size={17} /></AdminButton>
  </div></div>;
}
export function AdminPartnersTable({ partners, onSelect, onStatus, busy }: { partners: Partner[]; onSelect: (id: string) => void; onStatus?: (partner: Partner) => void; busy?: boolean }) {
  if (!partners.length) return <AdminEmpty title='Chưa tìm thấy đối tác'>Thử thay đổi từ khóa hoặc bộ lọc để xem các đối tác khác.</AdminEmpty>;
  return <div className={s.tableWrap}><table><thead><tr><th>Đối tác</th><th>Mã giới thiệu</th><th>Thành viên</th><th>Trạng thái</th><th className={s.numeric}>Tổng thưởng</th><th className={s.numeric}>Khả dụng</th><th /></tr></thead><tbody>
    {partners.map(p => <tr key={p._id} className={s.clickableRow} onClick={() => onSelect(p._id)}><td><div className={s.person}>
      <span className={s.avatar}>{(p.userId?.name || 'ĐT').trim().split(/\s+/).slice(-2).map(v => v[0]).join('').toUpperCase()}</span>
      <div><button className={s.nameButton} onClick={e => { e.stopPropagation(); onSelect(p._id); }}>{p.userId?.name || 'Chưa cập nhật tên'}</button><small>{p.userId?.phone || 'Chưa cập nhật số điện thoại'}</small></div></div></td>
      <td><span className={s.code}>{p.code}</span></td><td><strong>{p.stats?.registered.toLocaleString('vi-VN') ?? '—'}</strong><small>{p.stats ? `${p.stats.qualified.toLocaleString('vi-VN')} đủ điều kiện` : 'Chưa có thống kê'}</small></td>
      <td><AdminStatus value={p.status} /></td><td className={s.numeric}><strong>{money(p.totalEarned)}</strong></td><td className={s.numeric}>{money(p.balance)}</td><td><div className={s.rowActions}>
        <button className={s.iconButton} aria-label={`Xem chi tiết ${p.userId?.name || p.code}`} onClick={e => { e.stopPropagation(); onSelect(p._id); }}><Eye size={18} /></button>
        {onStatus && <button className={s.textButton} disabled={busy} onClick={e => { e.stopPropagation(); onStatus(p); }}>{p.status === 'active' ? 'Tạm ngưng' : 'Mở lại'}</button>}
      </div></td></tr>)}
  </tbody></table></div>;
}
export function AdminPayoutsTable({ payouts, onReview }: { payouts: Payout[]; onReview?: (payout: Payout) => void }) {
  if (!payouts.length) return <AdminEmpty title='Chưa có yêu cầu thanh toán'>Các yêu cầu thanh toán của đối tác sẽ hiển thị tại đây.</AdminEmpty>;
  return <div className={s.tableWrap}><table><thead><tr><th>Đối tác / Thời gian</th><th>Số tiền</th><th>Tài khoản nhận</th><th>Trạng thái</th><th>Đối soát</th></tr></thead><tbody>{payouts.map(p => <tr key={p._id}>
    <td><span className={s.code}>{p.partnerId?.code || 'Yêu cầu của đối tác'}</span><small>{affiliateDate(p.createdAt, true)}</small></td><td><strong>{money(p.amount)}</strong></td>
    <td><strong>{p.accountName}</strong><small>{p.bankName} · {p.accountNumber}</small></td><td><AdminStatus value={p.status} /></td>
    <td>{p.status === 'pending' && onReview ? <AdminButton secondary onClick={() => onReview(p)}><ArrowDownLeft size={16} />Xử lý</AdminButton> : <span className={s.muted}>{p.transferReference || p.note || '—'}</span>}</td>
  </tr>)}</tbody></table></div>;
}
export function AdminDialog({ title, children, onClose, busy }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); }; }, []);
  return <dialog ref={ref} className={s.dialog} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className={s.panelHeader}><h2>{title}</h2><button className={s.iconButton} disabled={busy} onClick={onClose} aria-label='Đóng'><X size={20} /></button></div>{children}
  </dialog>;
}
