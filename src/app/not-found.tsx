import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, HelpCircle, Newspaper, Route, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export const metadata: Metadata = {
  title: "Không tìm thấy trang | TXE PRO",
  description: "Trang bạn yêu cầu không tồn tại hoặc đã được chuyển sang đường dẫn mới trên TXE PRO.",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { href: "/dich-vu", label: "Dịch vụ tìm xe tải & vận chuyển", icon: Truck },
  { href: "/tuyen-duong", label: "Các tuyến vận chuyển phổ biến", icon: Compass },
  { href: "/dang-tin", label: "Đăng nhu cầu tìm xe hoặc xe trống", icon: Truck },
  { href: "/tracking", label: "Tra cứu hành trình theo mã đơn", icon: Route },
  { href: "/tin-tuc", label: "Tin tức và cẩm nang vận chuyển", icon: Newspaper },
  { href: "/tro-giup", label: "Trung tâm trợ giúp và câu hỏi thường gặp", icon: HelpCircle },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[75vh] bg-slate-50 pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
            <Compass className="w-8 h-8" aria-hidden="true" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">Lỗi 404</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Không tìm thấy trang bạn yêu cầu
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3 max-w-lg mx-auto">
            Đường dẫn có thể đã thay đổi hoặc không còn tồn tại. Bạn có thể quay về trang chủ hoặc chọn một mục bên dưới.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Về trang chủ TXE PRO
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/thong-tin/lien-he"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>

          <nav aria-label="Liên kết hữu ích" className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {SUGGESTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:border-primary-300 hover:bg-primary-50/40 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary-600 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
