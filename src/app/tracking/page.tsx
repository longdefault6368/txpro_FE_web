import { Suspense } from "react";
import { LockKeyhole, PackageSearch, Route, Search } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import TrackingWorkspace from "@/components/tracking/TrackingWorkspace";
import s from "@/components/tracking/Tracking.module.css";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tracking",
  title: "Theo dõi hành trình vận chuyển | TXE PRO",
  description: "Tra cứu chuyến đi bằng mã đơn và xem vị trí, trạng thái trên bản đồ TXE PRO.",
});

function TrackingSsrFallback() {
  return (
    <>
      <Header />
      <main className={s.page}>
        <header className={s.heading}>
          <span className={s.eyebrow}>
            <Route size={16} aria-hidden="true" />
            HÀNH TRÌNH TRÊN TXE PRO
          </span>
          <h1>Theo dõi đơn hàng</h1>
          <p>Nhập mã đơn để xem trạng thái mới nhất và các mốc hành trình đã được ghi nhận.</p>
        </header>
        <form className={s.search} action="/tracking" method="get">
          <label htmlFor="tracking-code-ssr" className={s.srOnly}>
            Mã đơn hàng
          </label>
          <Search size={21} aria-hidden="true" />
          <input
            id="tracking-code-ssr"
            name="code"
            placeholder="Nhập mã đơn ORD-…"
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit">
            <Search size={17} aria-hidden="true" />
            Tra cứu
          </button>
        </form>
        <section className={s.empty}>
          <PackageSearch size={43} aria-hidden="true" />
          <h2>Mỗi hành trình, rõ từng bước</h2>
          <p>
            Sử dụng mã ORD trong chi tiết đơn hoặc thông báo của bạn. Xem trạng thái, bản đồ và thông tin vận chuyển
            mà không cần đăng nhập.
          </p>
          <div>
            <span>
              <Search size={17} aria-hidden="true" />
              Nhập đúng mã đơn
            </span>
            <span>
              <Route size={17} aria-hidden="true" />
              Xem trạng thái hành trình
            </span>
            <span>
              <LockKeyhole size={17} aria-hidden="true" />
              Tra cứu không cần đăng nhập
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function TrackingPage() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Theo dõi đơn hàng", path: "/tracking" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <Suspense fallback={<TrackingSsrFallback />}>
        <TrackingWorkspace />
      </Suspense>
    </>
  );
}
