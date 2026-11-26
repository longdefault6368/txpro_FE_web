"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Phone, Mail, Clock, MapPin } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import type { InfoPageSlug } from "@/lib/info-pages";
import { getInfoPageContent, type InfoLang } from "@/lib/info-pages-content";
import { phoneLink, supportPhone } from "@/utils/companyInfo";

export default function InfoPageClient({ slug }: { slug: InfoPageSlug }) {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const lang: InfoLang = language === "en" || language === "zh" ? language : "vi";
  const c = (vi: string, en: string, zh: string) => (lang === "en" ? en : lang === "zh" ? zh : vi);

  const page = getInfoPageContent(slug);
  const phone = supportPhone(companyInfo);
  const email = companyInfo.emailSupport || companyInfo.emailGeneral;

  return (
    <>
      <Header />
      <main className="bg-slate-50 pb-12 text-slate-800">
        <SubpageHeroBanner
          title={page.title[lang]}
          subtitle={page.intro[lang]}
          badge={page.badge[lang]}
          breadcrumbs={[
            { label: c("Trang chủ", "Home", "首页"), href: "/" },
            { label: c("Thông tin", "Information", "平台信息"), href: "/thong-tin/gioi-thieu" },
            { label: page.title[lang] },
          ]}
        />
        <div className="relative mx-auto -mt-6 max-w-5xl px-5 pb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <Link href="/tro-giup" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800">
              <ArrowLeft size={16} aria-hidden="true" />
              {c("Trung tâm trợ giúp", "Help center", "帮助中心")}
            </Link>

            <section className="my-7 rounded-2xl border border-primary-100 bg-primary-50/50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <FileText size={22} className="mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-700">
                    {c("Điểm nổi bật cần nắm", "Key takeaways", "核心要点")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {page.highlights[lang].map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="mt-1 shrink-0 text-primary-600" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <div className="space-y-8">
              {page.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 sm:p-7"
                >
                  <h2 className="text-lg sm:text-xl font-bold leading-7 text-slate-900">
                    {section.heading[lang]}
                  </h2>
                  {section.paragraphs.map((paragraph, idx) => (
                    <p key={idx} className="mt-4 text-sm sm:text-[15px] leading-7 text-slate-600">
                      {paragraph[lang]}
                    </p>
                  ))}
                  {section.checklist && (
                    <ul className="mt-4 space-y-2.5 rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-6 text-slate-700">
                      {section.checklist[lang].map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.cta && (
                    <Link
                      href={section.cta.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      {section.cta.label[lang]}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                </section>
              ))}
            </div>

            <section className="mt-9 rounded-xl border border-slate-200 bg-slate-50/70 p-6">
              <h2 className="text-base font-bold text-slate-900">
                {c("Nội dung liên quan trên TXE PRO", "Related pages on TXE PRO", "TXE PRO 相关内容")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {page.relatedLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    <span>{item.label[lang]}</span>
                    <ArrowRight size={15} className="shrink-0 text-primary-600" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-9 rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">
                {c("Thông tin liên hệ chính thức", "Official contact details", "官方联系资料")}
              </h2>
              {companyInfo.companyName && <p className="mt-3 text-sm font-semibold">{companyInfo.companyName}</p>}
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {phone && (
                  <a className="flex items-center gap-2 text-primary-700" href={phoneLink(phone)}>
                    <Phone size={16} aria-hidden="true" />
                    {phone}
                  </a>
                )}
                {email && (
                  <a className="flex items-center gap-2 text-primary-700" href={"mailto:" + email}>
                    <Mail size={16} aria-hidden="true" />
                    {email}
                  </a>
                )}
                {companyInfo.workingHours && (
                  <p className="flex items-start gap-2">
                    <Clock size={16} className="mt-1 shrink-0" aria-hidden="true" />
                    {companyInfo.workingHours}
                  </p>
                )}
                {companyInfo.supportResponseTime && <p>{companyInfo.supportResponseTime}</p>}
                {[
                  ["officePrimaryLabel", "addressHcm"],
                  ["officeSecondaryLabel", "addressHn"],
                ].map(
                  ([label, address]) =>
                    companyInfo[address as "addressHcm" | "addressHn"] && (
                      <p key={address} className="flex items-start gap-2">
                        <MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" />
                        {[
                          companyInfo[label as "officePrimaryLabel" | "officeSecondaryLabel"],
                          companyInfo[address as "addressHcm" | "addressHn"],
                        ]
                          .filter(Boolean)
                          .join(": ")}
                      </p>
                    )
                )}
                <Link href="/thong-tin/lien-he" className="inline-flex items-center gap-2 font-semibold text-primary-700">
                  {c("Gửi yêu cầu liên hệ", "Contact support", "联系支持")}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        </div>
        <SubpageCtaBanner />
      </main>
      <Footer />
    </>
  );
}
