import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarClock, CheckCircle2, HelpCircle, MapPin, ShieldCheck, Smartphone, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import SubpageCtaBanner from "@/components/common/SubpageCtaBanner";
import AppStoreLinks from "@/components/common/AppStoreLinks";
import { ROUTE_CORRIDORS } from "@/lib/routes-data";
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

export const metadata = publicPageMetadata({
  path: "/tai-xe",
  title: "Đăng ký tài xế TXE PRO | Đăng xe trống & tìm hàng chiều về",
  description:
    "Kết nối tài xế xe tải, xe đông lạnh, container, ô tô và xe máy với chủ hàng đúng tuyến. Đăng xe trống chiều về, lập lịch đăng tự động và nhận chuyến minh bạch trên TXE PRO.",
});

const DRIVER_FAQS = [
  {
    question: "Tài xế mới cần làm những bước nào để bắt đầu đăng xe trống trên TXE PRO?",
    answer:
      "Bạn tạo tài khoản TXE PRO (hoặc chuyển sang vai trò Tài xế), tải ứng dụng trên Google Play / App Store để hoàn tất xác minh danh tính eKYC và đăng ký thông tin phương tiện. Khi hồ sơ và xe được duyệt hoạt động, bạn có thể đăng xe trống ngay trên app hoặc website.",
  },
  {
    question: "Đang chạy một chuyến có thể đăng thêm tin xe trống cho chiều về không?",
    answer:
      "Có. Hệ thống cho phép tài xế đăng nhiều tin xe trống cùng lúc cho các khung giờ hoặc tuyến quay đầu sắp tới và chủ động quản lý trạng thái từng tin.",
  },
  {
    question: "Tính năng đăng tin tự động hỗ trợ gì cho tài xế chạy tuyến cố định?",
    answer:
      "Trong ứng dụng TXE PRO, bạn có thể cấu hình sẵn phương tiện, tuyến đường, các ngày trong tuần và khung giờ hoạt động để hệ thống tự mở tin theo lịch mà không phải nhập tay mỗi ngày.",
  },
  {
    question: "Chính sách phí đối với tài xế xe máy chở người trên TXE PRO thế nào?",
    answer:
      "Khi tài xế đăng ký và chọn đúng nhóm phương tiện Xe máy (chở người), hệ thống áp dụng chính sách miễn phí tài xế, không yêu cầu ký quỹ hay sử dụng voucher cho loại phương tiện này.",
  },
];

const DRIVER_STEPS = [
  {
    step: "01",
    title: "Tạo tài khoản & chọn vai trò Tài xế",
    detail: "Đăng ký bằng số điện thoại chính chủ trên website hoặc ứng dụng TXE PRO; một tài khoản dùng đồng bộ trên mọi thiết bị.",
  },
  {
    step: "02",
    title: "Xác minh eKYC & đăng ký phương tiện trên app",
    detail: "Hoàn thiện giấy tờ tùy thân, bằng lái và hình ảnh phương tiện thực tế ngay trong ứng dụng Android/iOS.",
  },
  {
    step: "03",
    title: "Đăng xe trống hoặc lập lịch tự động",
    detail: "Nhập tuyến chạy, tải trọng đúng đăng kiểm, khung giờ sẵn sàng và giá đề xuất để chủ hàng dễ chọn.",
  },
  {
    step: "04",
    title: "Nhận chuyến, cập nhật GPS và hoàn tất",
    detail: "Xác nhận đến điểm nhận/trả trong phạm vi 3 km với GPS hợp lệ và tải 1–3 ảnh giao hàng (với nhóm xe chở hàng).",
  },
];

const DRIVER_GUIDES = [
  { slug: "dang-xe-trong-hieu-qua", title: "Một tin xe trống rõ ràng cần những thông tin gì?" },
  { slug: "quan-ly-lich-xe-trong", title: "Quản lý lịch xe trống và nhận nhiều chuyến chủ động" },
  { slug: "de-xuat-gia-cuoc-xe", title: "Cách đề xuất giá cước xe rõ ràng, dễ chốt chuyến" },
  { slug: "san-sang-truoc-chuyen-di", title: "Kiểm tra lộ trình và phương tiện trước khi khởi hành" },
];

export default async function DriverHubPage() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const company = await loadIndexableCompany();
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Dành cho tài xế", path: "/tai-xe" },
  ]);
  const serviceSchema = serviceStructuredData(origin, {
    path: "/tai-xe",
    name: "Nền tảng đăng xe trống & nhận chuyến cho tài xế TXE PRO",
    description:
      "Kênh kết nối giúp tài xế xe tải, xe lạnh, container, ô tô và xe máy đăng xe trống theo tuyến, tìm hàng chiều về và quản lý chuyến đi minh bạch.",
    serviceType: "Nền tảng kết nối tài xế và đơn hàng vận tải",
    image: "/images/news/dang-xe-trong.webp",
    company,
  });
  const faqSchema = faqStructuredData(DRIVER_FAQS);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(faqSchema) }} />
      <Header />
      <main className="bg-slate-50 pb-12 text-slate-800">
        <SubpageHeroBanner
          badge="Đối tác tài xế TXE PRO"
          title="Đăng xe trống, tìm hàng chiều về chủ động"
          subtitle="Dành cho tài xế và chủ đội xe muốn tăng tỷ lệ có hàng hai chiều, chủ động khung giờ chạy, giá đề xuất và lịch đăng tin tự động trên một nền tảng thống nhất."
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Dành cho tài xế" },
          ]}
        />

        <div className="mx-auto max-w-6xl px-5 py-10 space-y-10">
          <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-700">
                <Truck size={14} aria-hidden="true" />
                Xe tải · Xe lạnh · Container · Ô tô · Xe máy
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 leading-tight">
                Giảm chuyến xe rỗng, kiểm soát hoàn toàn tuyến chạy của bạn
              </h2>
              <p className="text-sm sm:text-base leading-7 text-slate-600">
                Thay vì chạy rỗng thùng sau khi trả hàng hoặc phụ thuộc trung gian thiếu rõ ràng, tài xế trên TXE PRO tự
                đăng lịch xe trống theo tuyến quen thuộc, tự đặt mức giá đề xuất và theo dõi toàn bộ quyền lợi ví – ký
                quỹ ngay trên ứng dụng.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/tai-xe/dang-tin"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
                >
                  Đăng tin xe trống ngay
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/thong-tin/huong-dan-tai-xe"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Xem hướng dẫn tài xế
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6 relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src="/images/news/dang-xe-trong.webp"
                alt="Tài xế đăng tin xe trống và tìm hàng chiều về trên TXE PRO"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <CalendarClock size={24} className="text-primary-600" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">Đăng nhiều tin & lịch tự động</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Chủ động đăng song song nhiều khung giờ hoặc thiết lập lịch đăng tự động trên ứng dụng cho các tuyến cố định
                hằng tuần.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <ShieldCheck size={24} className="text-emerald-600" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">Minh bạch phí chuyến & ví</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Mọi điều kiện voucher, ký quỹ và phí chuyến đều hiển thị trước khi xác nhận; không thu chồng phí khi kết
                thúc chuyến đi.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <Smartphone size={24} className="text-primary-600" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">Đồng bộ web và ứng dụng di động</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Xác minh eKYC và theo dõi GPS trực tiếp trên app Android/iOS, đồng thời đăng tin nhanh trên website bằng
                cùng một tài khoản.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950">4 bước bắt đầu nhận chuyến cùng TXE PRO</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {DRIVER_STEPS.map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-slate-600">
                Tải ứng dụng TXE PRO để xác minh danh tính eKYC, đăng ký phương tiện và bật đăng tin tự động:
              </p>
              <AppStoreLinks />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
              <div className="flex items-center gap-2 text-primary-600">
                <MapPin size={18} aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-950">Tuyến vận chuyển nhiều nhu cầu chiều về</h2>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {ROUTE_CORRIDORS.map((route) => (
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

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="text-lg font-bold text-slate-950">Cẩm nang dành riêng cho tài xế</h2>
              <ul className="mt-4 space-y-2.5">
                {DRIVER_GUIDES.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={`/tin-tuc/${guide.slug}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" aria-hidden="true" />
                        {guide.title}
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-primary-600" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/tin-tuc?audience=driver"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-800"
              >
                Xem tất cả bài viết cho tài xế
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={22} className="text-primary-600" aria-hidden="true" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950">Câu hỏi thường gặp của tài xế</h2>
            </div>
            <div className="mt-6 space-y-4">
              {DRIVER_FAQS.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="text-base font-bold text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </div>
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
