'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileText, Phone, Mail, Clock, MapPin } from 'lucide-react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import SubpageHeroBanner from '@/components/common/SubpageHeroBanner';
import SubpageCtaBanner from '@/components/common/SubpageCtaBanner';
import { useLanguage } from '@/context/LanguageContext';
import { useCompanyInfo } from '@/context/CompanyInfoContext';
import { getHelpArticles } from '@/lib/help-content';
import { phoneLink, supportPhone } from '@/utils/companyInfo';

export default function InfoPage() {
  const params = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const c = (vi: string, en: string, zh: string) => language === 'en' ? en : language === 'zh' ? zh : vi;
  const pages = {
    'gioi-thieu': { title: c('Giới thiệu TXE PRO', 'About TXE PRO', '关于 TXE PRO'), intro: c('Kết nối nhu cầu tìm xe và phương tiện sẵn sàng cho hành trình của bạn.', 'Connecting transport needs with vehicle availability for your journey.', '连接出行需求与可用车辆。'), ids: ['find-vehicle', 'multiple-listings', 'track-trip'] },
    'quy-che-hoat-dong': { title: c('Quy chế hoạt động', 'How the platform works', '平台运行规则'), intro: c('Chọn đúng vai trò, kiểm tra thông tin và xác nhận từng bước theo trạng thái thực tế của đơn.', 'Use the right role, review details and confirm each step according to the actual order state.', '选择正确角色，核对资料并按实际订单状态确认各步骤。'), ids: ['switch-role', 'find-vehicle', 'deposit-holds', 'cancel-trip', 'incident-response'] },
    'huong-dan-chu-hang': { title: c('Hướng dẫn chủ hàng', 'Shipper guide', '货主指南'), intro: c('Từ đăng tìm xe đến kiểm tra và hoàn tất chuyến đi.', 'From posting a search to reviewing and completing your trip.', '从发布需求到核对和完成行程。'), ids: ['find-vehicle', 'track-trip', 'location-change', 'delivery-confirmation'] },
    'huong-dan-tai-xe': { title: c('Hướng dẫn tài xế', 'Driver guide', '司机指南'), intro: c('Hoàn thiện hồ sơ, thêm xe, đăng tin và thực hiện các chuyến đã nhận.', 'Complete your profile, register vehicles, post availability and carry out accepted trips.', '完善资料、登记车辆、发布空车并履行已接行程。'), ids: ['driver-onboarding', 'multiple-listings', 'automatic-posting', 'arrival-gps', 'driver-completion'] },
    'thanh-toan-ky-quy': { title: c('Ví, voucher và ký quỹ', 'Wallet, vouchers and deposits', '钱包、优惠券与保证金'), intro: c('Xem thông tin hệ thống hiển thị cho từng giao dịch. Ký quỹ không phải toàn bộ tiền cước.', 'Review the system details for each transaction. A deposit is not the full trip fare.', '请核对系统显示的每笔交易明细。保证金不是全部车费。'), ids: ['deposit-holds', 'trip-fee', 'mb-topup', 'motorcycle-fee', 'promotional-wallet'] },
    'khieu-nai-boi-thuong': { title: c('Sự cố và hỗ trợ xử lý', 'Incidents and resolution support', '事件与处理支持'), intro: c('Báo cáo sự cố và hủy đơn là hai quy trình riêng. Xem hướng dẫn và trạng thái của đúng hồ sơ.', 'Incident reports and cancellations are separate processes. Check the correct case and its current state.', '事件报告与取消订单为不同流程，请查看对应记录及当前状态。'), ids: ['report-incident', 'incident-response', 'cancel-trip'] },
  };
  const key = params?.slug as keyof typeof pages;
  const page = pages[key] || pages['gioi-thieu'];
  const articles = getHelpArticles(language).filter(article => page.ids.includes(article.id));
  const phone = supportPhone(companyInfo), email = companyInfo.emailSupport || companyInfo.emailGeneral;
  return <><Header /><main className='bg-slate-50 pt-20 pb-12 text-slate-800'>
    <SubpageHeroBanner title={page.title} subtitle={page.intro} badge='TXE PRO' />
    <div className='relative mx-auto -mt-6 max-w-5xl px-5 pb-10'>
      <div className='rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm'>
        <Link href='/tro-giup' className='inline-flex items-center gap-2 text-sm font-semibold text-primary-700'><ArrowLeft size={16} />{c('Trung tâm trợ giúp', 'Help center', '帮助中心')}</Link>
        <header className='my-7 flex items-start gap-4 border-b border-slate-100 pb-7'><FileText size={26} className='mt-1 shrink-0 text-primary-600' /><div><h1 className='text-2xl font-bold tracking-tight text-slate-900'>{page.title}</h1><p className='mt-3 text-sm leading-7 text-slate-600'>{page.intro}</p></div></header>
        <div className='space-y-8'>{articles.map((article, index) => <section key={article.id} className='rounded-xl border border-slate-200 bg-slate-50/50 p-5 sm:p-7'><h2 className='text-lg font-bold leading-7 text-slate-900'><span className='mr-2 text-primary-600'>{index + 1}.</span>{article.question}</h2>{article.paragraphs.map(text => <p key={text} className='mt-4 text-sm leading-7 text-slate-600'>{text}</p>)}{article.href && <Link href={article.href} className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700'>{article.action}<ArrowRight size={15} /></Link>}</section>)}</div>
        <section className='mt-9 rounded-xl border border-slate-200 p-6'><h2 className='text-lg font-bold'>{c('Thông tin liên hệ chính thức', 'Official contact details', '官方联系资料')}</h2>{companyInfo.companyName && <p className='mt-3 text-sm font-semibold'>{companyInfo.companyName}</p>}<div className='mt-4 space-y-3 text-sm leading-7 text-slate-600'>
          {phone && <a className='flex items-center gap-2 text-primary-700' href={phoneLink(phone)}><Phone size={16} />{phone}</a>}
          {email && <a className='flex items-center gap-2 text-primary-700' href={'mailto:' + email}><Mail size={16} />{email}</a>}
          {companyInfo.workingHours && <p className='flex items-start gap-2'><Clock size={16} className='mt-1 shrink-0' />{companyInfo.workingHours}</p>}
          {companyInfo.supportResponseTime && <p>{companyInfo.supportResponseTime}</p>}
          {[['officePrimaryLabel', 'addressHcm'], ['officeSecondaryLabel', 'addressHn']].map(([label, address]) => companyInfo[address as 'addressHcm' | 'addressHn'] && <p key={address} className='flex items-start gap-2'><MapPin size={16} className='mt-1 shrink-0' />{[companyInfo[label as 'officePrimaryLabel' | 'officeSecondaryLabel'], companyInfo[address as 'addressHcm' | 'addressHn']].filter(Boolean).join(': ')}</p>)}
          <Link href='/thong-tin/lien-he' className='inline-flex items-center gap-2 font-semibold text-primary-700'>{c('Gửi yêu cầu liên hệ', 'Contact support', '联系支持')}<ArrowRight size={15} /></Link>
        </div></section>
      </div>
    </div><SubpageCtaBanner />
  </main><Footer /></>;
}
