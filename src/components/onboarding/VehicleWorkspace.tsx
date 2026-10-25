'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, ScanLine, Truck, X } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import RoleSwitchButton from '@/components/account/RoleSwitchButton';
import { onboardingRequest as request } from '@/utils/onboarding-api';
import { getVehicleCapabilities } from '@/utils/vehicleCapabilities';
import { readPostingPage, vehicleGroup, type PostingOptions, type PostingPage } from '@/utils/posting-contract';
import { cargoChoice, vehicleImage } from '@/utils/catalog-presentation';
import { buildVehicleRegistration, type RegisteredVehicle, type VehicleForm, type VehicleImages, type VehicleVerification } from '@/utils/vehicle-registration';
import { getServerMediaUrl } from '@/utils/media';
import s from './Onboarding.module.css';

type PhotoKey = 'registrationFront' | 'registrationBack' | 'vehicleFront' | 'vehicleSide';
type Photos = Partial<Record<PhotoKey, File>>;
const empty: VehicleForm = { type: '', child: '', brand: '', seats: '', min: '0', max: '10', cargo: [] };
const photoFields = [['registrationFront', 'Cà vẹt mặt trước'], ['registrationBack', 'Cà vẹt mặt sau'], ['vehicleFront', 'Ảnh xe mặt trước'], ['vehicleSide', 'Ảnh xe mặt ngang']] as const;

export default function VehicleWorkspace() {
  const [auth, setAuth] = useState<'loading' | 'login' | 'wrong-role' | 'kyc' | 'ready' | 'error'>('loading'), [role, setRole] = useState('');
  const [options, setOptions] = useState<PostingOptions | null>(null), [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
  const [editing, setEditing] = useState<RegisteredVehicle | null>(null), [open, setOpen] = useState(false), [form, setForm] = useState<VehicleForm>(empty);
  const [photos, setPhotos] = useState<Photos>({}), [previews, setPreviews] = useState<Partial<Record<PhotoKey, string>>>({});
  const [verification, setVerification] = useState<VehicleVerification | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [progress, setProgress] = useState('');
  const [uncertain, setUncertain] = useState(false), [removing, setRemoving] = useState<RegisteredVehicle | null>(null);
  const lock = useRef(false), cache = useRef(new Map<File, string>()), attempt = useRef<{ id: string; signature: string } | null>(null), urls = useRef(new Set<string>()), alive = useRef(true), session = useRef<string | null>(null);
  const scanAbort = useRef<AbortController | null>(null);
  const currentSession = () => session.current === localStorage.getItem('txpro_user_session') && !!localStorage.getItem('txpro_token');
  async function guarded<T>(path: string, options?: RequestInit, authenticated = true): Promise<T> {
    if (!currentSession()) throw new Error('Tài khoản đã thay đổi. Vui lòng tải lại trang.');
    const result = await request<T>(path, options, authenticated);
    if (!currentSession()) throw new Error('Tài khoản đã thay đổi. Vui lòng tải lại trang.');
    return result;
  }
  async function list() {
    const all: RegisteredVehicle[] = [];
    for (let page = 1; page <= 100; page++) {
      const data = await guarded<RegisteredVehicle[] | PostingPage<RegisteredVehicle>>('/tai-xe/vehicles?paginated=true&limit=100&page=' + page);
      const result = readPostingPage(data, 100); all.push(...result.items); if (!result.hasMore) break;
    }
    if (alive.current) setVehicles(all);
  }
  useEffect(() => {
    alive.current = true; session.current = localStorage.getItem('txpro_user_session');
    async function load() {
      try {
        if (!localStorage.getItem('txpro_token')) { setAuth('login'); return; }
        const me = await guarded<{ user: { role: string; kycStatus?: string; kycSummary?: { verificationEligibility?: string } } }>('/auth/me');
        if (!alive.current) return; setRole(me.user.role);
        if (me.user.role !== 'tai-xe') { setAuth('wrong-role'); return; }
        const access = await guarded<{ kycStatus: string; verificationEligibility: string }>('/common/kyc-status');
        if (!alive.current) return;
        if (access.kycStatus !== 'verified' && access.verificationEligibility !== 'verified') { setAuth('kyc'); return; }
        const catalog = await guarded<PostingOptions>('/chu-hang/find-vehicle/options', {}, false);
        await list(); if (alive.current) { setOptions(catalog); setAuth('ready'); }
      } catch (e) { if (alive.current) { setError(e instanceof Error ? e.message : 'Không tải được phương tiện.'); setAuth('error'); } }
    }
    const accountChanged = () => {
      if (currentSession()) return;
      scanAbort.current?.abort();
      urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); cache.current.clear(); attempt.current = null;
      setVehicles([]); setPhotos({}); setPreviews({}); setVerification(null); setEditing(null); setForm(empty); setOpen(false); setAuth('error');
      setError('Phiên tài khoản đã thay đổi. Vui lòng tải lại trang.');
    };
    window.addEventListener('storage', accountChanged); window.addEventListener('txpro_session_updated', accountChanged);
    void load(); return () => { alive.current = false; scanAbort.current?.abort(); window.removeEventListener('storage', accountChanged); window.removeEventListener('txpro_session_updated', accountChanged); urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const caps = getVehicleCapabilities({ type: form.type, vehicleTypeParent: form.type, vehicleTypeChild: form.child });
  const needsCapacity = caps.hasCapacity && caps.category !== 'construction';
  const group = vehicleGroup(form.type);
  const children = group === 'container' ? options?.containerTypes : group === 'construction' ? options?.constructionVehicleTypes : [];
  function start(vehicle: RegisteredVehicle | null = null) {
    if (lock.current) return;
    urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear();
    setEditing(vehicle); setForm(vehicle ? { type: vehicle.vehicleTypeParent || vehicle.type, child: vehicle.vehicleTypeChild || '', brand: vehicle.brand || '', seats: String(vehicle.seats || ''), min: String(vehicle.capacityMin ?? 0), max: String(vehicle.capacityMax ?? vehicle.capacity ?? 10), cargo: vehicle.cargoTypes || [] } : empty);
    setPhotos({}); setPreviews({}); setVerification(null); cache.current.clear(); attempt.current = null; setUncertain(false); setOpen(true); setError(''); setMessage(''); setProgress('');
  }
  function selectPhoto(key: PhotoKey, file?: File) {
    if (!file || lock.current || uncertain) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) { setError('Chọn ảnh JPG hoặc PNG, tối đa 5 MB mỗi ảnh.'); return; }
    if (previews[key]) { URL.revokeObjectURL(previews[key]!); urls.current.delete(previews[key]!); }
    const url = URL.createObjectURL(file); urls.current.add(url); setPhotos(old => ({ ...old, [key]: file })); setPreviews(old => ({ ...old, [key]: url }));
    if (key === 'registrationFront' || key === 'registrationBack') setVerification(null);
    setError('');
  }
  async function scan() {
    if (lock.current || !photos.registrationFront || uncertain) return;
    lock.current = true; setBusy(true); setError(''); setVerification(null);
    scanAbort.current = new AbortController();
    try {
      const { readRegistrationPlate } = await import('@/utils/browser-registration-ocr');
      const ocr = await readRegistrationPlate(photos.registrationFront, value => { if (alive.current) setProgress(value); }, scanAbort.current.signal);
      if (!alive.current || !currentSession()) return;
      const body = new FormData(); body.append('registrationFront', photos.registrationFront); if (photos.registrationBack) body.append('registrationBack', photos.registrationBack); body.append('deviceOcr', JSON.stringify(ocr));
      const result = await guarded<{ verification: VehicleVerification }>('/tai-xe/vehicles/registration/verify', { method: 'POST', body });
      if (!result?.verification?.plateNumber || !result.verification.verificationToken) throw new Error('Máy chủ chưa xác nhận được biển số.');
      if (editing && result.verification.plateNumber.replace(/[^A-Z0-9]/gi, '') !== editing.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '')) throw new Error('Cà vẹt không khớp biển số xe đang sửa.');
      if (!alive.current) return;
      setVerification(result.verification); setProgress('Đã đọc biển số ' + result.verification.plateNumber + '. Kiểm tra thông tin còn lại trước khi lưu.');
      if (result.verification.brand) setForm(old => ({ ...old, brand: old.brand || result.verification.brand || '' }));
    } catch (e) { if (alive.current) { setError(e instanceof Error ? e.message : 'Không đọc được biển số.'); setProgress(''); } }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function upload(file: File): Promise<string> {
    const saved = cache.current.get(file); if (saved) return saved;
    const body = new FormData(); body.append('image', file);
    const result = await guarded<{ url?: string; path?: string; imageUrl?: string }>('/tai-xe/vehicles/image', { method: 'POST', body });
    const path = result.url || result.path || result.imageUrl; if (!path) throw new Error('Chưa nhận đường dẫn ảnh đã tải.'); cache.current.set(file, path); return path;
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (lock.current || !options) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const registrationChanged = !!photos.registrationFront || !!photos.registrationBack;
      if (registrationChanged && !verification) throw new Error('Quét lại cà vẹt sau khi thay ảnh giấy tờ.');
      const old = editing?.imageGroups;
      const placeholders: VehicleImages = { vehicleFronts: photos.vehicleFront ? ['front'] : old?.vehicleFronts || [], vehicleSides: photos.vehicleSide ? ['side'] : old?.vehicleSides || [], registrationFrontPath: photos.registrationFront ? 'registration' : old?.registrationFrontPath || '', registrationBackPath: photos.registrationBack ? 'back' : old?.registrationBackPath };
      buildVehicleRegistration(form, placeholders, verification, 'validation-only', editing);
      const images: VehicleImages = { vehicleFronts: photos.vehicleFront ? [await upload(photos.vehicleFront)] : old?.vehicleFronts || [], vehicleSides: photos.vehicleSide ? [await upload(photos.vehicleSide)] : old?.vehicleSides || [], registrationFrontPath: photos.registrationFront ? await upload(photos.registrationFront) : old?.registrationFrontPath || '', registrationBackPath: photos.registrationBack ? await upload(photos.registrationBack) : old?.registrationBackPath };
      const signature = JSON.stringify({ form, images, plate: verification?.plateNumber });
      if (!attempt.current || attempt.current.signature !== signature) attempt.current = { id: crypto.randomUUID(), signature };
      const payload = buildVehicleRegistration(form, images, verification, attempt.current.id, editing);
      const result = await guarded<{ vehicle: RegisteredVehicle }>(editing ? '/tai-xe/vehicles/' + editing.id : '/tai-xe/vehicles', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!result?.vehicle?.id) throw Object.assign(new Error('Chưa nhận được mã phương tiện. Kiểm tra danh sách trước khi gửi lại.'), { uncertain: true });
      if (!alive.current) return;
      setOpen(false); setUncertain(false); setMessage(editing ? 'Đã cập nhật phương tiện.' : 'Đã thêm phương tiện. Bạn có thể đăng xe trống.'); await list();
    } catch (e) { if (alive.current) { setUncertain((e as { uncertain?: boolean }).uncertain === true); setError((e as { uncertain?: boolean }).uncertain ? 'Chưa rõ kết quả lưu. Kiểm tra danh sách hoặc bấm lưu lại cùng hồ sơ; mã yêu cầu cũ được giữ để tránh tạo xe trùng.' : e instanceof Error ? e.message : 'Không lưu được phương tiện.'); } }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function remove() {
    if (!removing || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await guarded('/tai-xe/vehicles/' + removing.id, { method: 'DELETE' }); setRemoving(null); await list(); setMessage('Đã xóa phương tiện khỏi danh sách hoạt động.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Chưa xóa được xe.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <><Header /><main className={s.page}>
    <Link className={s.back} href='/tai-xe/dang-tin'><ArrowLeft size={16} />Đăng xe trống</Link>
    <header className={s.heading}><span><Truck size={17} />Tài xế / Phương tiện</span><h1>Quản lý phương tiện</h1><p>Đăng ký đúng xe, giữ giấy tờ rõ ràng và sử dụng cùng danh sách phương tiện với ứng dụng.</p></header>
    {error && <div className={s.error} role='alert'>{error}</div>}{message && <div className={s.notice} role='status'>{message}</div>}
    {auth === 'loading' ? <div className={s.skeleton} aria-label='Đang tải phương tiện' aria-busy='true'><div /><div /><div /></div> : auth !== 'ready' ? <section className={s.panel}><h2>{auth === 'login' ? 'Đăng nhập để quản lý xe' : auth === 'wrong-role' ? 'Chuyển sang vai trò tài xế' : auth === 'kyc' ? 'Hoàn thiện xác minh danh tính' : 'Chưa tải được thông tin'}</h2><p>Tài xế cần xác minh danh tính trước khi thêm xe và đăng xe trống.</p><div className={s.buttons}>{auth === 'login' ? <Link className={s.primary} href='/login?next=%2Ftai-xe%2Fphuong-tien'>Đăng nhập</Link> : auth === 'wrong-role' ? <RoleSwitchButton currentRole={role} targetRole='tai-xe' returnTo='/tai-xe/phuong-tien' /> : auth === 'kyc' ? <Link className={s.primary} href='/user/ekyc?next=%2Ftai-xe%2Fphuong-tien'>Xác minh eKYC<ArrowRight size={16} /></Link> : <button className={s.primary} onClick={() => window.location.reload()}>Thử lại</button>}</div></section> : <>
      <div className={s.row}><h2>Phương tiện của bạn ({vehicles.length})</h2><div className={s.buttons}><button type='button' disabled={busy} className={s.primary} onClick={() => start()}><Plus size={17} />Thêm phương tiện</button><Link href='/tai-xe/dang-tin' className={s.secondary}>Đăng xe trống<ArrowRight size={16} /></Link></div></div>
      {open && <section className={s.panel}><div className={s.row}><h2>{editing ? 'Cập nhật phương tiện' : 'Thêm phương tiện'}</h2><button type='button' className={s.secondary} disabled={busy} onClick={() => setOpen(false)}><X size={16} />Đóng</button></div>
        <form onSubmit={save}><fieldset disabled={busy || uncertain}>
          <h3>1. Ảnh xe và giấy tờ</h3><p className={s.hint}>Cà vẹt hai mặt, xe mặt trước và mặt ngang. JPG/PNG, tối đa 5 MB/ảnh. Khi sửa xe, có thể giữ nguyên ảnh đã lưu.</p><div className={s.uploadGrid}>{photoFields.map(([key, title]) => { const old = editing?.imageGroups; const path = key === 'registrationFront' ? old?.registrationFrontPath : key === 'registrationBack' ? old?.registrationBackPath : key === 'vehicleFront' ? old?.vehicleFronts?.[0] : old?.vehicleSides?.[0]; const preview = previews[key] || getServerMediaUrl(path); return <label key={key} className={s.upload}><strong>{title}{!editing && ' *'}</strong>{preview ? <img src={preview} alt={title} /> : <Truck size={31} />}<span>Chọn ảnh hoặc chụp ảnh</span><input type='file' accept='image/jpeg,image/png' onChange={event => selectPhoto(key, event.target.files?.[0])} /></label>; })}</div>
          <div className={s.buttons}><button type='button' className={s.secondary} disabled={!photos.registrationFront} onClick={() => void scan()}><ScanLine size={17} />Đọc biển số từ cà vẹt</button><span className={s.badge}>{verification?.plateNumber || editing?.plateNumber || 'Chưa đọc biển số'}</span></div>{progress && <p role='status' className={s.hint}>{progress}</p>}
          <h3>2. Thông tin phương tiện</h3><div className={s.grid}><label>Loại phương tiện *<select value={form.type} required onChange={e => setForm(old => ({ ...old, type: e.target.value, child: '', seats: '', min: '0', max: '10', cargo: [] }))}><option value=''>Chọn loại xe</option>{[...new Set([...options!.vehicleTypes, ...(editing ? [editing.vehicleTypeParent || editing.type] : [])])].map(type => <option key={type} value={type}>{type}</option>)}</select></label>
          {!!children?.length && <label>Loại xe chi tiết<select value={form.child} onChange={e => setForm(old => ({ ...old, child: e.target.value }))}><option value=''>Chọn loại xe</option>{children.map(value => <option key={value}>{value}</option>)}</select></label>}
          <label>Hãng / tên xe *<input value={form.brand} required maxLength={100} onChange={e => setForm(old => ({ ...old, brand: e.target.value }))} /></label>
          {caps.hasSeats && <label>Số chỗ *<select required value={form.seats} onChange={e => setForm(old => ({ ...old, seats: e.target.value, child: options!.seatTypes.find(raw => Number(raw.match(/\d+/)?.[0]) === Number(e.target.value)) || '' }))}><option value=''>Chọn số chỗ</option>{options!.seatTypes.map(raw => <option key={raw} value={Number(raw.match(/\d+/)?.[0])}>{raw}</option>)}</select></label>}
          {needsCapacity && <><label>Tải trọng từ (tấn) *<input required type='number' min='0' max={form.max || 200} step='0.1' value={form.min} onChange={e => setForm(old => ({ ...old, min: e.target.value }))} /></label><label>Đến (tấn) *<input required type='number' min='0.1' max='200' step='0.1' value={form.max} onChange={e => setForm(old => ({ ...old, max: e.target.value }))} /></label></>}
          </div>
          {caps.hasCargoTypes && <><h3>HÀNG HÓA MUỐN CHỞ *</h3><div className={s.cargoGrid}>{options!.cargoTypes.map(raw => { const choice = cargoChoice(raw, 'vi'), selected = form.cargo.includes(raw); return <button type='button' aria-pressed={selected} key={raw} className={selected ? s.selectedCargo : ''} onClick={() => setForm(old => ({ ...old, cargo: selected ? old.cargo.filter(v => v !== raw) : [...old.cargo, raw] }))}><Image src={choice.image} alt='' width={80} height={60} /><span>{choice.title}</span>{selected && <Check size={15} />}</button>; })}</div></>}
        </fieldset><div className={s.formBottom}><p className={s.hint}>Biển số lấy từ OCR và không cho sửa. Loại xe và các thông tin khác có thể điều chỉnh.</p><button type='submit' className={s.primary} disabled={busy}>{busy && <Loader2 size={17} className={s.spin} />}{uncertain ? 'Kiểm tra và lưu lại hồ sơ' : editing ? 'Lưu thay đổi' : 'Lưu phương tiện'}</button></div></form>
      </section>}
      {!vehicles.length && !open ? <section className={s.panel}><h2>Chưa có phương tiện</h2><p>Thêm xe cùng cà vẹt để bắt đầu đăng xe trống.</p><button className={s.primary} onClick={() => start()}><Plus size={17} />Thêm xe đầu tiên</button></section> : <div className={s.vehicleGrid}>{vehicles.map(vehicle => <article key={vehicle.id} className={s.panel}><Image src={vehicleImage(vehicle.vehicleTypeParent || vehicle.type)} width={190} height={120} alt='' /><div className={s.row}><h3>{vehicle.plateNumber}</h3><span className={s.badge}>{vehicle.status === 'active' ? 'Hoạt động' : vehicle.status || 'Chưa hoạt động'}</span></div><p>{vehicle.type}{vehicle.vehicleTypeChild ? ' · ' + vehicle.vehicleTypeChild : ''}</p><p>{vehicle.brand}{vehicle.capacity ? ' · ' + (vehicle.capacityMin || 0) + '–' + vehicle.capacity + ' tấn' : ''}{vehicle.seats ? ' · ' + vehicle.seats + ' chỗ' : ''}</p><div className={s.buttons}><button type='button' className={s.secondary} disabled={busy} onClick={() => start(vehicle)}>Chỉnh sửa</button><button type='button' className={s.danger} disabled={busy} onClick={() => setRemoving(vehicle)}>Xóa</button></div></article>)}</div>}
      {removing && <section className={s.panel} role='alert'><h2>Xóa phương tiện {removing.plateNumber}?</h2><p>Phương tiện sẽ rời danh sách xe hoạt động. Hệ thống kiểm tra các chuyến và tin liên quan trước khi xử lý.</p><div className={s.buttons}><button disabled={busy} onClick={() => setRemoving(null)} className={s.secondary}>Quay lại</button><button disabled={busy} onClick={() => void remove()} className={s.danger}>Xác nhận xóa</button></div></section>}
    </>}
  </main><Footer /></>;
}
