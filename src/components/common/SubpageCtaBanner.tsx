'use client';
import Link from 'next/link';
import { ArrowRight, Phone, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCompanyInfo } from '@/context/CompanyInfoContext';
import { supportPhone, phoneLink } from '@/utils/companyInfo';
import AppStoreLinks from './AppStoreLinks';
export default function SubpageCtaBanner() {
  const { language } = useLanguage(), { companyInfo } = useCompanyInfo();
  const c = (vi: string, en: string, zh: string) => language === 'en' ? en : language === 'zh' ? zh : vi;
  const phone = supportPhone(companyInfo);
  return <section className='bg-slate-50 px-5 py-12'><div className='mx-auto grid max-w-6xl gap-8 rounded-3xl bg-[#09223e] p-7 text-white sm:p-10 lg:grid-cols-2'>
    <div><span className='text-xs font-semibold text-blue-200'>TXE PRO</span><h2 className='mt-4 text-2xl font-bold leading-snug sm:text-3xl'>{c('Kết nối cho hành trình tiếp theo', 'Connect with your next journey', '连接下一段行程')}</h2><p className='mt-4 text-sm leading-7 text-slate-300'>{c('Tìm xe, đăng xe trống và theo dõi hành trình trên cùng tài khoản TXE PRO.', 'Find vehicles, post availability and follow trips with one TXE PRO account.', '使用同一 TXE PRO 账户找车、发布空车并查看行程。')}</p><div className='mt-5 flex flex-wrap gap-4'><Link href='/dang-tin' className='inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900'>{c('Bắt đầu ngay', 'Get started', '立即开始')}<ArrowRight size={16} /></Link>{phone && <a href={phoneLink(phone)} className='inline-flex items-center gap-2 text-sm text-blue-100'><Phone size={16} />{phone}</a>}</div>{companyInfo.workingHours && <p className='mt-5 flex items-start gap-2 text-xs leading-6 text-blue-100'><Clock size={16} className='mt-1 shrink-0' />{companyInfo.workingHours}</p>}</div>
    <div className='self-center'><AppStoreLinks /></div>
  </div></section>;
}
