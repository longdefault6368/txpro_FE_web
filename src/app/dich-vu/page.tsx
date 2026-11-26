import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Compass, ShieldCheck, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { SERVICES } from "@/lib/services-data";
import { ROUTE_CORRIDORS } from "@/lib/routes-data";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  itemListStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/dich-vu",
  title: "Dịch vụ tìm xe chở hàng, ghép chuyến & vận tải | TXE PRO",
  description:
    "Khám phá các dịch vụ kết nối vận tải trên TXE PRO: tìm xe tải chở hàng, ghép hàng tiện chuyến, chuyển nhà nội thất, xe đông lạnh – container và di chuyển ô tô, xe máy.",
});

export default function ServicesHubPage() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Dịch vụ vận chuyển", path: "/dich-vu" },
  ]);
  const itemList = itemListStructuredData(origin, {
    path: "/dich-vu",
    name: "Dịch vụ vận chuyển TXE PRO",
    description: "Danh mục các nhóm dịch vụ tìm xe chở hàng, ghép chuyến, chuyển nhà và kết nối phương tiện trên TXE PRO.",
    items: SERVICES.map((service) => ({
      name: service.name,
      path: "/dich-vu/" + service.slug,
      description: service.seoDescription,
    })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(itemList) }} />
      <Header />
      <main className="bg-slate-50 pb-12 text-slate-800">
        <SubpageHeroBanner
          badge="Giải pháp kết nối vận tải"
          title="Dịch vụ vận chuyển trên TXE PRO"
          subtitle="Chọn đúng nhóm phương tiện cho từng nhu cầu chở hàng, ghép chuyến chiều về, chuyển nhà hoặc di chuyển theo tuyến. Minh bạch thông tin và theo dõi hành trình trực tiếp."
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Dịch vụ vận chuyển" },
          ]}
        />

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Danh mục dịch vụ</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-950">
                Chọn đúng giải pháp cho chuyến đi của bạn
              </h2>
            </div>
            <Link
              href="/chu-hang/form-tao-don"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
            >
              Đăng nhu cầu tìm xe ngay
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article
                key={service.slug}
                className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-primary-300 transition-colors"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary-600">{service.badge}</span>
                  <h3 className="mt-2 text-lg font-bold text-slate-950 leading-snug">
                    <Link href={`/dich-vu/${service.slug}`} className="hover:text-primary-700 transition-colors">
                      {service.name}
                    </Link>
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-slate-600">{service.heroSubtitle}</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                    {service.vehicles.map((vehicle) => (
                      <li key={vehicle} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
                        <span>{vehicle}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      href={`/dich-vu/${service.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-800"
                    >
                      Xem chi tiết
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                    <Link
                      href={service.ctaHref}
                      className="text-xs font-semibold text-slate-500 hover:text-primary-700"
                    >
                      Đặt xe
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Truck size={22} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">Bạn là tài xế hoặc nhà xe đang có xe trống?</h2>
              <p className="mt-2.5 text-sm leading-7 text-slate-600">
                Đăng tin xe trống theo tuyến chạy và khung giờ sẵn sàng để nhận chuyến trực tiếp từ chủ hàng, giảm tình
                trạng chạy rỗng chiều về và quản lý lịch xe chủ động trên một tài khoản.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/tai-xe"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Tìm hiểu trang Tài xế
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  href="/tai-xe/dang-tin"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Đăng tin xe trống
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Compass size={22} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">Các tuyến vận chuyển trọng điểm</h2>
              <p className="mt-2.5 text-sm leading-7 text-slate-600">
                Xem hướng dẫn chọn xe, lưu ý tuyến đường và kinh nghiệm ghép hàng chiều về trên những hành lang vận tải
                được tìm kiếm nhiều nhất.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ROUTE_CORRIDORS.slice(0, 6).map((route) => (
                  <Link
                    key={route.slug}
                    href={`/tuyen-duong/${route.slug}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    {route.originName} – {route.destinationName}
                  </Link>
                ))}
              </div>
              <Link
                href="/tuyen-duong"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-800"
              >
                Xem toàn bộ tuyến vận chuyển
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <ShieldCheck size={28} className="shrink-0 text-primary-600 mt-1" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-slate-950">Quy trình minh bạch trước khi xác nhận</h2>
                <p className="mt-1.5 text-sm leading-7 text-slate-600">
                  Mọi thông tin về loại xe, giá đề xuất, ký quỹ và điều kiện bàn giao đều hiển thị rõ trước khi đặt chuyến.
                  Xem chi tiết quy chế và giải đáp nhanh tại Trung tâm trợ giúp.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/tro-giup"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Trung tâm trợ giúp
              </Link>
              <Link
                href="/thong-tin/thanh-toan-ky-quy"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Ví & ký quỹ
              </Link>
            </div>
          </div>
        </section>

        <SubpageCtaBanner />
      </main>
      <Footer />
    </>
  );
}
