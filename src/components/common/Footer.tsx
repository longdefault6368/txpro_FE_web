import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2">
            <Image
              src="/logo.png"
              alt="TXEPRO Logo"
              width={48}
              height={48}
              className="rounded-full mb-6 object-cover shadow-lg hover:scale-110 hover:rotate-12 transition-all duration-500"
            />
            <p className="text-slate-500 max-w-sm text-lg leading-relaxed">
              Nền tảng vận tải thông minh hàng đầu. Tối ưu hoá quy trình, kết nối nhanh chóng, minh bạch và an toàn tuyệt đối.
            </p>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6 text-lg">Khám Phá</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li>
                <a href="#" className="hover:text-primary-600 transition-colors">
                  Dành cho Chủ Hàng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-600 transition-colors">
                  Dành cho Tài Xế
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary-600 transition-colors">
                  Công Nghệ Cốt Lõi
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary-600 transition-colors">
                  Chính Sách Miễn Phí
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-6 text-lg">Hỗ Trợ</h4>
            <ul className="space-y-4 text-slate-600 font-medium">
              <li>
                <a href="#" className="hover:text-primary-600 transition-colors">
                  Trung tâm trợ giúp 24/7
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-600 transition-colors">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-600 transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-600 transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 font-medium">
          <p>&copy; {new Date().getFullYear()} TXEPRO Technologies. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
