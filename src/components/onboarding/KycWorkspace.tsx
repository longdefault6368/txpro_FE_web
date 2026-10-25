'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, IdCard, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { onboardingRequest, privateDocumentBlob } from '@/utils/onboarding-api';
import { createKycFlow, type KycFiles, type KycFileKey, type KycSubmission } from '@/utils/kyc-flow';
import s from './Onboarding.module.css';

type Profile = { id?: string; _id?: string; role: string; kycStatus?: string; name?: string };
const labels: Record<string, string> = { verified: 'Đã xác minh', pending_review: 'Đang chờ duyệt', rejected: 'Chưa được duyệt', not_started: 'Chưa hoàn tất', missing_documents: 'Thiếu giấy tờ', draft: 'Chưa gửi', auto_verified: 'Đã xác minh', manual_review: 'Đang chờ duyệt' };
const fields = [['cccdFront', 'Mặt trước CCCD'], ['cccdBack', 'Mặt sau CCCD'], ['portrait', 'Ảnh chân dung']] as const;

export default function KycWorkspace() {
  const [profile, setProfile] = useState<Profile | null>(null), [latest, setLatest] = useState<KycSubmission | null>(null);
  const [files, setFiles] = useState<KycFiles>({}), [previews, setPreviews] = useState<Partial<Record<KycFileKey, string>>>({});
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [next, setNext] = useState('/user?tab=profile'), [resume, setResume] = useState(true);
  const flow = useRef<ReturnType<typeof createKycFlow> | null>(null), lock = useRef(false), urls = useRef(new Set<string>()), alive = useRef(true);
  const session = useRef<string | null>(null);
  const sameSession = () => localStorage.getItem('txpro_user_session') === session.current && !!localStorage.getItem('txpro_token');
  async function request<T>(path: string, options?: RequestInit, authenticated = true): Promise<T> {
    if (!sameSession()) throw new Error('Tài khoản đã thay đổi. Vui lòng tải lại trang.');
    const result = await onboardingRequest<T>(path, options, authenticated);
    if (!sameSession()) throw new Error('Tài khoản đã thay đổi. Vui lòng tải lại trang.');
    return result;
  };
  async function refresh() {
    setError(''); setLoading(true);
    try {
      const p = await request<{ user: Profile }>('/auth/profile');
      const data = await request<{ submission: KycSubmission | null }>('/kyc/submissions/latest');
      if (!alive.current) return;
      setProfile(p.user); setLatest(data.submission); setResume(Object.keys(files).length === 0);
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Không tải được hồ sơ.'); }
    finally { if (alive.current) setLoading(false); }
  }
  useEffect(() => {
    alive.current = true; session.current = localStorage.getItem('txpro_user_session');
    const value = new URLSearchParams(window.location.search).get('next');
    if (value && ['/tai-xe/phuong-tien', '/tai-xe/dang-tin'].includes(value)) setNext(value);
    const accountChanged = () => {
      if (sameSession()) return;
      urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear();
      setProfile(null); setLatest(null); setFiles({}); setPreviews({}); flow.current = null;
      setError('Phiên tài khoản đã thay đổi. Vui lòng đăng nhập hoặc tải lại trang.');
    };
    window.addEventListener('storage', accountChanged); window.addEventListener('txpro_session_updated', accountChanged);
    void refresh();
    return () => { alive.current = false; window.removeEventListener('storage', accountChanged); window.removeEventListener('txpro_session_updated', accountChanged); urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); };
    // This page is tied to the account captured at mount; do not silently reuse its documents for another login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const eligibility = latest?.verificationEligibility || profile?.kycStatus || 'not_started';
  const verified = eligibility === 'verified' || profile?.kycStatus === 'verified';
  const pending = eligibility === 'pending_review';
  const selectFile = (field: KycFileKey, file?: File) => {
    if (!file || lock.current) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size <= 0 || file.size > 8 * 1024 * 1024) { setError('Chọn ảnh JPG hoặc PNG, tối đa 8 MB.'); return; }
    const old = previews[field]; if (old) { URL.revokeObjectURL(old); urls.current.delete(old); }
    const url = URL.createObjectURL(file); urls.current.add(url);
    setFiles(current => ({ ...current, [field]: file })); setPreviews(current => ({ ...current, [field]: url }));
    flow.current = null; setResume(false); setError(''); setMessage('');
  };
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current || !profile || verified || pending) return;
    if (!['tai-xe', 'chu-hang'].includes(profile.role)) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      flow.current ||= createKycFlow(request, crypto.randomUUID());
      const submission = await flow.current.run(files, profile.role as 'tai-xe' | 'chu-hang', resume ? latest : null);
      if (!alive.current) return;
      setLatest(submission); setProfile(p => p ? { ...p, kycStatus: submission.verificationEligibility } : p);
      setMessage(submission.verificationEligibility === 'verified' ? 'Xác minh thành công. Bạn có thể tiếp tục.' : submission.verificationEligibility === 'rejected' ? 'Hồ sơ chưa được duyệt. Xem lý do và cung cấp lại ảnh phù hợp.' : 'Đã gửi hồ sơ. Vui lòng chờ kết quả xét duyệt.');
    } catch (e) { if (alive.current) setError((e as { uncertain?: boolean }).uncertain ? 'Chưa xác định được kết quả xác minh. Bấm cập nhật trạng thái trước; hồ sơ và lượt OCR hiện tại được giữ để kiểm tra lại, không tạo lượt quét mới.' : e instanceof Error ? e.message : 'Chưa gửi được hồ sơ.'); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function preview(field: KycFileKey) {
    const path = latest?.documents?.[field]?.previewUrl; if (!path || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { const blob = await privateDocumentBlob(path); if (!sameSession() || !alive.current) return; const old = previews[field]; if (old) URL.revokeObjectURL(old); const url = URL.createObjectURL(blob); urls.current.add(url); setPreviews(current => ({ ...current, [field]: url })); }
    catch { setError('Không tải được ảnh giấy tờ. Vui lòng thử lại.'); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return <><Header /><main className={s.page}>
    <Link className={s.back} href='/user'><ArrowLeft size={16} />Tài khoản của tôi</Link>
    <header className={s.heading}><span><ShieldCheck size={17} />Xác minh danh tính</span><h1>Hồ sơ eKYC</h1><p>Chuẩn bị CCCD hai mặt và ảnh chân dung rõ nét. Thông tin được kiểm tra trước khi mở quyền dành cho tài xế.</p></header>
    {error && <div role='alert' className={s.error}>{error}</div>}{message && <div role='status' className={s.notice}>{message}</div>}
    {loading ? <div className={s.skeleton} aria-label='Đang tải hồ sơ' aria-busy='true'><div /><div /><div /></div> : !profile ? <section className={s.panel}><h2>Đăng nhập để xác minh</h2><Link className={s.primary} href={'/login?next=' + encodeURIComponent('/user/ekyc' + (next === '/user?tab=profile' ? '' : '?next=' + encodeURIComponent(next)))}>Đăng nhập</Link></section> : <div className={s.layout}>
      <section className={s.panel}><div className={s.row}><h2><IdCard size={21} />Giấy tờ xác minh</h2><span className={s.badge}>{labels[eligibility] || eligibility}</span></div>
        {profile.role === 'chu-hang' && <p className={s.notice}>Chủ hàng có thể tìm xe và đặt chuyến mà không bắt buộc eKYC. Xác minh này là tùy chọn, hoặc để sử dụng vai trò tài xế.</p>}
        {verified ? <div className={s.success}><CheckCircle2 size={36} /><h2>Tài khoản đã xác minh</h2><p>Tiếp tục thêm phương tiện hoặc đăng tin theo vai trò của bạn.</p><Link href={next === '/user?tab=profile' && profile.role === 'tai-xe' ? '/tai-xe/phuong-tien' : next} className={s.primary}>Tiếp tục<ArrowRight size={17} /></Link></div> : pending ? <div className={s.notice}><h3>Đang chờ xét duyệt</h3><p>Hồ sơ đã được ghi nhận. Bạn không cần quét lại trong khi chờ kết quả.</p></div> : profile.role !== 'admin' && <form onSubmit={submit}><fieldset disabled={busy}><div className={s.uploadGrid}>{fields.map(([field, title]) => <label className={s.upload} key={field}><strong>{title} *</strong>{previews[field] ? <img src={previews[field]} alt={title} /> : <IdCard size={31} />}<span>Chọn ảnh hoặc chụp ảnh</span><input type='file' accept='image/jpeg,image/png' onChange={e => selectFile(field, e.target.files?.[0])} /></label>)}</div><p className={s.hint}>JPG, PNG · Tối đa 8 MB/ảnh · Chân dung không che mặt, giấy tờ đủ bốn góc.</p><button type='submit' className={s.primary}>{busy ? <Loader2 className={s.spin} size={17} /> : <ShieldCheck size={17} />}{resume && latest?.status === 'draft' ? 'Tiếp tục gửi hồ sơ đã quét' : 'Xác minh giấy tờ'}</button></fieldset></form>}
        {latest?.review?.rejectionReason && <p className={s.error}>{latest.review.rejectionReason}</p>}
        <button className={s.secondary} type='button' disabled={busy || loading} onClick={() => void refresh()}><RefreshCw size={16} />Cập nhật trạng thái</button>
      </section><aside className={s.panel}><h2>Hồ sơ gần nhất</h2><p>Trạng thái: <strong>{labels[eligibility] || eligibility}</strong></p>{latest?.identity && <dl className={s.details}>{[['Họ tên', 'fullName'], ['Số CCCD', 'idNumber'], ['Ngày sinh', 'dateOfBirth'], ['Địa chỉ', 'permanentAddress']].map(([title, key]) => latest.identity?.[key] ? <div key={key}><dt>{title}</dt><dd>{latest.identity[key]}</dd></div> : null)}</dl>}<div className={s.buttons}>{fields.map(([field, title]) => latest?.documents?.[field]?.previewUrl && <button key={field} type='button' className={s.secondary} disabled={busy} onClick={() => void preview(field)}>Xem {title.toLowerCase()}</button>)}</div><Link href='/thong-tin/lien-he' className={s.back}>Cần hỗ trợ hồ sơ?<ArrowRight size={15} /></Link></aside>
    </div>}
  </main><Footer /></>;
}
