'use client';
import type { FormEvent } from 'react';
import { Plus, Save, Settings2, Trash2 } from 'lucide-react';
import type { AffiliatePolicy } from '@/utils/affiliate';
import { AdminButton } from './AffiliateAdminUI';
import s from './AffiliateAdmin.module.css';

export default function AffiliateAdminPolicy({ policy, changed, busy, canManage, onChange, onReset, onSave }: {
  policy: AffiliatePolicy; changed: boolean; busy: boolean; canManage: boolean;
  onChange: (value: AffiliatePolicy) => void; onReset: () => void; onSave: (event: FormEvent) => void;
}) {
  const update = (patch: Partial<AffiliatePolicy>) => onChange({ ...policy, ...patch });
  return <form onSubmit={onSave}><fieldset disabled={busy || !canManage}>
    <section className={s.panel}><header className={s.panelHeader}><div><h2>Cấu hình chương trình</h2><p>{canManage ? 'Chính sách mới áp dụng cho đối tác đăng ký mới. Mỗi lần lưu cần phiên bản mới.' : 'Bạn có quyền xem. Chỉ Super Admin được thay đổi chính sách.'}</p></div><Settings2 size={21} /></header>
      <div className={s.panelBody}><div className={s.fields}>
        <label>Phiên bản chính sách<input required minLength={3} maxLength={80} value={policy.version} onChange={e => update({ version: e.target.value })} /></label>
        <label>Trạng thái chương trình<select value={String(policy.enabled)} onChange={e => update({ enabled: e.target.value === 'true' })}><option value='true'>Đang nhận đối tác và giới thiệu mới</option><option value='false'>Tạm ngưng đăng ký / giới thiệu mới</option></select></label>
        {([['driverReward', 'Thưởng tài xế đủ điều kiện'], ['shipperReward', 'Thưởng chủ hàng đủ điều kiện'], ['minPayout', 'Thanh toán tối thiểu']] as const).map(([key, label]) => <label key={key}>{label} (đồng)<input required type='number' min={key === 'minPayout' ? 1 : 0} max={1000000000} step={1} value={policy[key]} onChange={e => update({ [key]: Number(e.target.value) })} /></label>)}
        <label>Cách tính thành viên<select value={policy.milestoneBasis} onChange={e => update({ milestoneBasis: e.target.value as AffiliatePolicy['milestoneBasis'] })}><option value='qualified'>Người đủ điều kiện nhận thưởng</option><option value='registered'>Tài khoản đăng ký đã xác minh điện thoại</option><option value='unconfigured'>Chưa kích hoạt thưởng mốc</option></select></label>
        <label>Cách trả thưởng mốc<select value={policy.milestoneMode} onChange={e => update({ milestoneMode: e.target.value as AffiliatePolicy['milestoneMode'] })}><option value='each'>Nhận thêm tiền thưởng tại mỗi mốc</option><option value='difference'>Nhận phần chênh lệch giữa hai mốc</option><option value='unconfigured'>Chưa kích hoạt thưởng mốc</option></select></label>
      </div></div>
    </section>
    <section className={s.panel}><header className={s.panelHeader}><div><h2>Mốc thành viên</h2><p>Mỗi mốc chỉ được ghi thưởng một lần theo chính sách của đối tác.</p></div><AdminButton secondary disabled={busy || !canManage || policy.milestones.length >= 20} onClick={() => update({ milestones: [...policy.milestones, { count: Math.max(0, ...policy.milestones.map(v => v.count)) + 100, amount: Math.max(0, ...policy.milestones.map(v => v.amount)) }] })}><Plus size={16} />Thêm mốc</AdminButton></header>
      <div className={s.panelBody}>{policy.milestones.map((tier, i) => <div className={s.tierEditor} key={i}><div className={s.fields}>
        <label>Số thành viên<input required type='number' min={1} max={1000000} step={1} value={tier.count} onChange={e => update({ milestones: policy.milestones.map((v, j) => j === i ? { ...v, count: Number(e.target.value) } : v) })} /></label>
        <label>Tiền thưởng (đồng)<input required type='number' min={0} max={1000000000} step={1} value={tier.amount} onChange={e => update({ milestones: policy.milestones.map((v, j) => j === i ? { ...v, amount: Number(e.target.value) } : v) })} /></label>
      </div><button className={s.iconButton} type='button' aria-label={`Xóa mốc ${tier.count}`} disabled={busy || !canManage || policy.milestones.length <= 1} onClick={() => update({ milestones: policy.milestones.filter((_, j) => i !== j) })}><Trash2 size={16} /></button></div>)}</div>
    </section>
    <section className={s.panel}><header className={s.panelHeader}><div><h2>Nội dung chính sách</h2><p>Nội dung người dùng đọc và đồng ý khi đăng ký đối tác.</p></div></header><div className={s.panelBody}><div className={s.fields}><label className={s.wide}>Điều kiện tham gia và nhận thưởng<textarea required minLength={100} maxLength={20000} value={policy.terms} onChange={e => update({ terms: e.target.value })} /></label></div></div>
      <footer className={s.policyFoot}><p>{changed ? 'Có thay đổi chưa được lưu.' : 'Chưa có thay đổi.'} Các khoản thưởng đã ghi nhận không bị sửa lại.</p><div className={s.actions}><AdminButton secondary disabled={busy || !canManage || !changed} onClick={onReset}>Bỏ thay đổi</AdminButton><AdminButton type='submit' disabled={busy || !canManage || !changed}><Save size={16} />Lưu chính sách mới</AdminButton></div></footer>
    </section>
  </fieldset></form>;
}
