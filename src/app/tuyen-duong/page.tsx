import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, MapPin, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import { ROUTE_CORRIDORS, type RouteRegion } from "@/lib/routes-data";
import { SERVICES } from "@/lib/services-data";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  itemListStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tuyen-duong",
  title: "Các tuyến vận chuyển hàng & tìm xe liên tỉnh | TXE PRO",
  description:
    "Tra cứu các tuyến vận tải trọng điểm trên TXE PRO: Huế – Đà Nẵng, Huế – Hà Nội, Huế – TP. HCM, Hà Nội – Đà Nẵng, Hà Nội – TP. HCM, Bình Dương, Đồng Nai và Miền Tây.",
});

const REGION_GROUPS: Array<{ key: RouteRegion; title: string; subtitle: string }> = [
  {
    key: "central",
    title: "Khu vực Miền Trung – TP. Huế",
    subtitle: "Các tuyến hai chiều kết nối TP. Huế với Đà Nẵng, Hà Nội và TP. Hồ Chí Minh.",
  },
  {
    key: "north-south",
    title: "Trục đường dài Bắc – Trung – Nam",
    subtitle: "Hành lang vận tải xuyên Việt cho hàng lô doanh nghiệp, xe lạnh, container và hàng ghép.",
  },
  {
    key: "south",
    title: "TP. Hồ Chí Minh & Khu vực phía Nam",
    subtitle: "Kết nối nhanh các khu công nghiệp Bình Dương, Đồng Nai và tuyến nông – thủy sản Miền Tây.",
  },
];

export default function RoutesHubPage() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Tuyến vận chuyển", path: "/tuyen-duong" },
  ]);
  const itemList = itemListStructuredData(origin, {
    path: "/tuyen-duong",
    name: "Tuyến vận chuyển hàng hóa phổ biến TXE PRO",
    description: "Danh sách các tuyến tìm xe chở hàng và đăng xe trống chiều về phổ biến trên TXE PRO.",
    items: ROUTE_CORRIDORS.map((route) => ({
      name: route.name,
      path: "/tuyen-duong/" + route.slug,
      description: route.seoDescription,
    })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(itemList) }} />
      <Header />
      <main className="bg-slate-50 pb-12 text-slate-800">
        <SubpageHeroBanner
          badge="Mạng lưới vận chuyển liên tỉnh"
          title="Các tuyến vận chuyển phổ biến"
          subtitle="Xem đặc thù cung đường, nhóm phương tiện phù hợp, lưu ý giao nhận và mẹo ghép hàng chiều về trên các hành lang vận tải chính của TXE PRO."
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Tuyến vận chuyển" },
          ]}
        />

        <div className="mx-auto max-w-6xl px-5 py-12 space-y-12">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3 max-w-2xl">
              <Compass size={22} className="mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
              <p className="text-sm leading-7 text-slate-600">
                Ngoài các tuyến trọng điểm bên dưới, TXE PRO hỗ trợ ghim điểm nhận và điểm trả linh hoạt trên bản đồ toàn
                quốc cho cả chủ hàng tìm xe lẫn tài xế đăng xe trống.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/chu-hang/form-tao-don"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
              >
                Tìm xe theo tuyến riêng
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href="/tai-xe/dang-tin"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đăng xe trống
              </Link>
            </div>
          </div>

          {REGION_GROUPS.map((group) => {
            const corridors = ROUTE_CORRIDORS.filter((item) => item.region === group.key);
            return (
              <section key={group.key}>
                <h2 className="text-2xl font-bold text-slate-950">{group.title}</h2>
                <p className="mt-1.5 text-sm text-slate-600">{group.subtitle}</p>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {corridors.map((route) => (
                    <article
                      key={route.slug}
                      className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-primary-300 transition-colors"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        <Image
                          src={route.image}
                          alt={route.imageAlt}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-600">
                          <MapPin size={13} aria-hidden="true" />
                          {route.originName} ↔ {route.destinationName}
                        </p>
                        <h3 className="mt-2 text-lg font-bold text-slate-950 leading-snug">
                          <Link href={`/tuyen-duong/${route.slug}`} className="hover:text-primary-700 transition-colors">
                            {route.name}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{route.heroSubtitle}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">Phương tiện phổ biến:</span>{" "}
                          {route.typicalVehicles.slice(0, 3).join(", ")}
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href={`/tuyen-duong/${route.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-800"
                          >
                            Xem hướng dẫn tuyến
                            <ArrowRight size={15} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary-600">
              <Truck size={20} aria-hidden="true" />
              <h2 className="text-xl font-bold text-slate-950">Dịch vụ vận chuyển hỗ trợ trên mọi tuyến</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => (
                <Link
                  key={service.slug}
                  href={`/dich-vu/${service.slug}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <span>{service.shortName}</span>
                  <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
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
