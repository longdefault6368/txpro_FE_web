'use client';

import { RefreshCw, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import AppStoreLinks from '@/components/common/AppStoreLinks';
import s from './DriverAppVerification.module.css';

export default function DriverAppVerification({ reason, status, busy = false, onRefresh }: {
  reason: 'identity' | 'vehicle'; status?: string; busy?: boolean; onRefresh: () => void;
}) {
  return <section className={s.card} aria-label='Xác minh trên ứng dụng TXE PRO'>
    <span className={s.icon}>{reason === 'identity' ? <ShieldCheck size={27} /> : <Truck size={27} />}</span>
    <div className={s.content}>
      <span className={s.eyebrow}><Smartphone size={15} />THỰC HIỆN TRÊN ỨNG DỤNG</span>
      <h2>{reason === 'identity' ? 'Xác minh danh tính để đăng xe' : 'Thêm và xác minh phương tiện trên app'}</h2>
      {status && <p className={s.status} role='status'>{status}</p>}
      <p>{reason === 'identity'
        ? 'Bạn cần hoàn tất xác minh danh tính tài xế trên ứng dụng TXE PRO trước khi đăng xe trống trên website.'
        : 'Đăng ký xe và xác minh giấy tờ phương tiện trên ứng dụng TXE PRO. Xe đủ điều kiện sẽ xuất hiện trong danh sách đăng tin trên website.'}</p>
      <ol>
        <li>Tải TXE PRO từ Google Play (CH Play) hoặc App Store.</li>
        <li>Đăng nhập bằng cùng tài khoản, chọn vai trò tài xế và {reason === 'identity' ? 'hoàn tất xác minh danh tính, sau đó thêm phương tiện.' : 'vào Quản lý phương tiện để thêm hoặc cập nhật xe.'}</li>
        <li>Khi hồ sơ đã được xác minh và xe đủ điều kiện, quay lại website để đăng xe nhanh.</li>
      </ol>
      <AppStoreLinks />
      <button type='button' className={s.refresh} disabled={busy} onClick={onRefresh}>
        <RefreshCw size={17} className={busy ? s.spin : undefined} />{busy ? 'Đang kiểm tra…' : 'Tôi đã hoàn tất, cập nhật trạng thái'}
      </button>
    </div>
  </section>;
}
