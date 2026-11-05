'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Truck } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import RoleSwitchButton from '@/components/account/RoleSwitchButton';
import DriverAppVerification from './DriverAppVerification';
import { onboardingRequest as request } from '@/utils/onboarding-api';
import { PostingError } from '@/utils/posting-api';
import { driverIdentityVerified, driverVerificationLabel, readDriverVehicles, type DriverKycAccess } from '@/utils/driver-web-access';
import { vehicleImage } from '@/utils/catalog-presentation';
import type { RegisteredVehicle } from '@/utils/vehicle-registration';
import s from './Onboarding.module.css';

export default function VehicleWorkspace() {
  const [auth, setAuth] = useState<'loading' | 'login' | 'wrong-role' | 'ready' | 'error'>('loading');
  const [role, setRole] = useState(''), [access, setAccess] = useState<DriverKycAccess>({});
  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]), [error, setError] = useState('');
  const [revision, setRevision] = useState(0), [checking, setChecking] = useState(false);
  useEffect(() => {
    let active = true, running = false;
    const session = localStorage.getItem('txpro_user_session');
    const sameSession = () => session === localStorage.getItem('txpro_user_session') && !!localStorage.getItem('txpro_token');
    async function guarded<T>(path: string): Promise<T> {
      if (!active || !sameSession()) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng đăng nhập hoặc tải lại trang.');
      const result = await request<T>(path);
      if (!active || !sameSession()) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng đăng nhập hoặc tải lại trang.');
      return result;
    }
    async function load() {
      if (running || document.hidden) return;
      running = true; setChecking(true); setError('');
      try {
        if (!localStorage.getItem('txpro_token')) { setVehicles([]); setAuth('login'); return; }
        const me = await guarded<{ user: { role: string } }>('/auth/me');
        if (!active) return;
        setRole(me.user.role);
        if (me.user.role !== 'tai-xe') { setVehicles([]); setAuth('wrong-role'); return; }
        const status = await guarded<DriverKycAccess>('/common/kyc-status');
        const all = driverIdentityVerified(status) ? await readDriverVehicles<RegisteredVehicle>(guarded) : [];
        if (active) { setAccess(status); setVehicles(all); setAuth('ready'); }
      } catch (e) {
        if (active) { setVehicles([]); setError(e instanceof Error ? e.message : 'Không tải được phương tiện.'); setAuth(e instanceof PostingError && e.code === 'LOGIN_REQUIRED' ? 'login' : 'error'); }
      } finally { running = false; if (active) setChecking(false); }
    }
    const refresh = () => { void load(); };
    const accountChanged = () => { if (!sameSession()) { setVehicles([]); setAuth('login'); } };
    void load();
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    window.addEventListener('storage', accountChanged); window.addEventListener('txpro_session_updated', accountChanged);
    return () => { active = false; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('storage', accountChanged); window.removeEventListener('txpro_session_updated', accountChanged); };
  }, [revision]);
  const verified = driverIdentityVerified(access);
  return <><Header /><main className={s.page}>
    <Link className={s.back} href='/tai-xe/dang-tin'><ArrowLeft size={16} />Đăng xe trống</Link>
    <header className={s.heading}><span><Truck size={17} />Tài xế / Phương tiện</span><h1>Phương tiện của bạn</h1><p>Thêm và xác minh phương tiện trên app. Sử dụng xe đã đủ điều kiện để đăng tin nhanh trên website.</p></header>
    {error && <div className={s.error} role='alert'>{error}</div>}
    {auth === 'loading' ? <div className={s.skeleton} aria-label='Đang tải phương tiện' aria-busy='true'><div /><div /></div>
      : auth !== 'ready' ? <section className={s.panel}><h2>{auth === 'login' ? 'Đăng nhập để xem phương tiện' : auth === 'wrong-role' ? 'Chuyển sang vai trò tài xế' : 'Chưa tải được thông tin'}</h2>
        {auth === 'login' ? <Link className={s.primary} href='/login?next=%2Ftai-xe%2Fphuong-tien'>Đăng nhập</Link> : auth === 'wrong-role' ? <RoleSwitchButton currentRole={role} targetRole='tai-xe' returnTo='/tai-xe/phuong-tien' /> : <button className={s.primary} onClick={() => setRevision(v => v + 1)} disabled={checking}>Cập nhật trạng thái</button>}
      </section> : <>
        <DriverAppVerification reason={verified ? 'vehicle' : 'identity'} status={driverVerificationLabel(access)} busy={checking} onRefresh={() => setRevision(v => v + 1)} />
        {verified && <><div className={s.row}><h2>Danh sách phương tiện ({vehicles.length})</h2>{vehicles.some(v => v.status === 'active') && <Link href='/tai-xe/dang-tin' className={s.primary}>Đăng xe trống<ArrowRight size={16} /></Link>}</div>
          {!vehicles.length ? <section className={s.panel}><h2>Chưa có phương tiện</h2><p>Thêm xe và hoàn tất xác minh giấy tờ trên app, sau đó bấm cập nhật trạng thái ở trên.</p></section>
            : <div className={s.vehicleGrid}>{vehicles.map(vehicle => <article key={vehicle.id || vehicle._id} className={s.panel}>
              <Image src={vehicleImage(vehicle.vehicleTypeParent || vehicle.type)} width={190} height={120} alt='' />
              <div className={s.row}><h3>{vehicle.plateNumber}</h3><span className={s.badge}>{vehicle.status === 'active' ? 'Có thể đăng tin' : 'Chưa đủ điều kiện đăng tin'}</span></div>
              <p>{vehicle.type}{vehicle.vehicleTypeChild ? ' · ' + vehicle.vehicleTypeChild : ''}</p>
              <p>{vehicle.brand}{vehicle.capacity ? ' · ' + (vehicle.capacityMin || 0) + '–' + vehicle.capacity + ' tấn' : ''}{vehicle.seats ? ' · ' + vehicle.seats + ' chỗ' : ''}</p>
              <p className={s.hint}>Cập nhật thông tin và giấy tờ xe trên ứng dụng TXE PRO.</p>
            </article>)}</div>}
        </>}
      </>}
  </main><Footer /></>;
}
