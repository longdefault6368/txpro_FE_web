import Image from "next/image";
import { Shield, MapPin, Truck, Radar } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left" data-aos="fade-right" data-aos-duration="1000">
            <span className="inline-block text-xs font-bold bg-primary-50 text-primary-600 px-3 py-1.5 rounded-full uppercase tracking-wider mb-4 shadow-sm">
              {t("hero.badge")}
            </span>
            <h1 className="text-slate-900 mb-6 leading-snug">
              <span className="text-2xl sm:text-2xl lg:text-3xl font-bold block mb-1 text-slate-750">{t("hero.title1")}</span>
              <span className="text-2xl sm:text-2xl lg:text-3xl font-bold gradient-text block">— {t("hero.title2")}.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <a href="#download" className="btn-primary text-center">
                {t("hero.forShipper")}
              </a>
              <a href="#download" className="btn-secondary text-center">
                {t("hero.forDriver")}
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                <Shield className="w-5 h-5 text-primary-600" /> {t("features.f3.title")}
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                <MapPin className="w-5 h-5 text-primary-600" /> {t("features.f4.title")}
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                <Truck className="w-5 h-5 text-primary-600" /> {t("features.f2.title")}
              </div>
            </div>
          </div>

          {/* Image/Mockup */}
          <div className="relative" data-aos="fade-left" data-aos-duration="1000" data-aos-delay="200">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl animate-float">
              <Image
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Truck delivery"
                width={600}
                height={500}
                className="w-full h-[400px] lg:h-[500px] object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs opacity-90">{t("hero.statsShippers")}</div>
                  </div>
                  <div className="text-center border-l border-r border-white/20">
                    <div className="text-2xl font-bold">5,432</div>
                    <div className="text-xs opacity-90">{t("hero.statsDrivers")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">30%</div>
                    <div className="text-xs opacity-90">{t("features.f5.title")}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-6 right-0 sm:-right-6 bg-primary-600 text-white p-4 rounded-2xl shadow-xl transform rotate-12">
              <Radar className="w-8 h-8 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
