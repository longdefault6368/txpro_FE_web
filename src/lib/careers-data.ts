export type CareerLang = "vi" | "en" | "zh";

export type CareerJob = {
  id: string;
  title: Record<CareerLang, string>;
  team: Record<CareerLang, string>;
  type: Record<CareerLang, string>;
  location: Record<CareerLang, string>;
  salary: Record<CareerLang, string>;
  baseSalaryVnd?: number;
  resumeOptional?: boolean;
  summary: Record<CareerLang, string>;
  overview: Record<CareerLang, string>;
  duties: Record<CareerLang, string[]>;
  requirements: Record<CareerLang, string[]>;
  benefits: Record<CareerLang, string[]>;
};

const negotiable = { vi: "Thương lượng", en: "Negotiable", zh: "面议" };

export const CAREER_JOBS: CareerJob[] = [
  {
    id: "sales",
    title: {
      vi: "Kinh doanh phát triển khách hàng & tài xế (Online)",
      en: "Online Shipper & Driver Acquisition",
      zh: "线上客户与司机拓展专员",
    },
    team: { vi: "Kinh doanh & Đối tác", en: "Sales & Partnerships", zh: "销售与合作" },
    type: { vi: "Làm việc Online", en: "Online / Flexible", zh: "线上办公" },
    location: { vi: "Làm việc Online (Toàn quốc)", en: "Online (Nationwide)", zh: "线上办公（全国）" },
    salary: {
      vi: "Lương cứng 2.000.000 ₫ + thưởng theo khách & mốc đối tác",
      en: "2,000,000 VND base + referral & milestone bonuses",
      zh: "底薪 2,000,000 越南盾 + 注册奖励与里程碑奖金",
    },
    baseSalaryVnd: 2000000,
    resumeOptional: true,
    summary: {
      vi: "Tìm kiếm khách hàng (chủ hàng) và tài xế đăng ký sử dụng ứng dụng TXE PRO hoàn toàn online. Hưởng lương cứng 2.000.000 ₫/tháng cùng chính sách KPI, thưởng từng tài khoản và mốc thưởng giống chương trình Đối tác TXE PRO.",
      en: "Acquire shippers and drivers to sign up on the TXE PRO app 100% online. Earn a 2,000,000 VND monthly base salary plus the same per-account rewards and milestone tiers as the TXE PRO Partner program.",
      zh: "100% 线上拓展货主与司机注册使用 TXE PRO 应用。享每月 2,000,000 越南盾底薪，并享有与 TXE PRO 合作伙伴计划相同的单客奖励与里程碑奖金。",
    },
    overview: {
      vi: "TXE PRO là ứng dụng kết nối chủ hàng và tài xế xe tải (tìm xe, đăng xe trống, ghép hàng tiện chuyến, theo dõi GPS, ví và ký quỹ) đang vận hành trên App Store và Google Play. Vị trí này làm việc 100% online trên toàn quốc với mục tiêu tìm kiếm chủ hàng và tài xế mới đăng ký tài khoản qua mã giới thiệu riêng của bạn. Chính sách KPI, thưởng theo từng tài xế/chủ hàng hợp lệ và các mốc thưởng cấp độ áp dụng giống hệt chương trình Đối tác TXE PRO — điểm khác biệt nổi bật là bạn được hưởng thêm lương cứng 2.000.000 ₫/tháng cùng hệ thống chấm công & báo cáo ngày minh bạch ngay trên trang đối tác.",
      en: "TXE PRO is a live freight platform on App Store and Google Play connecting shippers and truck drivers for booking, empty-truck listings, shared loads, GPS tracking, wallet and escrow. This 100% online nationwide role focuses on bringing new shippers and drivers onto the app through your personal referral code. KPI criteria, per-signup rewards and milestone tiers match the TXE PRO Partner program, with the added advantage of a 2,000,000 VND monthly base salary tracked alongside online attendance and daily reports on the partner portal.",
      zh: "TXE PRO 已在 App Store 和 Google Play 运营，连接货主与货车司机，提供找车、空车发布、拼车配货、GPS 追踪、钱包和担保服务。此岗位面向全国 100% 线上办公，通过专属推荐码拓展新货主与司机注册使用。KPI 标准、单客奖励和里程碑奖金与 TXE PRO 合作伙伴计划一致，并额外提供每月 2,000,000 越南盾固定底薪，以及线上考勤与日报系统。",
    },
    duties: {
      vi: [
        "Tìm kiếm, tiếp cận khách hàng có nhu cầu gửi hàng (chủ hàng, cửa hàng, kho xưởng, doanh nghiệp) và tài xế xe tải qua Facebook, Zalo, TikTok, hội nhóm vận tải hoặc mạng lưới quen biết.",
        "Chia sẻ link và mã giới thiệu cá nhân để hệ thống TXE PRO tự động ghi nhận tài xế và chủ hàng đăng ký thuộc về bạn.",
        "Hướng dẫn tài xế tải app, hoàn tất xác thực eKYC và đăng ký phương tiện hợp lệ; hướng dẫn chủ hàng tạo tài khoản và đặt chuyến hàng đầu tiên.",
        "Chấm công online và gửi báo cáo tiến độ công việc ngắn hằng ngày trực tiếp trên trang quản lý Đối tác TXE PRO (/doi-tac).",
        "Theo dõi số lượng thành viên đã đăng ký, tỷ lệ đủ điều kiện và tiến độ đạt mốc thưởng theo thời gian thực trên tài khoản được cấp.",
      ],
      en: [
        "Reach out to shippers (shops, warehouses, businesses, individuals needing transport) and truck drivers via Facebook, Zalo, TikTok, transport groups or personal networks.",
        "Share your personal referral link and code so TXE PRO automatically attributes every signup to your account.",
        "Guide drivers through app installation, eKYC verification and vehicle registration; guide shippers through signup and completing their first order.",
        "Check in online and submit a brief daily work report directly on the TXE PRO Partner Portal (/doi-tac).",
        "Track registered members, qualification status and milestone progress in real time on your dashboard.",
      ],
      zh: [
        "通过 Facebook、Zalo、TikTok、运输社群或人脉网络拓展货主（商家、仓库、企业）及货车司机。",
        "分享个人专属推荐链接与推荐码，由 TXE PRO 系统自动记录归属。",
        "协助司机下载应用、完成实名认证及车辆登记；协助货主注册并完成首笔订单。",
        "在 TXE PRO 合作伙伴页面（/doi-tac）线上考勤并提交每日工作简报。",
        "在个人后台实时查看注册人数、达标情况及里程碑进度。",
      ],
    },
    requirements: {
      vi: [
        "Có điện thoại hoặc máy tính kết nối Internet, chủ động làm việc online từ bất kỳ đâu trên toàn quốc.",
        "Giao tiếp rõ ràng, chịu khó nhắn tin/tư vấn và theo sát hướng dẫn khách hàng, tài xế hoàn tất đăng ký.",
        "Tuân thủ chấm công online và gửi báo cáo công việc đều đặn mỗi ngày làm việc.",
        "Không yêu cầu kinh nghiệm (được hướng dẫn quy trình và kịch bản tiếp cận); ưu tiên ứng viên từng làm CTV, kinh doanh online hoặc hoạt động trong các hội nhóm vận tải, xe tải.",
        "Không thu phí, không đặt cọc, không ôm hàng — không tạo tài khoản ảo hoặc gian lận giấy tờ.",
      ],
      en: [
        "Own a smartphone or computer with internet access and work remotely from anywhere in Vietnam.",
        "Clear communicator who follows up patiently to help drivers and shippers finish onboarding.",
        "Consistent with daily online check-in and short end-of-day work reports.",
        "No prior experience required (scripts and onboarding guides provided); online sales, affiliate or trucking-group experience is a plus.",
        "Zero upfront fees or deposits; genuine outreach only (no fake accounts or falsified documents).",
      ],
      zh: [
        "自备联网手机或电脑，全国范围内均可线上灵活办公。",
        "沟通清晰，耐心跟进并协助司机和货主完成注册流程。",
        "按要求每日线上考勤并提交工作简报。",
        "不限经验（提供话术和培训指导）；有线上销售、兼职推广或物流社群经验者优先。",
        "零押金、零收费、不囤货；严禁虚假注册或伪造资料。",
      ],
    },
    benefits: {
      vi: [
        "Lương cứng 2.000.000 ₫/tháng (chấm công & theo dõi lương trực tiếp trên hệ thống, thanh toán qua chuyển khoản ngân hàng).",
        "Thưởng trực tiếp theo từng thành viên hợp lệ giống chương trình Đối tác: 30.000 ₫/tài xế (hoàn tất eKYC & đăng ký phương tiện hợp lệ) và 20.000 ₫/chủ hàng (hoàn thành đơn hàng đầu tiên).",
        "Thưởng cộng thêm theo mốc thành viên hợp lệ: 200 người thưởng 1.500.000 ₫ · 500 người thưởng 4.000.000 ₫ · 1.000 người thưởng 9.000.000 ₫ · 2.000 người thưởng 20.000.000 ₫ · 5.000 người thưởng 60.000.000 ₫.",
        "Cấp tài khoản quản lý riêng trên website TXE PRO (/doi-tac) giúp kiểm tra minh bạch từng lượt đăng ký, ngày công và thu nhập.",
        "Làm việc 100% online linh hoạt thời gian và địa điểm trên toàn quốc.",
      ],
      en: [
        "2,000,000 VND monthly base salary with transparent online attendance tracking and bank transfer payout.",
        "Per-member bonuses matching the Partner program: 30,000 VND per qualified driver (verified eKYC + active vehicle) and 20,000 VND per qualified shipper (first completed order).",
        "Additional milestone bonuses by qualified members: 200 → 1,500,000 VND · 500 → 4,000,000 VND · 1,000 → 9,000,000 VND · 2,000 → 20,000,000 VND · 5,000 → 60,000,000 VND.",
        "Dedicated portal account on TXE PRO (/doi-tac) to monitor signups, attendance calendar and earnings in real time.",
        "100% remote nationwide with flexible scheduling.",
      ],
      zh: [
        "每月固定底薪 2,000,000 越南盾，线上透明统计考勤与工资并银行转账发放。",
        "按合作伙伴标准发放单客奖励：有效司机 30,000 越南盾/人（完成实名认证与车辆登记），有效货主 20,000 越南盾/人（完成首单）。",
        "有效成员里程碑额外奖金：200 人奖 1,500,000 越南盾 · 500 人奖 4,000,000 越南盾 · 1,000 人奖 9,000,000 越南盾 · 2,000 人奖 20,000,000 越南盾 · 5,000 人奖 60,000,000 越南盾。",
        "提供 TXE PRO 专属管理账号（/doi-tac），实时查看推广人数、考勤与收益。",
        "全国 100% 线上办公，时间地点灵活。",
      ],
    },
  },
  {
    id: "marketing",
    title: { vi: "Marketing", en: "Marketing", zh: "市场营销" },
    team: { vi: "Marketing", en: "Marketing", zh: "市场" },
    type: { vi: "Toàn thời gian", en: "Full-time", zh: "全职" },
    location: { vi: "TP. Huế", en: "Hue City", zh: "顺化市" },
    salary: negotiable,
    summary: {
      vi: "Xây dựng và phát triển TikTok, Facebook và Facebook Reels của TXE PRO bằng video ngắn cho cộng đồng tài xế, vận tải và logistics.",
      en: "Build TXE PRO on TikTok, Facebook and Facebook Reels with short videos for drivers, transport and logistics.",
      zh: "通过短视频建设 TXE PRO 的 TikTok、Facebook 和 Facebook Reels，面向司机、运输和物流社群。",
    },
    overview: {
      vi: "TXE PRO cần người phụ trách nội dung trên TikTok, Facebook và Facebook Reels. Công việc là lên ý tưởng, sản xuất video ngắn, phát triển cộng đồng tài xế, vận tải và logistics, đồng thời theo dõi hiệu quả để tăng lượt theo dõi, lượt xem và lượt tải ứng dụng.",
      en: "TXE PRO needs someone to run TikTok, Facebook and Facebook Reels. The work is planning and producing short videos, growing the driver, transport and logistics community, and using the results to increase followers, views and app downloads.",
      zh: "TXE PRO 需要专人负责 TikTok、Facebook 和 Facebook Reels。工作包括策划并制作短视频，发展司机、运输和物流社群，并根据效果提升关注、观看和应用下载。",
    },
    duties: {
      vi: [
        "Xây dựng, phát triển và quản lý các kênh TikTok, Facebook, Facebook Reels của TXE PRO.",
        "Lên ý tưởng, lập kế hoạch và sản xuất nội dung video ngắn thu hút người xem.",
        "Quay, dựng, chỉnh sửa video bằng CapCut, Canva hoặc các công cụ phù hợp.",
        "Nghiên cứu xu hướng, sáng tạo nội dung phù hợp với cộng đồng tài xế, vận tải và logistics.",
        "Xây dựng nội dung giới thiệu ứng dụng, hướng dẫn sử dụng, chia sẻ kinh nghiệm và các tình huống thực tế trong ngành vận tải.",
        "Quản lý tương tác, phản hồi bình luận, tin nhắn và phát triển cộng đồng người dùng.",
        "Đề xuất các chiến dịch tăng lượt theo dõi, lượt xem và lượt tải ứng dụng.",
        "Theo dõi, phân tích hiệu quả nội dung và đề xuất phương án cải thiện.",
      ],
      en: [
        "Build, grow and manage TXE PRO channels on TikTok, Facebook and Facebook Reels.",
        "Plan and produce short videos that hold viewers' attention.",
        "Film and edit videos with CapCut, Canva or another suitable tool.",
        "Follow trends and create content for drivers, transport and logistics.",
        "Make videos that introduce the app, explain how to use it, and share real situations in transport.",
        "Reply to comments and messages and grow the user community.",
        "Propose campaigns that increase followers, views and app downloads.",
        "Review content performance and suggest what to improve.",
      ],
      zh: [
        "建设、发展和运营 TXE PRO 的 TikTok、Facebook 和 Facebook Reels。",
        "策划并制作能吸引观众的短视频。",
        "使用 CapCut、Canva 或其他合适工具拍摄和剪辑视频。",
        "研究趋势，为司机、运输和物流社群创作内容。",
        "制作应用介绍、使用教程、经验分享和运输行业真实场景内容。",
        "回复评论和消息，发展用户社群。",
        "提出提升关注、观看和应用下载的活动方案。",
        "跟踪内容效果并提出改进办法。",
      ],
    },
    requirements: {
      vi: [
        "Có kinh nghiệm xây dựng và phát triển kênh TikTok, Facebook.",
        "Biết lên ý tưởng, viết kịch bản, quay và dựng video ngắn.",
        "Có khả năng sáng tạo nội dung, nắm bắt xu hướng mạng xã hội.",
        "Hiểu cách tăng tương tác và phát triển kênh tự nhiên.",
        "Chủ động, sáng tạo, có trách nhiệm và làm việc độc lập tốt.",
        "Ưu tiên ứng viên từng xây kênh từ con số 0 hoặc có sản phẩm thực tế chứng minh năng lực.",
        "Có kiến thức về lĩnh vực vận tải, công nghệ hoặc ứng dụng di động là một lợi thế.",
      ],
      en: [
        "Experience building and growing TikTok and Facebook channels.",
        "Able to plan, script, film and edit short videos.",
        "Creative, and able to spot social trends.",
        "Understands how to grow engagement and a channel organically.",
        "Proactive, responsible and able to work independently.",
        "Preferred: someone who has grown a channel from zero or can show real work.",
        "Knowledge of transport, technology or mobile apps is an advantage.",
      ],
      zh: [
        "有建设和运营 TikTok、Facebook 频道的经验。",
        "能策划、写脚本、拍摄并剪辑短视频。",
        "有内容创意，能把握社交趋势。",
        "了解如何自然提升互动并发展频道。",
        "主动、有创意、有责任心，并能独立工作。",
        "曾从零建设频道或有实际作品证明能力者优先。",
        "了解运输、科技或移动应用者优先。",
      ],
    },
    benefits: {
      vi: [
        "Làm nội dung cho ứng dụng vận tải đang vận hành tại TP. Huế.",
        "Được chủ động đề xuất chủ đề và chiến dịch trên các kênh của TXE PRO.",
        "Mức lương thương lượng theo kinh nghiệm và sản phẩm đã làm.",
      ],
      en: [
        "Create content for a live transport app in Hue City.",
        "Propose topics and campaigns for TXE PRO's own channels.",
        "Pay is negotiable based on experience and previous work.",
      ],
      zh: [
        "为顺化市正在运营的运输应用制作内容。",
        "可以主动为 TXE PRO 的频道提出选题和活动。",
        "薪资按经验和已有作品面议。",
      ],
    },
  },
  {
    id: "cskh",
    title: { vi: "Chăm sóc khách hàng", en: "Customer support", zh: "客户服务" },
    team: { vi: "Vận hành", en: "Operations", zh: "运营" },
    type: { vi: "Toàn thời gian", en: "Full-time", zh: "全职" },
    location: { vi: "TP. Huế", en: "Hue City", zh: "顺化市" },
    salary: negotiable,
    summary: {
      vi: "Tiếp nhận yêu cầu của chủ hàng và tài xế trên ứng dụng đang vận hành, hướng dẫn thao tác và theo dõi đến khi có kết quả.",
      en: "Handle shipper and driver requests on the live app, guide the steps and follow each case to an outcome.",
      zh: "处理正在运营的应用中货主和司机的请求，指导操作并跟进到有结果。",
    },
    overview: {
      vi: "TXE PRO đang vận hành ứng dụng và website cho chủ hàng, tài xế: tìm xe, đăng xe trống, ghép chuyến, theo dõi GPS, ví điện tử và ký quỹ. Người nhận vị trí này là đầu mối trả lời yêu cầu hằng ngày, kiểm tra đúng đơn trước khi hướng dẫn và không đóng yêu cầu khi chưa có hướng xử lý.",
      en: "TXE PRO already runs the app and website shippers and drivers use to find vehicles, post availability, match trips, track GPS, use the wallet and manage escrow. This role answers daily requests, checks the right order before giving guidance and keeps each request open until there is a clear next step.",
      zh: "TXE PRO 的应用和网站已在运营，货主和司机用它找车、发布空车、匹配行程、追踪 GPS、使用钱包和管理担保。此职位负责处理每日请求，在指导前核对正确订单，并在有明确处理方向前持续跟进。",
    },
    duties: {
      vi: [
        "Tiếp nhận hotline, tin nhắn và yêu cầu trong ứng dụng từ chủ hàng, tài xế.",
        "Hướng dẫn tìm xe, đăng xe trống, nhận chuyến, theo dõi đơn, ví và ký quỹ trên sản phẩm đang chạy.",
        "Đối chiếu mã đơn, trạng thái chuyến, thời gian và địa điểm trước khi trả lời.",
        "Ghi nhận sự cố, chuyển vận hành hoặc kỹ thuật và cập nhật lại cho người gửi.",
        "Gom các câu hỏi lặp lại để bộ phận sản phẩm chỉnh nội dung hướng dẫn.",
      ],
      en: [
        "Answer the hotline, messages and in-app requests from shippers and drivers.",
        "Guide people through finding a vehicle, posting availability, accepting a trip, tracking, the wallet and escrow on the live product.",
        "Check the order code, trip status, time and place before replying.",
        "Record incidents, pass them to operations or engineering and update the person who asked.",
        "Collect repeated questions so the product team can improve the guides.",
      ],
      zh: [
        "接听热线、消息和应用内来自货主、司机的请求。",
        "指导对方在正在运营的产品上找车、发布空车、接单、追踪、使用钱包和担保。",
        "回复前核对订单号、行程状态、时间和地点。",
        "记录问题，转给运营或技术团队，并向提问人反馈进展。",
        "汇总重复问题，供产品团队改进说明。",
      ],
    },
    requirements: {
      vi: [
        "Nói và viết tiếng Việt rõ, kiên nhẫn khi người dùng chưa quen thao tác.",
        "Cẩn thận với mã đơn, số điện thoại, thời gian và địa điểm.",
        "Dùng được điện thoại và máy tính để tra cứu đơn.",
        "Có thể làm theo ca trong giờ hỗ trợ tại TP. Huế.",
        "Ưu tiên người đã làm chăm sóc khách hàng, tổng đài hoặc vận hành vận tải.",
      ],
      en: [
        "Clear spoken and written Vietnamese, and patience when someone is new to the app.",
        "Careful with order codes, phone numbers, times and places.",
        "Able to look up an order on a phone and a computer.",
        "Can work support shifts in Hue City.",
        "Customer support, hotline or transport operations experience is preferred.",
      ],
      zh: [
        "越南语表达清楚，用户不熟悉操作时能保持耐心。",
        "仔细核对订单号、电话、时间和地点。",
        "能用手机和电脑查询订单。",
        "可以在顺化市按支持时段轮班。",
        "有客户服务、热线或运输运营经验者优先。",
      ],
    },
    benefits: {
      vi: [
        "Làm việc tại TP. Huế với sản phẩm đang có chủ hàng và tài xế sử dụng.",
        "Được hướng dẫn quy trình đơn, chuyến, ví và ký quỹ trước khi trực tiếp hỗ trợ.",
        "Mức lương thương lượng theo kinh nghiệm và ca làm việc.",
      ],
      en: [
        "Work in Hue City on a product shippers and drivers already use.",
        "Learn the order, trip, wallet and escrow flow before taking live requests.",
        "Pay is negotiable based on experience and shifts.",
      ],
      zh: [
        "在顺化市工作，产品已有货主和司机使用。",
        "正式支持前会先了解订单、行程、钱包和担保流程。",
        "薪资按经验和班次面议。",
      ],
    },
  },
  {
    id: "ops",
    title: { vi: "Điều phối vận hành", en: "Trip operations", zh: "行程调度" },
    team: { vi: "Vận hành", en: "Operations", zh: "运营" },
    type: { vi: "Toàn thời gian", en: "Full-time", zh: "全职" },
    location: { vi: "TP. Huế", en: "Hue City", zh: "顺化市" },
    salary: negotiable,
    summary: {
      vi: "Theo dõi chuyến đang chạy, hỗ trợ ghép xe và phối hợp khi có thay đổi hoặc sự cố trên đường.",
      en: "Watch live trips, help match vehicles and coordinate when a trip changes or something goes wrong on the road.",
      zh: "关注进行中的行程，协助匹配车辆，并在行程变化或途中出现问题时协调处理。",
    },
    overview: {
      vi: "Sau khi chủ hàng và tài xế đã ghép được nhau trên TXE PRO, chuyến đi cần người theo dõi thời gian, điểm đón, điểm trả và các tình huống phát sinh. Vị trí điều phối tại TP. Huế bám các chuyến đang chạy, hỗ trợ hai bên thống nhất thay đổi và phối hợp xử lý sự cố cho đến khi chuyến có kết quả.",
      en: "After a shipper and driver match on TXE PRO, someone needs to watch the time, pickup, drop-off and anything that changes. This Hue City role follows active trips, helps both sides agree on changes and coordinates incidents until the trip has an outcome.",
      zh: "货主和司机在 TXE PRO 匹配后，需要有人关注时间、接货点、送货点和临时变化。此顺化市职位跟进进行中的行程，协助双方确认变更，并协调处理问题直到行程有结果。",
    },
    duties: {
      vi: [
        "Theo dõi danh sách chuyến đã ghép, chuyến đang chạy và các mốc nhận, trả hàng.",
        "Hỗ trợ tài xế và chủ hàng khi đổi giờ, đổi điểm hoặc thay đổi hàng hóa.",
        "Kiểm tra vị trí GPS và trạng thái chuyến trước khi hướng dẫn bước tiếp theo.",
        "Phối hợp sự cố trên đường với chăm sóc khách hàng và ghi lại kết quả xử lý.",
        "Báo các điểm nghẽn lặp lại để sản phẩm và vận hành chỉnh quy trình.",
      ],
      en: [
        "Watch matched trips, trips in progress and the pickup and drop-off milestones.",
        "Help drivers and shippers when the time, place or cargo changes.",
        "Check GPS and trip status before telling either side what to do next.",
        "Coordinate roadside issues with customer support and record the outcome.",
        "Report repeated blockers so product and operations can adjust the process.",
      ],
      zh: [
        "关注已匹配行程、进行中行程以及接货和送货节点。",
        "在时间、地点或货物变化时协助司机和货主。",
        "指导下一步前先核对 GPS 和行程状态。",
        "与客户服务一起协调途中问题并记录处理结果。",
        "汇报反复出现的阻塞点，供产品和运营调整流程。",
      ],
    },
    requirements: {
      vi: [
        "Cẩn thận với thời gian, địa điểm, biển số và trạng thái chuyến.",
        "Bình tĩnh khi có nhiều chuyến cần xử lý cùng lúc.",
        "Đọc được thông tin đơn trên ứng dụng và trao đổi rõ qua điện thoại.",
        "Làm việc tại TP. Huế, theo khung giờ vận hành.",
        "Ưu tiên người đã điều phối vận tải, kho, tổng đài hoặc theo dõi đội xe.",
      ],
      en: [
        "Careful with time, place, vehicle plates and trip status.",
        "Stays calm when several trips need attention at once.",
        "Can read an order in the app and explain the next step clearly by phone.",
        "Works in Hue City during operating hours.",
        "Dispatch, warehouse, hotline or fleet-monitoring experience is preferred.",
      ],
      zh: [
        "仔细核对时间、地点、车牌和行程状态。",
        "多趟行程同时需要处理时能保持冷静。",
        "能在应用中查看订单，并通过电话清楚说明下一步。",
        "在顺化市按运营时间工作。",
        "有调度、仓储、热线或车队跟踪经验者优先。",
      ],
    },
    benefits: {
      vi: [
        "Theo dõi chuyến thật, có GPS và trạng thái đơn trên hệ thống đang chạy.",
        "Làm việc cùng chăm sóc khách hàng và kinh doanh đối tác tại TP. Huế.",
        "Mức lương thương lượng theo kinh nghiệm điều phối.",
      ],
      en: [
        "Follow real trips, with GPS and order status on the live system.",
        "Work with customer support and partnerships in Hue City.",
        "Pay is negotiable based on dispatch experience.",
      ],
      zh: [
        "追踪真实行程，正在运行的系统提供 GPS 和订单状态。",
        "在顺化市与客户服务和合作销售一起工作。",
        "薪资按调度经验面议。",
      ],
    },
  },
  {
    id: "engineer",
    title: { vi: "Kỹ sư phần mềm", en: "Software engineer", zh: "软件工程师" },
    team: { vi: "Sản phẩm", en: "Product", zh: "产品" },
    type: { vi: "Toàn thời gian", en: "Full-time", zh: "全职" },
    location: { vi: "TP. Huế / từ xa", en: "Hue City / remote", zh: "顺化市 / 远程" },
    salary: negotiable,
    summary: {
      vi: "Phát triển và bảo trì ứng dụng, website đang chạy: đăng tin, ghép xe, theo dõi chuyến, ví và thông báo.",
      en: "Build and maintain the live app and website: listings, matching, trip tracking, wallets and notifications.",
      zh: "开发和维护正在运行的应用与网站：发布信息、匹配、行程追踪、钱包和通知。",
    },
    overview: {
      vi: "TXE PRO đã có ứng dụng cho chủ hàng và tài xế, website và hệ thống phía sau cho đăng tin, ghép chuyến, theo dõi GPS, ví, ký quỹ và thông báo. Vị trí kỹ sư làm việc trên chính các luồng này: thêm tính năng, sửa lỗi người dùng đang gặp và kiểm tra cùng vận hành trước khi đưa lên bản đang chạy.",
      en: "TXE PRO already has the shipper and driver apps, the website and the backend for listings, matching, GPS tracking, wallets, escrow and notifications. This role works on those live flows: add features, fix problems people are hitting and check them with operations before release.",
      zh: "TXE PRO 已有货主和司机应用、网站以及发布、匹配、GPS 追踪、钱包、担保和通知的后台。此职位就在这些正在运行的流程上工作：增加功能、修复用户遇到的问题，并在发布前与运营一起检查。",
    },
    duties: {
      vi: [
        "Làm tính năng cho đăng tin, ghép xe, theo dõi chuyến, ví, ký quỹ hoặc thông báo.",
        "Sửa lỗi phát sinh từ ứng dụng và website đang có người dùng.",
        "Đọc luồng chủ hàng và tài xế trước khi sửa, tránh làm đứt đơn đang chạy.",
        "Phối hợp vận hành để kiểm tra trên dữ liệu và tình huống thật.",
        "Ghi lại thay đổi ảnh hưởng tới đăng tin, trạng thái chuyến hoặc thanh toán.",
      ],
      en: [
        "Build features for listings, matching, trip tracking, wallets, escrow or notifications.",
        "Fix defects found in the app and website people are using.",
        "Read the shipper and driver flow before changing it so a live order is not broken.",
        "Check changes with operations against real data and situations.",
        "Record changes that affect posting, trip status or payment.",
      ],
      zh: [
        "开发发布、匹配、行程追踪、钱包、担保或通知功能。",
        "修复用户正在使用的应用和网站中的问题。",
        "修改前先阅读货主和司机流程，避免中断正在进行的订单。",
        "与运营一起用真实数据和场景检查变更。",
        "记录影响发布、行程状态或支付的改动。",
      ],
    },
    requirements: {
      vi: [
        "Có kinh nghiệm web, ứng dụng di động hoặc backend và đọc được code sẵn có.",
        "Tự kiểm tra luồng chính trước khi bàn giao: đăng tin, nhận chuyến, theo dõi, thông báo.",
        "Cẩn thận với dữ liệu đơn, vị trí và số dư.",
        "Có thể làm việc tại TP. Huế hoặc từ xa theo thỏa thuận.",
        "Ưu tiên người đã làm sản phẩm có người dùng thật, bản đồ hoặc thanh toán.",
      ],
      en: [
        "Experience in web, mobile or backend work and the ability to read an existing codebase.",
        "Checks the main flow before handoff: posting, accepting a trip, tracking and notifications.",
        "Careful with order data, location and balances.",
        "Can work in Hue City or remotely by agreement.",
        "Experience on a product with real users, maps or payments is preferred.",
      ],
      zh: [
        "具备网站、移动应用或后端经验，并能阅读现有代码。",
        "交付前自行检查主流程：发布、接单、追踪和通知。",
        "谨慎处理订单数据、位置和余额。",
        "可按约定在顺化市或远程工作。",
        "有真实用户产品、地图或支付经验者优先。",
      ],
    },
    benefits: {
      vi: [
        "Làm trên ứng dụng và website đang vận hành, thấy được chuyến và phản hồi của người dùng.",
        "Phối hợp trực tiếp với vận hành tại TP. Huế khi cần kiểm tra luồng.",
        "Mức lương thương lượng theo kinh nghiệm và phạm vi công việc.",
      ],
      en: [
        "Work on the operating app and website and see real trips and user feedback.",
        "Work directly with the Hue City operations team when a flow needs checking.",
        "Pay is negotiable based on experience and the scope of work.",
      ],
      zh: [
        "在正在运营的应用和网站上工作，能看到真实行程和用户反馈。",
        "需要检查流程时直接与顺化市运营团队配合。",
        "薪资按经验和工作范围面议。",
      ],
    },
  },
];
