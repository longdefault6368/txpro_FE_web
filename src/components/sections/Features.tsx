import Image from "next/image";
import { ShieldCheck, Zap, Radar, BadgeDollarSign, Map, UserCheck, CheckCircle2 } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <ShieldCheck className="w-7 h-7" />,
      iconBg: "bg-blue-50 text-primary-600",
      title: "Bảo Vệ Dữ Liệu Chuyên Sâu",
      description: "Số điện thoại của bạn được mã hóa. Chỉ mở kết nối khi hai bên đã chốt lệnh thành công.",
      delay: 100,
    },
    {
      icon: <Zap className="w-7 h-7" />,
      iconBg: "bg-green-50 text-green-600",
      title: "Mượt Mà Từ Cử Chỉ",
      description: "Bỏ qua việc gõ text rườm rà. TXEPRO hỗ trợ tương tác đa điểm, zoom bản đồ, cuộn vòng xoay giá bằng 1 chạm.",
      delay: 200,
    },
    {
      icon: <Radar className="w-7 h-7" />,
      iconBg: "bg-purple-50 text-purple-600",
      title: "Matching Real-time",
      description: "Hệ thống gợi ý đơn hàng/hàng hóa phù hợp nhất dựa trên vị trí GPS và lịch trình xe của bạn tức thì.",
      delay: 300,
    },
    {
      icon: <BadgeDollarSign className="w-7 h-7" />,
      iconBg: "bg-yellow-50 text-yellow-600",
      title: "Giá Cả Minh Bạch",
      description: "Mọi chi phí được hiển thị rõ ràng trước khi bấm chấp nhận. Không phí ẩn, cạnh tranh sòng phẳng.",
      delay: 400,
    },
    {
      icon: <Map className="w-7 h-7" />,
      iconBg: "bg-red-50 text-red-600",
      title: "Theo Dõi Trực Tuyến",
      description: "Cả chủ hàng và tài xế đều có thể xem chính xác vị trí xe trên bản đồ độ phân giải cao của hệ thống.",
      delay: 500,
    },
    {
      icon: <UserCheck className="w-7 h-7" />,
      iconBg: "bg-indigo-50 text-indigo-600",
      title: "Tài Khoản Xác Thực",
      description: "100% tài xế và chủ hàng được xác thực danh tính để đảm bảo môi trường giao thương an toàn nhất.",
      delay: 600,
    },
  ];

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-relaxed">
            Tại Sao Chọn <span className="gradient-text">TXEPRO?</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Công nghệ đẳng cấp giúp bạn toàn quyền kiểm soát cước vận chuyển và thời gian.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group feature-card"
              data-aos="fade-up"
              data-aos-delay={item.delay}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 ${item.iconBg}`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
        
        {/* Big Feature Banner */}
        <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center" data-aos="fade-up">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px]">
            <Image
              src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Professional Driver"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-transparent"></div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 leading-relaxed">
              Trở Thành Đối Tác <span className="gradient-text">Chuyên Nghiệp</span>
            </h3>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Tham gia vào mạng lưới vận tải hiện đại. Nơi mọi chuyến xe rỗng chiều về của bạn đều có thể biến thành doanh thu.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Đối tác đã được kiểm duyệt giấy tờ.</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Công nghệ điều phối AI siêu tốc.</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Ví tiền nội bộ thanh toán dễ dàng.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
