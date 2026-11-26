import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, MapPin, Newspaper, Route, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { getRouteBySlug, isRouteSlug, ROUTE_SLUGS } from "@/lib/routes-data";
import { getServiceBySlug } from "@/lib/services-data";
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
  return ROUTE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = getRouteBySlug(slug);
  if (!route) {
    return {
      title: "Không tìm thấy tuyến đường | TXE PRO",
      robots: { index: false, follow: false },
    };
  }
  return publicPageMetadata({
    path: "/tuyen-duong/" + route.slug,
    title: route.seoTitle,
    description: route.seoDescription,
  });
}

export default async function RouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isRouteSlug(slug)) notFound();
  const route = getRouteBySlug(slug);
  if (!route) notFound();

  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const company = await loadIndexableCompany();
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Tuyến vận chuyển", path: "/tuyen-duong" },
    { name: `${route.originName} – ${route.destinationName}`, path: "/tuyen-duong/" + route.slug },
  ]);
  const serviceSchema = serviceStructuredData(origin, {
    path: "/tuyen-duong/" + route.slug,
    name: route.name,
    description: route.seoDescription,
    serviceType: `Vận chuyển hàng hóa và kết nối xe tuyến ${route.originName} – ${route.destinationName}`,
    areaServed: [route.originName, route.destinationName],
    image: route.image,
    company,
  });
  const faqSchema = faqStructuredData(route.faqs);

  const services = route.relatedServices
    .map((serviceSlug) => getServiceBySlug(serviceSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const neighboringRoutes = route.relatedRoutes
    .map((routeSlug) => getRouteBySlug(routeSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(faqSchema) }} />
      <Header />
      <main className="bg-slate-50 pb-12 text-slate-800">
        <SubpageHeroBanner
          badge={route.regionLabel}
          title={route.name}
          subtitle={route.heroSubtitle}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Tuyến vận chuyển", href: "/tuyen-duong" },
            { label: `${route.originName} – ${route.destinationName}` },
          ]}
        />

        <div className="mx-auto max-w-6xl px-5 py-10 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/tuyen-duong" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800">
              <ArrowLeft size={16} aria-hidden="true" />
              Tất cả tuyến vận chuyển
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/chu-hang/form-tao-don"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
              >
                Tìm xe tuyến {route.originName} – {route.destinationName}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/tai-xe/dang-tin"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Tài xế đăng xe chiều về
              </Link>
            </div>
          </div>

          <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={route.image}
                alt={route.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover"
              />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-700">
                <Route size={14} aria-hidden="true" />
                {route.highwayNote}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                Đặc thù tuyến đường {route.originName} ↔ {route.destinationName}
              </h2>
              {route.corridorInsights.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
              <div className="pt-2 flex flex-wrap gap-2">
                {route.typicalVehicles.map((vehicle) => (
                  <span
                    key={vehicle}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Truck size={13} className="text-primary-600" aria-hidden="true" />
                    {vehicle}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Nhóm hàng hóa thường gửi trên tuyến này</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-3 text-sm leading-7 text-slate-600">
              {route.typicalGoods.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="mt-1 shrink-0 text-primary-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-950">Lưu ý cho chủ hàng khi gửi hàng</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {route.shipperTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/chu-hang/form-tao-don"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800"
              >
                Đăng nhu cầu tìm xe tuyến này
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-950">Kinh nghiệm cho tài xế ghép hàng chiều về</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {route.driverTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-1 shrink-0 text-primary-600" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/tai-xe/dang-tin"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800"
              >
                Đăng tin xe trống tuyến này
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={22} className="text-primary-600" aria-hidden="true" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                Câu hỏi thường gặp tuyến {route.originName} – {route.destinationName}
              </h2>
            </div>
            <div className="mt-6 space-y-4">
              {route.faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="text-base font-bold text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-primary-600">
                <Truck size={18} aria-hidden="true" />
                <h2 className="text-base font-bold text-slate-950">Dịch vụ phù hợp</h2>
              </div>
              <div className="mt-4 space-y-2.5">
                {services.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/dich-vu/${service.slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    <span>{service.shortName}</span>
                    <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-primary-600">
                <MapPin size={18} aria-hidden="true" />
                <h2 className="text-base font-bold text-slate-950">Tuyến lân cận khác</h2>
              </div>
              <div className="mt-4 space-y-2.5">
                {neighboringRoutes.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/tuyen-duong/${item.slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    <span>{item.originName} – {item.destinationName}</span>
                    <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-primary-600">
                <Newspaper size={18} aria-hidden="true" />
                <h2 className="text-base font-bold text-slate-950">Cẩm nang liên quan</h2>
              </div>
              <div className="mt-4 space-y-2.5">
                {route.relatedGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/tin-tuc/${guide.slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    <span>{guide.title}</span>
                    <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        <SubpageCtaBanner />
      </main>
      <Footer />
    </>
  );
}
