export type Language = "vi" | "en" | "zh";

export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header & Nav
    "nav.howItWorks": "Cách Hoạt Động",
    "nav.features": "Tính Năng",
    "nav.pricing": "Chi Phí",
    "nav.tracking": "Tra Cứu Đơn",
    "nav.admin": "Quản Trị",
    "nav.login": "Đăng Nhập",
    "nav.register": "Đăng Ký",
    "nav.logout": "Đăng Xuất",
    "nav.download": "Tải Ứng Dụng",
    "nav.workspace": "Bàn Làm Việc",

    // Hero Section
    "hero.badge": "Kỷ Nguyên Vận Tải Số Mới",
    "hero.title1": "Hệ Sinh Thái Vận Tải",
    "hero.title2": "Thông Minh & Tối Ưu",
    "hero.subtitle": "Kết nối Chủ hàng và Tài xế thời gian thực. Tối ưu hóa lộ trình xe rỗng, minh bạch chi phí, đảm bảo an toàn tuyệt đối.",
    "hero.placeholder": "Nhập mã vận đơn của bạn để tra cứu...",
    "hero.track": "Tra Cứu",
    "hero.forShipper": "Cho Chủ Hàng",
    "hero.forDriver": "Cho Tài Xế",
    "hero.statsShippers": "Chủ hàng tin dùng",
    "hero.statsDrivers": "Tài xế chuyên nghiệp",
    "hero.statsTrips": "Chuyến xe thành công",

    // How It Works Section
    "how.title": "Hoạt Động Như Thế Nào?",
    "how.subtitle": "Chỉ với vài thao tác đơn giản trên ứng dụng web và di động để bắt đầu hành trình vận chuyển tối ưu",
    "how.shipper": "Dành Cho Chủ Hàng",
    "how.driver": "Dành Cho Tài Xế",
    "how.shipper.step1.title": "1. Đăng đơn vận chuyển",
    "how.shipper.step1.desc": "Nhập thông tin hàng hóa, địa điểm giao nhận và ngân sách đề xuất của bạn.",
    "how.shipper.step2.title": "2. Khớp tài xế nhanh chóng",
    "how.shipper.step2.desc": "Hệ thống tự động đề xuất tài xế phù hợp nhất ở khu vực lân cận.",
    "how.shipper.step3.title": "3. Theo dõi & Thanh toán",
    "how.shipper.step3.desc": "Giám sát vị trí hàng hóa thời gian thực và thanh toán an toàn qua cổng Escrow.",
    "how.driver.step1.title": "1. Nhận yêu cầu chạy đơn",
    "how.driver.step1.desc": "Nhận thông báo đơn hàng phù hợp dọc theo lộ trình xe trống của bạn.",
    "how.driver.step2.title": "2. Xác nhận & Vận chuyển",
    "how.driver.step2.desc": "Nhận hàng tại kho và tiến hành vận chuyển an toàn theo định vị bản đồ.",
    "how.driver.step3.title": "3. Hoàn thành & Nhận cước",
    "how.driver.step3.desc": "Giao hàng thành công, nhận tiền cước lập tức về ví tài khoản.",

    // Features Section
    "features.title": "Tính Năng Vượt Trội",
    "features.subtitle": "TXEPRO cung cấp bộ giải pháp công nghệ toàn diện phục vụ ngành vận tải logisitics thời đại số",
    "features.f1.title": "Khớp Đơn AI Thời Gian Thực",
    "features.f1.desc": "Thuật toán tối ưu vị trí giúp kết nối xe tải trống với đơn hàng gần nhất chỉ trong 30 giây.",
    "features.f2.title": "Giám Sát Vận Lộ Trình Live GPS",
    "features.f2.desc": "Cập nhật vị trí phương tiện liên tục 5 giây/lần trên bản đồ Google Maps sắc nét.",
    "features.f3.title": "Bảo Mật Giao Dịch Escrow",
    "features.f3.desc": "Dòng tiền cước phí được tạm khóa an toàn và chỉ giải ngân khi người nhận ký biên bản giao nhận.",
    "features.f4.title": "Xác Thực eKYC Nghiêm Ngặt",
    "features.f4.desc": "100% hồ sơ tài xế và doanh nghiệp chủ hàng được đối soát định danh quốc gia CCCD tự động.",
    "features.f5.title": "Tối Ưu Chi Phí 30%",
    "features.f5.desc": "Giảm thiểu tối đa lãng phí chạy xe rỗng chiều về giúp tăng thu nhập cho tài xế và hạ giá cước.",
    "features.f6.title": "Hỗ Trợ Sự Cố Khẩn Cấp 24/7",
    "features.f6.desc": "Đường dây nóng và cứu hộ hiện trường hỗ trợ xử lý mọi trục trặc dọc tuyến đường tức thì.",

    // Stats Section
    "stats.title": "Con Số Biết Nói",
    "stats.subtitle": "Hành trình phát triển mạnh mẽ của hệ sinh thái vận tải số thông minh TXEPRO",
    "stats.s1": "Đối tác tài xế",
    "stats.s2": "Doanh nghiệp chủ hàng",
    "stats.s3": "Đơn hàng hoàn thành",
    "stats.s4": "Tỉ lệ hài lòng",

    // Download Section
    "download.title": "Tải Ứng Dụng TXEPRO Ngay Hôm Nay",
    "download.subtitle": "Trải nghiệm giải pháp vận tải công nghệ cao cấp ngay trên chiếc điện thoại của bạn. Tương thích hoàn hảo với các hệ điều hành iOS và Android.",
    "download.appstore": "Tải từ App Store",
    "download.playstore": "Tải từ Google Play",

    // Footer
    "footer.desc": "Hệ sinh thái công nghệ vận tải thông minh hàng đầu Việt Nam. Tối ưu chi phí logistics, gia tăng hiệu quả vận hành.",
    "footer.links": "Liên kết nhanh",
    "footer.support": "Hỗ trợ khách hàng",
    "footer.contact": "Liên hệ với chúng tôi",
    "footer.rights": "Tất cả quyền được bảo lưu.",

    // Interactive Widget
    "widget.chat": "Trợ lý AI hỗ trợ bạn",
    "widget.scroll": "Lên đầu trang",

    // Common Dashboard terms
    "db.welcome": "Chào mừng,",
    "db.role": "Vai trò",
    "db.shipper": "Chủ Hàng",
    "db.driver": "Tài Xế",
    "db.admin": "Quản Trị",
    "db.phone": "Số điện thoại",
    "db.email": "Email",
    "db.status": "Trạng thái",
    "db.logout": "Đăng xuất"
  },
  en: {
    // Header & Nav
    "nav.howItWorks": "How It Works",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.tracking": "Track Order",
    "nav.admin": "Admin",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.download": "Download App",
    "nav.workspace": "Workspace",

    // Hero Section
    "hero.badge": "🚀 New Era of Digital Logistics",
    "hero.title1": "Smart & Optimized",
    "hero.title2": "Logistics Ecosystem",
    "hero.subtitle": "Connecting Shippers and Drivers in real-time. Optimize empty truck routes, transparent pricing, absolute safety.",
    "hero.placeholder": "Enter your tracking code to search...",
    "hero.track": "Track",
    "hero.forShipper": "For Shippers",
    "hero.forDriver": "For Drivers",
    "hero.statsShippers": "Trusted Shippers",
    "hero.statsDrivers": "Professional Drivers",
    "hero.statsTrips": "Completed Trips",

    // How It Works Section
    "how.title": "How Does It Work?",
    "how.subtitle": "Start your optimized transport journey in just a few simple steps on mobile and web app",
    "how.shipper": "For Shippers",
    "how.driver": "For Drivers",
    "how.shipper.step1.title": "1. Post transport order",
    "how.shipper.step1.desc": "Enter cargo details, pickup/dropoff addresses, and your proposed budget.",
    "how.shipper.step2.title": "2. Match drivers quickly",
    "how.shipper.step2.desc": "The system automatically suggests the most suitable driver in the local area.",
    "how.shipper.step3.title": "3. Track & Pay",
    "how.shipper.step3.desc": "Monitor live cargo location and release payment safely via Escrow portal.",
    "how.driver.step1.title": "1. Receive matching requests",
    "how.driver.step1.desc": "Get notified of suitable cargo matching your empty backhaul route.",
    "how.driver.step2.title": "2. Confirm & Transport",
    "how.driver.step2.desc": "Pick up cargo at warehouse and execute transportation safely with GPS navigation.",
    "how.driver.step3.title": "3. Deliver & Cash out",
    "how.driver.step3.desc": "Deliver successfully and receive payment immediately into your wallet.",

    // Features Section
    "features.title": "Key Features",
    "features.subtitle": "TXEPRO provides a comprehensive technology suite serving modern logistics in the digital age",
    "features.f1.title": "Real-time AI Matching",
    "features.f1.desc": "Location optimization algorithm connects empty trucks to nearest cargo in 30 seconds.",
    "features.f2.title": "Live GPS Route Tracking",
    "features.f2.desc": "Continuously update vehicle coordinates every 5 seconds on Google Maps.",
    "features.f3.title": "Secure Escrow Payment",
    "features.f3.desc": "Fare funds are safely locked in escrow and only released once recipient signs delivery proof.",
    "features.f4.title": "Strict eKYC Verification",
    "features.f4.desc": "100% profiles of drivers and shippers are auto-verified with national ID identity check.",
    "features.f5.title": "30% Cost Optimization",
    "features.f5.desc": "Minimize wasteful empty backhauls to increase driver income and lower shipping costs.",
    "features.f6.title": "24/7 Emergency Support",
    "features.f6.desc": "Emergency hotline and road rescue team assist driver issues immediately on route.",

    // Stats Section
    "stats.title": "Metrics that Matter",
    "stats.subtitle": "The rapid growth of TXEPRO's smart digital logistics ecosystem",
    "stats.s1": "Driver Partners",
    "stats.s2": "Shipper Enterprises",
    "stats.s3": "Completed Shipments",
    "stats.s4": "Satisfaction Rate",

    // Download Section
    "download.title": "Download TXEPRO App Today",
    "download.subtitle": "Experience advanced technological logistics directly on your smartphone. Perfectly compatible with iOS and Android.",
    "download.appstore": "Download on App Store",
    "download.playstore": "Get it on Google Play",

    // Footer
    "footer.desc": "Leading intelligent logistics technology ecosystem in Vietnam. Optimize logistics cost, increase operation efficiency.",
    "footer.links": "Quick Links",
    "footer.support": "Customer Support",
    "footer.contact": "Contact Us",
    "footer.rights": "All rights reserved.",

    // Interactive Widget
    "widget.chat": "AI Assistant is here",
    "widget.scroll": "Back to top",

    // Common Dashboard terms
    "db.welcome": "Welcome back,",
    "db.role": "Role",
    "db.shipper": "Shipper",
    "db.driver": "Driver",
    "db.admin": "Admin",
    "db.phone": "Phone",
    "db.email": "Email",
    "db.status": "Status",
    "db.logout": "Logout"
  },
  zh: {
    // Header & Nav
    "nav.howItWorks": "运作方式",
    "nav.features": "平台特色",
    "nav.pricing": "费用预算",
    "nav.tracking": "运单查询",
    "nav.admin": "管理后台",
    "nav.login": "账号登录",
    "nav.register": "立即注册",
    "nav.logout": "退出登录",
    "nav.download": "下载应用",
    "nav.workspace": "工作控制台",

    // Hero Section
    "hero.badge": "🚀 智慧物流与智能货运新纪元",
    "hero.title1": "智能与优化的",
    "hero.title2": "货运物流生态系统",
    "hero.subtitle": "实时连接货主与司机。优化返程空车，透明运价，确保货物运输绝对安全。",
    "hero.placeholder": "请输入您的追踪运单号进行查询...",
    "hero.track": "查询",
    "hero.forShipper": "货主入口",
    "hero.forDriver": "司机入口",
    "hero.statsShippers": "入驻货主企业",
    "hero.statsDrivers": "认证专业司机",
    "hero.statsTrips": "成功物流趟数",

    // How It Works Section
    "how.title": "平台如何运作？",
    "how.subtitle": "只需在移动端或网页端进行简单操作，即可开启高效低成本的货运之旅",
    "how.shipper": "货主指南",
    "how.driver": "司机指南",
    "how.shipper.step1.title": "1. 发布运单",
    "how.shipper.step1.desc": "输入货物详情、装卸货地址以及您的合理运费预算。",
    "how.shipper.step2.title": "2. 智能匹配司机",
    "how.shipper.step2.desc": "系统根据距离和车型自动推荐周边最合适的认证司机。",
    "how.shipper.step3.title": "3. 轨迹追踪与结款",
    "how.shipper.step3.desc": "实时查看地图上的货运动态，收货人签收后通过Escrow安全结算。",
    "how.driver.step1.title": "1. 接收运单推荐",
    "how.driver.step1.desc": "根据您空载车辆的回程路线，精准推荐沿途货源。",
    "how.driver.step2.title": "2. 确认装货与运输",
    "how.driver.step2.desc": "前往仓库装货，按导航路线安全将货物送达目的地。",
    "how.driver.step3.title": "3. 签收与提现",
    "how.driver.step3.desc": "货物妥投签收后，运费即刻打入您的钱包，可随时提现。",

    // Features Section
    "features.title": "平台核心优势",
    "features.subtitle": "TXEPRO 提供一站式数字化物流解决方案，助力货运进入智能科技时代",
    "features.f1.title": "智能AI秒级匹配",
    "features.f1.desc": "基于定位与大数据的匹配算法，最快30秒将货源与空车匹配成功。",
    "features.f2.title": "实时高频GPS追踪",
    "features.f2.desc": "每5秒更新一次车辆坐标，在谷歌地图上清晰呈现货车运行轨迹。",
    "features.f3.title": "Escrow交易信用担保",
    "features.f3.desc": "运费资金暂押在担保账户中，凭签收回单安全解冻给司机，保障双方利益。",
    "features.f4.title": "严格实名eKYC认证",
    "features.f4.desc": "所有司机及货主必须通过国家身份证照、人脸识别和执照的自动化比对审核。",
    "features.f5.title": "降低30%运输成本",
    "features.f5.desc": "有效减少车辆空驶率，司机回程不空跑增加收入，货主享受更低运价。",
    "features.f6.title": "24/7 全天候紧急救援",
    "features.f6.desc": "设有专门的应急热线，协同路面救援队伍第一时间处理运输途中的意外事故。",

    // Stats Section
    "stats.title": "数据见证实力",
    "stats.subtitle": "智能物流生态系统TXEPRO蓬勃发展的前行足迹",
    "stats.s1": "认证司机伙伴",
    "stats.s2": "合作货主企业",
    "stats.s3": "累计完成运单",
    "stats.s4": "好评客户占比",

    // Download Section
    "download.title": "立即下载 TXEPRO 应用客户端",
    "download.subtitle": "在您的智能手机上即刻体验高科技运输物流带来的便利。完美兼容苹果 iOS 和安卓 Android 系统。",
    "download.appstore": "前往 App Store 下载",
    "download.playstore": "前往 Google Play 下载",

    // Footer
    "footer.desc": "越南领先的智能运输科技生态系统。优化物流链成本，提升供应链运营效能。",
    "footer.links": "快捷菜单",
    "footer.support": "客户支持",
    "footer.contact": "联系我们",
    "footer.rights": "版权所有。",

    // Interactive Widget
    "widget.chat": "智能AI客服在线",
    "widget.scroll": "返回顶部",

    // Common Dashboard terms
    "db.welcome": "欢迎回来，",
    "db.role": "身份角色",
    "db.shipper": "货主",
    "db.driver": "司机",
    "db.admin": "管理员",
    "db.phone": "联系电话",
    "db.email": "电子邮箱",
    "db.status": "状态",
    "db.logout": "退出登录"
  }
};
