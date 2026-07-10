import { Map, Radar, Handshake, TrendingUp, Smartphone } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: <Map className="w-8 h-8" />,
      iconBg: "bg-blue-50 text-primary-600",
      title: "Đăng Tải Lộ Trình",
      description: "Đăng tải chuyến xe rỗng chiều về hoặc nhu cầu gửi hàng. Hệ thống AI tự động ghi nhận tức thì.",
      delay: 100,
    },
    {
      number: 2,
      icon: <Radar className="w-8 h-8" />,
      iconBg: "bg-indigo-50 text-indigo-600",
      title: "Quét Radar",
      description: "Dùng 2 ngón tay thu phóng bản đồ để quét xe/hàng xung quanh. Kết quả hiển thị ngay trên màn hình.",
      delay: 200,
    },
    {
      number: 3,
      icon: <Handshake className="w-8 h-8" />,
      iconBg: "bg-green-50 text-green-600",
      title: "Chốt Giá & OTP",
      description: "Thương lượng qua Vòng Xoay Giá siêu nhạy. Kết nối an toàn 100% bằng hệ thống mã xác thực OTP.",
      delay: 300,
    },
    {
      number: 4,
      icon: <TrendingUp className="w-8 h-8" />,
      iconBg: "bg-purple-50 text-purple-600",
      title: "Hoàn Thành",
      description: "Theo dõi định vị xe chạy theo thời gian thực (Live GPS). Giao hàng thành công và gia tăng doanh thu.",
      delay: 400,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-relaxed">
            Hoạt Động Trơn Tru — <span className="gradient-text">Quy Trình 4 Bước</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Chỉ mất 2 phút để bắt đầu hành trình thông minh, kết nối lập tức, giao dịch an toàn.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-[0_20px_50px_rgba(19,109,236,0.15)] hover:-translate-y-2 hover:border-primary-200 cursor-pointer transition-all duration-500 group feature-card"
              data-aos="fade-up"
              data-aos-delay={step.delay}
            >
              <div className="absolute -top-5 -left-5 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                {step.number}
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${step.iconBg}`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center" data-aos="fade-in">
          <a href="#download" className="btn-primary inline-flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5" /> Bắt đầu ngay trên ứng dụng
          </a>
        </div>
      </div>
    </section>
  );
}
