import { Gift, Check, Zap, TrendingUp, Wallet } from "lucide-react";

export default function Savings() {
  return (
    <section id="pricing" className="py-24 bg-slate-50 border-t border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div data-aos="fade-right">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 px-4 sm:px-0 leading-relaxed">
              Thương Lượng Trực Tiếp. <span className="gradient-text">Hoàn Toàn Miễn Phí.</span> Không Cắt Phế.
            </h2>
            <div className="bg-gradient-to-br from-primary-50 to-blue-50/50 rounded-2xl p-4 sm:p-6 md:p-8 border border-primary-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-16 md:w-16 md:h-16 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                    100% Miễn Phí Kết Nối
                  </h3>
                </div>
              </div>
              <p className="text-slate-700 text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
                TXEPRO ra đời nhằm hỗ trợ tối đa cho Tài xế và Chủ hàng Việt Nam tối ưu hóa chi phí vận hành. Cam kết không thu bất kỳ khoản phí trung gian nào!
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    Tự do kết nối và tìm kiếm đơn hàng trọn đời không giới hạn.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    Thương lượng giá trực tiếp, nhận tiền 100% không qua trung gian.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    Tuyệt đối không cắt chiết khấu % đơn hàng của tài xế.
                  </span>
                </li>
              </ul>
              <a href="#download" className="btn-primary inline-flex items-center gap-2">
                <Zap className="w-5 h-5" /> Bắt Đầu Kết Nối Ngay
              </a>
            </div>
          </div>
          
          {/* Wallet UI Mockup -> Savings Mockup */}
          <div className="relative" data-aos="fade-left">
            <div className="bg-gradient-to-br from-primary-600 to-blue-500 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                <div>
                  <div className="text-xs sm:text-sm opacity-90 mb-1">Doanh Thu Tiết Kiệm</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold">100% Lợi Nhuận</div>
                  <div className="text-xs sm:text-sm opacity-80">Thuộc Về Tài Xế & Chủ Hàng</div>
                </div>
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 opacity-90 flex-shrink-0" />
              </div>
              
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 md:mb-8">
                <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xs sm:text-sm opacity-90 mb-1">Mức Phí Chiết Khấu</div>
                  <div className="text-lg sm:text-xl font-semibold">0% (Hoàn Toàn Không Có)</div>
                  <div className="text-xs sm:text-sm opacity-80">App thông thường thu 15% - 25%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="text-xs sm:text-sm opacity-90 mb-1">Tiết kiệm trung bình hàng tháng</div>
                  <div className="text-lg sm:text-xl font-semibold">~ 4,500,000đ / Tài Xế</div>
                  <div className="text-xs sm:text-sm opacity-80">Dựa trên dữ liệu khảo sát cộng đồng</div>
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm opacity-90">Phí kết nối ứng dụng</span>
                  <span className="text-xl sm:text-2xl font-bold">Miễn Phí 0đ</span>
                </div>
              </div>
            </div>
            {/* Absolute badge matching sample */}
            <div className="absolute -top-4 right-0 sm:-right-4 bg-orange-500 text-white p-4 rounded-full shadow-lg animate-bounce">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
