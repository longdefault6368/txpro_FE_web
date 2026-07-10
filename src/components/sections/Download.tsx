import { Smartphone, Play, Apple } from "lucide-react";

export default function Download() {
  return (
    <section id="download" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="bg-gradient-to-br from-primary-600 via-primary-700 to-blue-900 rounded-[3rem] p-10 md:p-16 text-center shadow-[0_20px_50px_rgba(19,109,236,0.3)] text-white"
          data-aos="zoom-y-out"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full mb-6 border border-white/20">
            <Smartphone className="w-5 h-5" />
            <span className="font-semibold">Ứng Dụng Đã Có Mặt</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-relaxed">
            Tải Ngay Ứng Dụng TXEPRO
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Trải nghiệm ứng dụng quản lý logistics hiện đại nhất dành cho thị trường Việt Nam.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="#"
              className="bg-slate-900 hover:bg-black text-white border-2 border-transparent hover:border-white/30 rounded-2xl px-8 py-4 flex items-center justify-center gap-4 transition-all duration-300 shadow-xl"
            >
              <Apple className="w-9 h-9 fill-white" />
              <div className="text-left">
                <div className="text-xs text-slate-400 font-semibold uppercase">Tải trực tiếp trên</div>
                <div className="text-2xl font-bold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="bg-slate-900 hover:bg-black text-white border-2 border-transparent hover:border-white/30 rounded-2xl px-8 py-4 flex items-center justify-center gap-4 transition-all duration-300 shadow-xl"
            >
              <Play className="w-9 h-9 fill-white" />
              <div className="text-left">
                <div className="text-xs text-slate-400 font-semibold uppercase">Tải trực tiếp trên</div>
                <div className="text-2xl font-bold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
