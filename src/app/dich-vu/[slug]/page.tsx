import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, MapPin, Newspaper, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { getServiceBySlug, isServiceSlug, SERVICE_SLUGS, SERVICES } from "@/lib/services-data";
import { getRouteBySlug } from "@/lib/routes-data";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  faqStructuredData,
  loadIndexableCompany,
  publicPageMetadata,
  resolveMetadataOrigin,
  serviceStructuredData,
  structuredDataScript,
} from "@/lib/site-seo";

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) {
    return {
      title: "Không tìm thấy dịch vụ | TXE PRO",
      robots: { index: false, follow: false },
    };
  }
  return publicPageMetadata({
    path: "/dich-vu/" + service.slug,
    title: service.seoTitle,
    description: service.seoDescription,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const company = await loadIndexableCompany();
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Dịch vụ vận chuyển", path: "/dich-vu" },
    { name: service.shortName, path: "/dich-vu/" + service.slug },
  ]);
  const serviceSchema = serviceStructuredData(origin, {
    path: "/dich-vu/" + service.slug,
    name: service.name,
    description: service.seoDescription,
    serviceType: service.serviceType,
    image: service.image,
    company,
  });
  const faqSchema = faqStructuredData(service.faqs);

  const routes = service.relatedRoutes
    .map((routeSlug) => getRouteBySlug(routeSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const otherServices = SERVICES.filter((item) => item.slug !== service.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(faqSchema) }} />
      <Header />
      <main className="bg-slate-50 pb-12 text-slate-800">
        <SubpageHeroBanner
          badge={service.badge}
          title={service.name}
          subtitle={service.heroSubtitle}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Dịch vụ", href: "/dich-vu" },
            { label: service.shortName },
          ]}
        />

        <div className="mx-auto max-w-6xl px-5 py-10 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/dich-vu" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800">
              <ArrowLeft size={16} aria-hidden="true" />
              Tất cả dịch vụ vận chuyển
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                href={service.ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
              >
                {service.ctaLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href={service.secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {service.secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover"
              />
            </div>
            <div className="lg:col-span-7">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">Điểm nổi bật khi đặt trên TXE PRO</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {service.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="mt-1 shrink-0 text-primary-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {service.vehicles.map((vehicle) => (
                  <span
                    key={vehicle}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-800"
                  >
                    <Truck size={13} aria-hidden="true" />
                    {vehicle}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-950">Phù hợp với những nhu cầu nào?</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {service.suitableFor.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-950">Lưu ý chuẩn bị trước khi khởi hành</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {service.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-1 shrink-0 text-primary-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950">Quy trình đặt xe 4 bước trên TXE PRO</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {service.workflow.map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-950 leading-snug">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={22} className="text-primary-600" aria-hidden="true" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">Câu hỏi thường gặp</h2>
            </div>
            <div className="mt-6 space-y-4">
              {service.faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="text-base font-bold text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {routes.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
                <div className="flex items-center gap-2 text-primary-600">
                  <MapPin size={18} aria-hidden="true" />
                  <h2 className="text-lg font-bold text-slate-950">Tuyến vận chuyển liên quan</h2>
                </div>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {routes.map((route) => (
                    <Link
                      key={route.slug}
                      href={`/tuyen-duong/${route.slug}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                    >
                      <span>{route.originName} – {route.destinationName}</span>
                      <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
              <div className="flex items-center gap-2 text-primary-600">
                <Newspaper size={18} aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-950">Cẩm nang thực tế nên đọc</h2>
              </div>
              <div className="mt-4 space-y-2.5">
                {service.relatedGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/tin-tuc/${guide.slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    <span>{guide.title}</span>
                    <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
            <h2 className="text-lg font-bold text-slate-950">Khám phá các dịch vụ khác trên TXE PRO</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {otherServices.map((item) => (
                <Link
                  key={item.slug}
                  href={`/dich-vu/${item.slug}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <p className="text-xs font-bold uppercase text-primary-600">{item.badge}</p>
                  <p className="mt-1">{item.shortName}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <SubpageCtaBanner />
      </main>
      <Footer />
    </>
  );
}
