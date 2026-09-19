"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  Navigation,
  Package,
  Pause,
  Play,
  RotateCw,
  Search,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";

interface LiveActivity {
  id: string;
  type: "matched" | "new_order" | "completed" | "empty_truck";
  tag: string;
  tagColor: "blue" | "emerald" | "purple" | "amber";
  title: string;
  from: string;
  to: string;
  cargo: string;
  vehicle: string;
  price?: string;
  actor: string;
  minutesAgo: number;
  orderCode?: string;
}

const FALLBACK_DATA: LiveActivity[] = [
  {
    id: "act-1",
    type: "matched",
    tag: "Vừa nhận đơn",
    tagColor: "blue",
    title: "Xe tải 8 tấn nhận đơn thành công",
    from: "Hà Nội (KCN Thăng Long)",
    to: "Hải Phòng (Cảng Đình Vũ)",
    cargo: "15 tấn linh kiện điện tử",
    vehicle: "Xe tải 8 tấn",
    price: "3.500.000 ₫",
    actor: "Tài xế Nguyễn V. T.",
    minutesAgo: 2,
    orderCode: "ORD-20260709-001",
  },
  {
    id: "act-2",
    type: "new_order",
    tag: "Mới đăng tìm xe",
    tagColor: "emerald",
    title: "Chủ hàng tìm xe tải lạnh chuyển hoa quả",
    from: "Đà Lạt (Lâm Đồng)",
    to: "TP.HCM (Chợ Thủ Đức)",
    cargo: "800 kg dâu tây & hoa tươi",
    vehicle: "Xe lạnh 2.5 tấn",
    price: "2.200.000 ₫",
    actor: "Chủ vựa Minh Anh",
    minutesAgo: 5,
    orderCode: "ORD-20260708-005",
  },
  {
    id: "act-3",
    type: "completed",
    tag: "Hoàn thành chuyến",
    tagColor: "purple",
    title: "Giao hàng thành công & đánh giá ⭐ 5.0",
    from: "Bình Dương (KCN Sóng Thần)",
    to: "Vũng Tàu (Cảng Cái Mép)",
    cargo: "22 tấn hạt nhựa PP",
    vehicle: "Xe đầu kéo Container 40ft",
    price: "5.800.000 ₫",
    actor: "Tài xế Lê H. N.",
    minutesAgo: 8,
    orderCode: "ORD-20260708-004",
  },
  {
    id: "act-4",
    type: "empty_truck",
    tag: "Xe trống chiều về",
    tagColor: "amber",
    title: "Tài xế đăng tìm hàng tiện chuyến về",
    from: "Đà Nẵng",
    to: "TP.HCM",
    cargo: "Nhận chở hàng khô, bách hóa",
    vehicle: "Xe thùng bạt 10 tấn",
    price: "Giá thương lượng -35%",
    actor: "Tài xế Trần Đình Q.",
    minutesAgo: 12,
  },
  {
    id: "act-5",
    type: "matched",
    tag: "Vừa nhận đơn",
    tagColor: "blue",
    title: "Nhận đơn ghép hàng tiết kiệm",
    from: "TP.HCM (Quận 12)",
    to: "Cần Thơ (KCN Trà Nóc)",
    cargo: "3 tấn thiết bị gia dụng",
    vehicle: "Xe tải 3.5 tấn",
    price: "1.900.000 ₫",
    actor: "Tài xế Phạm M. Đ.",
    minutesAgo: 16,
    orderCode: "ORD-20260709-002",
  },
  {
    id: "act-6",
    type: "new_order",
    tag: "Mới đăng tìm xe",
    tagColor: "emerald",
    title: "Chủ hàng tìm xe vận chuyển thép cuộn",
    from: "Quảng Ngãi (Dung Quất)",
    to: "Hà Nội (KCN Thường Tín)",
    cargo: "28 tấn thép công trình",
    vehicle: "Đầu kéo sàn lửng",
    price: "11.500.000 ₫",
    actor: "Công ty VLXD Miền Trung",
    minutesAgo: 21,
  },
  {
    id: "act-7",
    type: "completed",
    tag: "Hoàn thành chuyến",
    tagColor: "purple",
    title: "Giao nhận an toàn, không hao hụt",
    from: "Tiền Giang (Mỹ Tho)",
    to: "TP.HCM (Chợ Bình Điền)",
    cargo: "5 tấn trái cây sầu riêng",
    vehicle: "Xe tải thùng kín 5 tấn",
    price: "2.400.000 ₫",
    actor: "Tài xế Vũ Q. K.",
    minutesAgo: 26,
  },
  {
    id: "act-8",
    type: "empty_truck",
    tag: "Xe trống chiều về",
    tagColor: "amber",
    title: "Xe rỗng chiều về tìm hàng nông sản",
    from: "Nha Trang (Khánh Hòa)",
    to: "Đồng Nai (KCN Biên Hòa)",
    cargo: "Nhận hàng pallet, thủy hải sản",
    vehicle: "Xe lạnh 8 tấn",
    price: "Giá ưu đãi -30%",
    actor: "Tài xế Đỗ Tuấn K.",
    minutesAgo: 32,
  },
];

export default function LiveActivityTicker() {
  const [activities, setActivities] = useState<LiveActivity[]>(FALLBACK_DATA);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<LiveActivity | null>(null);
  const [metrics, setMetrics] = useState({
    onlineDrivers: 142,
    activeOrders: 48,
    matchedToday: 326,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch("/api/live-activities");
        if (res.ok) {
          const json = await res.json();
          if (json.data?.activities && json.data.activities.length > 0) {
            setActivities(json.data.activities);
          }
          if (json.data?.metrics) {
            setMetrics(json.data.metrics);
          }
        }
      } catch {
        // Fallback to default state on network fail
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 45000);
    return () => clearInterval(interval);
  }, []);

  const filteredActivities = activities.filter((act) => {
    if (activeFilter === "all") return true;
    return act.type === activeFilter;
  });

  // Smooth continuous auto-ticker scroll
  useEffect(() => {
    if (isPaused) return;

    const el = scrollRef.current;
    if (!el) return;

    const scrollInterval = setInterval(() => {
      if (el) {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 1;
        }
      }
    }, 35);

    return () => clearInterval(scrollInterval);
  }, [isPaused, filteredActivities]);

  const scrollManual = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const getTagBadgeStyle = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "matched":
        return <Zap className="w-3.5 h-3.5 text-blue-600" />;
      case "new_order":
        return <Package className="w-3.5 h-3.5 text-emerald-600" />;
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />;
      case "empty_truck":
        return <Truck className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-primary-600" />;
    }
  };

  return (
    <section className="relative py-12 bg-gradient-to-b from-white via-slate-50/70 to-white border-y border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-xs mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-wide uppercase text-[11px]">Trực Tiếp Hệ Thống • Live Activity</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Bản Tin Hoạt Động Thời Gian Thực
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Các chuyến hàng, xe trống và giao dịch đang được kết nối trực tiếp không qua trung gian trên khắp cả nước.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-500 font-medium">Tài xế online:</span>
              <span className="font-bold text-slate-900">{metrics.onlineDrivers}+</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-500 font-medium">Đơn đang tìm xe:</span>
              <span className="font-bold text-slate-900">{metrics.activeOrders}+</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-xs text-xs hidden lg:flex">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="text-slate-500 font-medium">Kết nối hôm nay:</span>
              <span className="font-bold text-slate-900">{metrics.matchedToday}+</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Auto Scroll Toggle */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/60 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {[
              { key: "all", label: "Tất cả hoạt động" },
              { key: "matched", label: "Xe vừa nhận đơn" },
              { key: "new_order", label: "Chủ hàng tìm xe" },
              { key: "empty_truck", label: "Xe trống chiều về" },
              { key: "completed", label: "Chuyến hoàn thành" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.key
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => scrollManual("left")}
              className="p-1.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-primary-600 transition-colors cursor-pointer shadow-xs"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollManual("right")}
              className="p-1.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-primary-600 transition-colors cursor-pointer shadow-xs"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ml-1"
              title={isPaused ? "Bật tự động trượt" : "Tạm dừng trượt"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-primary-600" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
            </button>
          </div>
        </div>

        {/* Activity Stream Slider / Grid Container */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="py-5 overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]"
        >
          <div className="flex gap-4 min-w-max pb-2">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className="w-72 sm:w-80 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md hover:border-primary-400/80 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                {/* Card Top: Tag + Time */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getTagBadgeStyle(
                        act.tagColor
                      )}`}
                    >
                      {getTypeIcon(act.type)}
                      <span>{act.tag}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {act.minutesAgo} phút trước
                    </span>
                  </div>

                  {/* Route: From -> To */}
                  <div className="space-y-1 my-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                      <span className="truncate">{act.from}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0 mx-0.5" />
                      <span className="truncate text-slate-800">{act.to}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {act.cargo} • <span className="font-semibold text-slate-700">{act.vehicle}</span>
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Actor & Price */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {act.actor.slice(0, 1)}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[120px]">
                      {act.actor}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-xs">
                      {act.price || "Thỏa thuận"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live CTA Mini Ribbon */}
        <div className="mt-2 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-bold">Bạn đang có hàng cần gửi hoặc xe trống chiều về?</p>
              <p className="text-xs text-blue-100 mt-0.5">
                Đăng đơn miễn phí 100%, thương lượng giá trực tiếp không qua trung gian.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto justify-center">
            <Link
              href="/tracking"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tra cứu đơn</span>
            </Link>
            <a
              href="#download"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-primary-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Tải App kết nối ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${getTagBadgeStyle(
                  selectedActivity.tagColor
                )}`}
              >
                {getTypeIcon(selectedActivity.type)}
                <span>{selectedActivity.tag}</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedActivity.minutesAgo} phút trước
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {selectedActivity.title}
              </h3>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 w-20 flex-shrink-0 font-medium">Lộ trình:</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1 flex-wrap">
                    <span>{selectedActivity.from}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{selectedActivity.to}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-slate-400 w-20 flex-shrink-0 font-medium">Hàng hóa:</span>
                  <span className="font-semibold text-slate-800">{selectedActivity.cargo}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-slate-400 w-20 flex-shrink-0 font-medium">Phương tiện:</span>
                  <span className="font-semibold text-slate-800">{selectedActivity.vehicle}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-slate-400 w-20 flex-shrink-0 font-medium">Cước phí:</span>
                  <span className="font-bold text-emerald-600 text-sm">{selectedActivity.price}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-slate-400 w-20 flex-shrink-0 font-medium">Người tạo:</span>
                  <span className="font-semibold text-slate-800">{selectedActivity.actor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {selectedActivity.orderCode && (
                <Link
                  href={`/tracking?code=${encodeURIComponent(selectedActivity.orderCode)}`}
                  className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Tra cứu đơn này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
