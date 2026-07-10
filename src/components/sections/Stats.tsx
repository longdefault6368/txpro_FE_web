import Image from "next/image";
import { TrendingUp, PackageCheck, Users, Star } from "lucide-react";

export default function Stats() {
  const stats = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      value: "28%",
      label: "Tăng Thu Nhập",
      desc: "Trung bình đối với tài xế sau 1 tháng.",
      delay: 100,
    },
    {
      icon: <PackageCheck className="w-8 h-8" />,
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      value: "12,890+",
      label: "Chuyến Hoàn Thành",
      desc: "Giao dịch an toàn qua nền tảng.",
      delay: 200,
    },
    {
      icon: <Users className="w-8 h-8" />,
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      value: "5,432+",
      label: "Đối Tác Khách Hàng",
      desc: "Tài xế và chủ hàng đã xác thực.",
      delay: 300,
    },
  ];

  const testimonials = [
    {
      quote: "Cực kỳ ấn tượng với thao tác trên bản đồ của app. Việc chọn giá qua vòng xoay làm thao tác nhanh hơn rất nhiều khi tôi đang trên đường.",
      author: "Trần Quang Minh",
      role: "Chủ xe tải 8 Tấn",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
      delay: "fade-right",
    },
    {
      quote: "Minh bạch và an toàn. Đặc biệt tính năng OTP 2 lớp khiến doanh nghiệp của tôi hoàn toàn yên tâm giao hàng.",
      author: "Nguyễn Phương Ly",
      role: "Giám đốc Logistics",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      delay: "fade-left",
    },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Được Tin Tưởng Bởi <span className="text-primary-400">Chuyên Gia</span>
          </h2>
          <p className="text-slate-400 text-lg">Những con số nói lên sự hiệu quả của mạng lưới TXEPRO.</p>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors"
              data-aos="zoom-in"
              data-aos-delay={stat.delay}
            >
              <div className={`inline-flex w-16 h-16 rounded-full items-center justify-center mb-4 border ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-lg font-medium text-slate-300 mb-2">{stat.label}</div>
              <p className="text-slate-400 text-sm">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-2xl p-8 border border-slate-700"
              data-aos={t.delay}
            >
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-slate-300 mb-6 text-lg italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-600 rounded-full overflow-hidden relative">
                  <Image
                    src={t.avatar}
                    alt={t.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold">{t.author}</div>
                  <div className="text-sm text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
