"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Banknote, Briefcase, CheckCircle2, MapPin, Send, Upload, X } from "lucide-react";
import SubpageHeroBanner from "@/components/common/SubpageHeroBanner";
import { useLanguage } from "@/context/LanguageContext";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import { postingRequest } from "@/utils/posting-api";

type Lang = "vi" | "en" | "zh";

type Job = {
  id: string;
  title: Record<Lang, string>;
  team: Record<Lang, string>;
  type: Record<Lang, string>;
  location: Record<Lang, string>;
  salary: Record<Lang, string>;
  summary: Record<Lang, string>;
  overview: Record<Lang, string>;
  duties: Record<Lang, string[]>;
  requirements: Record<Lang, string[]>;
  benefits: Record<Lang, string[]>;
};

const negotiable = { vi: "Thương lượng", en: "Negotiable", zh: "面议" };

const jobs: Job[] = [
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
      vi: ["Làm nội dung cho ứng dụng vận tải đang vận hành tại TP. Huế.", "Được chủ động đề xuất chủ đề và chiến dịch trên các kênh của TXE PRO.", "Mức lương thương lượng theo kinh nghiệm và sản phẩm đã làm."],
      en: ["Create content for a live transport app in Hue City.", "Propose topics and campaigns for TXE PRO's own channels.", "Pay is negotiable based on experience and previous work."],
      zh: ["为顺化市正在运营的运输应用制作内容。", "可以主动为 TXE PRO 的频道提出选题和活动。", "薪资按经验和已有作品面议。"],
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
      vi: ["Tiếp nhận hotline, tin nhắn và yêu cầu trong ứng dụng từ chủ hàng, tài xế.", "Hướng dẫn tìm xe, đăng xe trống, nhận chuyến, theo dõi đơn, ví và ký quỹ trên sản phẩm đang chạy.", "Đối chiếu mã đơn, trạng thái chuyến, thời gian và địa điểm trước khi trả lời.", "Ghi nhận sự cố, chuyển vận hành hoặc kỹ thuật và cập nhật lại cho người gửi.", "Gom các câu hỏi lặp lại để bộ phận sản phẩm chỉnh nội dung hướng dẫn."],
      en: ["Answer the hotline, messages and in-app requests from shippers and drivers.", "Guide people through finding a vehicle, posting availability, accepting a trip, tracking, the wallet and escrow on the live product.", "Check the order code, trip status, time and place before replying.", "Record incidents, pass them to operations or engineering and update the person who asked.", "Collect repeated questions so the product team can improve the guides."],
      zh: ["接听热线、消息和应用内来自货主、司机的请求。", "指导对方在正在运营的产品上找车、发布空车、接单、追踪、使用钱包和担保。", "回复前核对订单号、行程状态、时间和地点。", "记录问题，转给运营或技术团队，并向提问人反馈进展。", "汇总重复问题，供产品团队改进说明。"],
    },
    requirements: {
      vi: ["Nói và viết tiếng Việt rõ, kiên nhẫn khi người dùng chưa quen thao tác.", "Cẩn thận với mã đơn, số điện thoại, thời gian và địa điểm.", "Dùng được điện thoại và máy tính để tra cứu đơn.", "Có thể làm theo ca trong giờ hỗ trợ tại TP. Huế.", "Ưu tiên người đã làm chăm sóc khách hàng, tổng đài hoặc vận hành vận tải."],
      en: ["Clear spoken and written Vietnamese, and patience when someone is new to the app.", "Careful with order codes, phone numbers, times and places.", "Able to look up an order on a phone and a computer.", "Can work support shifts in Hue City.", "Customer support, hotline or transport operations experience is preferred."],
      zh: ["越南语表达清楚，用户不熟悉操作时能保持耐心。", "仔细核对订单号、电话、时间和地点。", "能用手机和电脑查询订单。", "可以在顺化市按支持时段轮班。", "有客户服务、热线或运输运营经验者优先。"],
    },
    benefits: {
      vi: ["Làm việc tại TP. Huế với sản phẩm đang có chủ hàng và tài xế sử dụng.", "Được hướng dẫn quy trình đơn, chuyến, ví và ký quỹ trước khi trực tiếp hỗ trợ.", "Mức lương thương lượng theo kinh nghiệm và ca làm việc."],
      en: ["Work in Hue City on a product shippers and drivers already use.", "Learn the order, trip, wallet and escrow flow before taking live requests.", "Pay is negotiable based on experience and shifts."],
      zh: ["在顺化市工作，产品已有货主和司机使用。", "正式支持前会先了解订单、行程、钱包和担保流程。", "薪资按经验和班次面议。"],
    },
  },
  {
    id: "sales",
    title: { vi: "Kinh doanh đối tác", en: "Partnership sales", zh: "合作销售" },
    team: { vi: "Kinh doanh", en: "Sales", zh: "销售" },
    type: { vi: "Toàn thời gian", en: "Full-time", zh: "全职" },
    location: { vi: "TP. Huế", en: "Hue City", zh: "顺化市" },
    salary: negotiable,
    summary: {
      vi: "Kết nối doanh nghiệp vận tải, chủ hàng và đội xe với TXE PRO, rồi đồng hành khi họ đăng tin, nhận chuyến và theo dõi trên nền tảng đang vận hành.",
      en: "Connect transport businesses, shippers and fleets with TXE PRO and stay with them as they post, accept and track trips on the live platform.",
      zh: "连接运输企业、货主和车队，并在他们于正在运营的平台上发布、接单和追踪行程时持续配合。",
    },
    overview: {
      vi: "Sản phẩm TXE PRO đã hoạt động: chủ hàng tìm xe, tài xế đăng xe trống, hai bên ghép chuyến và theo dõi trên ứng dụng. Vị trí này tìm đối tác phù hợp tại TP. Huế và các tuyến lân cận, hướng dẫn họ dùng đúng chức năng đang có và chăm sóc sau khi đã phát sinh chuyến thật.",
      en: "TXE PRO is already operating: shippers find vehicles, drivers post availability, both sides match a trip and follow it in the app. This role finds suitable partners in Hue City and nearby routes, shows them the features that are already available and stays in touch after real trips start.",
      zh: "TXE PRO 已在运营：货主找车，司机发布空车，双方匹配行程并在应用中追踪。此职位在顺化市及附近线路寻找合适伙伴，指导他们使用现有功能，并在真实行程开始后继续维护。",
    },
    duties: {
      vi: ["Tìm và gặp chủ hàng, chủ xe, đội xe và doanh nghiệp vận tải tại TP. Huế.", "Giới thiệu các chức năng đang chạy: tìm xe, đăng xe trống, ghép chuyến, theo dõi GPS, ví và ký quỹ.", "Hướng dẫn đối tác tạo tài khoản, hoàn tất hồ sơ và đăng tin hoặc nhận chuyến đầu tiên.", "Theo dõi đối tác sau khi đã có chuyến, ghi nhận vướng mắc và chuyển cho chăm sóc khách hàng hoặc vận hành.", "Báo cáo số đối tác mới, tin đã đăng và phản hồi cần sản phẩm xử lý."],
      en: ["Find and meet shippers, vehicle owners, fleets and transport businesses in Hue City.", "Present the live features: find a vehicle, post availability, match a trip, GPS tracking, wallet and escrow.", "Help a partner create an account, complete their profile and post or accept a first trip.", "Stay in touch after trips begin, record blockers and pass them to support or operations.", "Report new partners, posted listings and feedback the product team needs to handle."],
      zh: ["在顺化市寻找并拜访货主、车主、车队和运输企业。", "介绍正在运行的功能：找车、发布空车、匹配行程、GPS 追踪、钱包和担保。", "协助伙伴创建账户、完善资料并完成第一次发布或接单。", "行程开始后继续跟进，记录障碍并转给客服或运营。", "汇报新伙伴、已发布信息和需要产品团队处理的反馈。"],
    },
    requirements: {
      vi: ["Chủ động gọi điện, nhắn tin và đi gặp đối tác.", "Nắm nhu cầu vận chuyển hoặc sẵn sàng học quy trình đăng tin, nhận chuyến đang dùng trên TXE PRO.", "Có thể di chuyển trong TP. Huế để gặp chủ hàng và đội xe.", "Ghi chép rõ thỏa thuận, đầu mối liên hệ và kết quả từng buổi làm việc.", "Ưu tiên người đã làm kinh doanh vận tải, logistics hoặc phát triển đối tác."],
      en: ["Comfortable calling, messaging and meeting partners in person.", "Understands transport needs or is ready to learn the posting and trip flow already used on TXE PRO.", "Can travel within Hue City to meet shippers and fleets.", "Keeps clear notes of agreements, contacts and the result of each meeting.", "Transport sales, logistics or partner-development experience is preferred."],
      zh: ["主动打电话、发消息并上门拜访伙伴。", "了解运输需求，或愿意学习 TXE PRO 上正在使用的发布和接单流程。", "可以在顺化市内拜访货主和车队。", "清楚记录约定、联系人和每次拜访的结果。", "有运输销售、物流或伙伴开发经验者优先。"],
    },
    benefits: {
      vi: ["Làm việc với đối tác thật trên nền tảng đã vận hành.", "Được đào tạo kịch bản giới thiệu chủ hàng và tài xế trước khi đi gặp.", "Mức lương thương lượng, có thể trao đổi thêm theo kết quả phát triển đối tác."],
      en: ["Work with real partners on a platform that is already operating.", "Learn the shipper and driver introduction before going to meetings.", "Pay is negotiable and can reflect partner-development results."],
      zh: ["与真实伙伴合作，平台已在运营。", "上门拜访前会先培训货主和司机介绍流程。", "薪资面议，并可按开发伙伴的结果另行协商。"],
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
      vi: ["Theo dõi danh sách chuyến đã ghép, chuyến đang chạy và các mốc nhận, trả hàng.", "Hỗ trợ tài xế và chủ hàng khi đổi giờ, đổi điểm hoặc thay đổi hàng hóa.", "Kiểm tra vị trí GPS và trạng thái chuyến trước khi hướng dẫn bước tiếp theo.", "Phối hợp sự cố trên đường với chăm sóc khách hàng và ghi lại kết quả xử lý.", "Báo các điểm nghẽn lặp lại để sản phẩm và vận hành chỉnh quy trình."],
      en: ["Watch matched trips, trips in progress and the pickup and drop-off milestones.", "Help drivers and shippers when the time, place or cargo changes.", "Check GPS and trip status before telling either side what to do next.", "Coordinate roadside issues with customer support and record the outcome.", "Report repeated blockers so product and operations can adjust the process."],
      zh: ["关注已匹配行程、进行中行程以及接货和送货节点。", "在时间、地点或货物变化时协助司机和货主。", "指导下一步前先核对 GPS 和行程状态。", "与客户服务一起协调途中问题并记录处理结果。", "汇报反复出现的阻塞点，供产品和运营调整流程。"],
    },
    requirements: {
      vi: ["Cẩn thận với thời gian, địa điểm, biển số và trạng thái chuyến.", "Bình tĩnh khi có nhiều chuyến cần xử lý cùng lúc.", "Đọc được thông tin đơn trên ứng dụng và trao đổi rõ qua điện thoại.", "Làm việc tại TP. Huế, theo khung giờ vận hành.", "Ưu tiên người đã điều phối vận tải, kho, tổng đài hoặc theo dõi đội xe."],
      en: ["Careful with time, place, vehicle plates and trip status.", "Stays calm when several trips need attention at once.", "Can read an order in the app and explain the next step clearly by phone.", "Works in Hue City during operating hours.", "Dispatch, warehouse, hotline or fleet-monitoring experience is preferred."],
      zh: ["仔细核对时间、地点、车牌和行程状态。", "多趟行程同时需要处理时能保持冷静。", "能在应用中查看订单，并通过电话清楚说明下一步。", "在顺化市按运营时间工作。", "有调度、仓储、热线或车队跟踪经验者优先。"],
    },
    benefits: {
      vi: ["Theo dõi chuyến thật, có GPS và trạng thái đơn trên hệ thống đang chạy.", "Làm việc cùng chăm sóc khách hàng và kinh doanh đối tác tại TP. Huế.", "Mức lương thương lượng theo kinh nghiệm điều phối."],
      en: ["Follow real trips, with GPS and order status on the live system.", "Work with customer support and partnerships in Hue City.", "Pay is negotiable based on dispatch experience."],
      zh: ["追踪真实行程，正在运行的系统提供 GPS 和订单状态。", "在顺化市与客户服务和合作销售一起工作。", "薪资按调度经验面议。"],
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
      vi: ["Làm tính năng cho đăng tin, ghép xe, theo dõi chuyến, ví, ký quỹ hoặc thông báo.", "Sửa lỗi phát sinh từ ứng dụng và website đang có người dùng.", "Đọc luồng chủ hàng và tài xế trước khi sửa, tránh làm đứt đơn đang chạy.", "Phối hợp vận hành để kiểm tra trên dữ liệu và tình huống thật.", "Ghi lại thay đổi ảnh hưởng tới đăng tin, trạng thái chuyến hoặc thanh toán."],
      en: ["Build features for listings, matching, trip tracking, wallets, escrow or notifications.", "Fix defects found in the app and website people are using.", "Read the shipper and driver flow before changing it so a live order is not broken.", "Check changes with operations against real data and situations.", "Record changes that affect posting, trip status or payment."],
      zh: ["开发发布、匹配、行程追踪、钱包、担保或通知功能。", "修复用户正在使用的应用和网站中的问题。", "修改前先阅读货主和司机流程，避免中断正在进行的订单。", "与运营一起用真实数据和场景检查变更。", "记录影响发布、行程状态或支付的改动。"],
    },
    requirements: {
      vi: ["Có kinh nghiệm web, ứng dụng di động hoặc backend và đọc được code sẵn có.", "Tự kiểm tra luồng chính trước khi bàn giao: đăng tin, nhận chuyến, theo dõi, thông báo.", "Cẩn thận với dữ liệu đơn, vị trí và số dư.", "Có thể làm việc tại TP. Huế hoặc từ xa theo thỏa thuận.", "Ưu tiên người đã làm sản phẩm có người dùng thật, bản đồ hoặc thanh toán."],
      en: ["Experience in web, mobile or backend work and the ability to read an existing codebase.", "Checks the main flow before handoff: posting, accepting a trip, tracking and notifications.", "Careful with order data, location and balances.", "Can work in Hue City or remotely by agreement.", "Experience on a product with real users, maps or payments is preferred."],
      zh: ["具备网站、移动应用或后端经验，并能阅读现有代码。", "交付前自行检查主流程：发布、接单、追踪和通知。", "谨慎处理订单数据、位置和余额。", "可按约定在顺化市或远程工作。", "有真实用户产品、地图或支付经验者优先。"],
    },
    benefits: {
      vi: ["Làm trên ứng dụng và website đang vận hành, thấy được chuyến và phản hồi của người dùng.", "Phối hợp trực tiếp với vận hành tại TP. Huế khi cần kiểm tra luồng.", "Mức lương thương lượng theo kinh nghiệm và phạm vi công việc."],
      en: ["Work on the operating app and website and see real trips and user feedback.", "Work directly with the Hue City operations team when a flow needs checking.", "Pay is negotiable based on experience and the scope of work."],
      zh: ["在正在运营的应用和网站上工作，能看到真实行程和用户反馈。", "需要检查流程时直接与顺化市运营团队配合。", "薪资按经验和工作范围面议。"],
    },
  },
];

const emptyForm = { fullName: "", phone: "", email: "", roleId: jobs[0].id, message: "" };
const resumeLimit = 8 * 1024 * 1024;
const resumePattern = /\.(pdf|docx|doc)$/i;

export default function CareersPage() {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();
  const lang: Lang = language === "en" || language === "zh" ? language : "vi";
  const t = (copy: Record<Lang, string>) => copy[lang];
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const resumeInput = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const copy = {
    badge: { vi: "Cơ hội nghề nghiệp", en: "Careers", zh: "招聘" },
    title: { vi: "Tuyển dụng tại TXE PRO", en: "Careers at TXE PRO", zh: "加入 TXE PRO" },
    subtitle: {
      vi: "Chúng tôi đang tìm người muốn làm sản phẩm vận tải thực tế: kết nối chủ hàng, tài xế và chuyến đi mỗi ngày.",
      en: "We are looking for people who want to build a working transport product used by shippers and drivers every day.",
      zh: "我们正在寻找愿意打造真实运输产品的伙伴，每天连接货主、司机和行程。",
    },
    rolesTitle: { vi: "Vị trí đang mở", en: "Open roles", zh: "在招职位" },
    apply: { vi: "Ứng tuyển", en: "Apply", zh: "申请" },
    details: { vi: "Chi tiết", en: "Details", zh: "详情" },
    close: { vi: "Đóng", en: "Close", zh: "关闭" },
    salary: { vi: "Mức lương", en: "Salary", zh: "薪资" },
    workType: { vi: "Hình thức", en: "Type", zh: "类型" },
    place: { vi: "Địa điểm", en: "Location", zh: "地点" },
    overview: { vi: "Mô tả công việc", en: "Role", zh: "岗位说明" },
    duties: { vi: "Công việc chính", en: "Main work", zh: "主要工作" },
    requirements: { vi: "Yêu cầu", en: "Requirements", zh: "要求" },
    benefits: { vi: "Quyền lợi", en: "What you get", zh: "待遇" },
    formTitle: { vi: "Gửi hồ sơ", en: "Send your application", zh: "提交申请" },
    formHint: {
      vi: "Điền form bên dưới. Hồ sơ được chuyển tới bộ phận tuyển dụng qua kênh liên hệ của website.",
      en: "Use the form below. Applications go to the hiring team through the website contact inbox.",
      zh: "请填写下方表格。申请会通过网站联系渠道发给招聘团队。",
    },
    name: { vi: "Họ và tên", en: "Full name", zh: "姓名" },
    phone: { vi: "Số điện thoại", en: "Phone", zh: "电话" },
    email: { vi: "Email", en: "Email", zh: "邮箱" },
    role: { vi: "Vị trí", en: "Role", zh: "职位" },
    profile: { vi: "Tải CV hoặc portfolio", en: "Upload a CV or portfolio", zh: "上传简历或作品" },
    profileHint: { vi: "PDF, DOC hoặc DOCX, tối đa 8 MB", en: "PDF, DOC or DOCX, up to 8 MB", zh: "PDF、DOC 或 DOCX，最大 8 MB" },
    chooseFile: { vi: "Chọn file", en: "Choose file", zh: "选择文件" },
    noFile: { vi: "Chưa chọn file", en: "No file selected", zh: "尚未选择文件" },
    note: { vi: "Giới thiệu ngắn", en: "Short introduction", zh: "简短介绍" },
    send: { vi: "Gửi hồ sơ", en: "Submit application", zh: "提交申请" },
    sending: { vi: "Đang gửi...", en: "Sending...", zh: "正在发送..." },
    success: {
      vi: "Đã nhận hồ sơ. TXE PRO sẽ liên hệ nếu vị trí phù hợp.",
      en: "Application received. TXE PRO will contact you if the role is a fit.",
      zh: "已收到申请。如果职位合适，TXE PRO 会与你联系。",
    },
    required: {
      vi: "Vui lòng điền họ tên, số điện thoại, email, giới thiệu ngắn và tải CV.",
      en: "Please enter your name, phone, email, a short introduction and upload a CV.",
      zh: "请填写姓名、电话、邮箱、简短介绍并上传简历。",
    },
    resumeType: {
      vi: "Chỉ nhận file PDF, DOC hoặc DOCX, tối đa 8 MB.",
      en: "Only PDF, DOC or DOCX files up to 8 MB are accepted.",
      zh: "仅接受 8 MB 以内的 PDF、DOC 或 DOCX 文件。",
    },
    failed: {
      vi: "Chưa gửi được hồ sơ. Vui lòng thử lại hoặc liên hệ trực tiếp.",
      en: "The application could not be sent. Please try again or contact us directly.",
      zh: "申请未能发送。请重试或直接联系我们。",
    },
    another: { vi: "Gửi hồ sơ khác", en: "Send another application", zh: "再提交一份" },
  };

  const detailJob = jobs.find((job) => job.id === detailId) ?? null;

  useEffect(() => {
    if (!detailJob) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setDetailId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detailJob]);

  function chooseRole(id: string) {
    setDetailId(null);
    setDone(false);
    setForm((current) => ({ ...current, roleId: id }));
    window.setTimeout(() => document.getElementById("career-apply")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.message.trim() || !resume) {
      setError(t(copy.required));
      return;
    }
    if (!resumePattern.test(resume.name) || resume.size > resumeLimit) {
      setError(t(copy.resumeType));
      return;
    }
    const role = jobs.find((job) => job.id === form.roleId) ?? jobs[0];
    const body = new FormData();
    body.append("fullName", form.fullName.trim());
    body.append("phone", form.phone.trim());
    body.append("email", form.email.trim());
    body.append("subject", `Tuyển dụng: ${role.title.vi}`);
    body.append("message", `Vị trí: ${role.title.vi}\n${form.message.trim()}`);
    body.append("resume", resume);
    setSubmitting(true);
    try {
      await postingRequest("/contacts/applications", { method: "POST", body }, false);
      setDone(true);
      setForm({ ...emptyForm, roleId: role.id });
      setResume(null);
      if (resumeInput.current) resumeInput.current.value = "";
    } catch {
      setError(companyInfo.emailGeneral ? `${t(copy.failed)} ${companyInfo.emailGeneral}` : t(copy.failed));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-slate-50 text-slate-900">
      <SubpageHeroBanner
        badge={t(copy.badge)}
        title={t(copy.title)}
        subtitle={t(copy.subtitle)}
        breadcrumbs={[
          { label: lang === "en" ? "Home" : lang === "zh" ? "首页" : "Trang chủ", href: "/" },
          { label: t(copy.title) },
        ]}
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-bold text-slate-950">{t(copy.rolesTitle)}</h2>
        <div className="mt-6 grid gap-4">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-600">{t(job.team)}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{t(job.title)}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{t(job.summary)}</p>
                <p className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1"><Briefcase size={14} />{t(job.type)}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={14} />{t(job.location)}</span>
                  <span className="inline-flex items-center gap-1"><Banknote size={14} />{t(copy.salary)}: {t(job.salary)}</span>
                </p>
              </div>
              <div className="mt-5 flex shrink-0 gap-2 sm:mt-0">
                <button type="button" onClick={() => setDetailId(job.id)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">{t(copy.details)}</button>
                <button type="button" onClick={() => chooseRole(job.id)} className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white">{t(copy.apply)}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="career-apply" className="mx-auto max-w-3xl scroll-mt-28 px-5 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-950">{t(copy.formTitle)}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{t(copy.formHint)}</p>
          {done ? (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800">
              <p className="flex items-start gap-2 font-semibold"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{t(copy.success)}</p>
              <button type="button" onClick={() => setDone(false)} className="mt-4 font-bold text-primary-700">{t(copy.another)}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.name)}
                <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.phone)}
                  <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.email)}
                  <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.role)}
                <select value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal">
                  {jobs.map((job) => <option key={job.id} value={job.id}>{t(job.title)}</option>)}
                </select>
              </label>
              <div className="grid gap-1 text-sm font-semibold text-slate-700">
                <span>{t(copy.profile)}</span>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 font-normal">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800"><Upload size={16} />{t(copy.chooseFile)}</span>
                  <span className="min-w-0 truncate text-slate-500">{resume ? resume.name : t(copy.noFile)}</span>
                  <input ref={resumeInput} required type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && (!resumePattern.test(file.name) || file.size > resumeLimit)) {
                      setResume(null);
                      event.target.value = "";
                      setError(t(copy.resumeType));
                      return;
                    }
                    setError("");
                    setResume(file);
                  }} />
                </label>
                <span className="font-normal text-xs text-slate-500">{t(copy.profileHint)}</span>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">{t(copy.note)}
                <textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 font-normal" />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                <Send size={16} />{submitting ? t(copy.sending) : t(copy.send)}
              </button>
            </form>
          )}
        </div>
      </section>
      {detailJob && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setDetailId(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="career-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-600">{t(detailJob.team)}</p>
                <h2 id="career-detail-title" className="mt-2 text-2xl font-bold text-slate-950">{t(detailJob.title)}</h2>
              </div>
              <button type="button" aria-label={t(copy.close)} onClick={() => setDetailId(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <dl className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs font-semibold text-slate-400">{t(copy.salary)}</dt><dd className="mt-1 font-bold text-slate-900">{t(detailJob.salary)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-400">{t(copy.workType)}</dt><dd className="mt-1 inline-flex items-center gap-1 font-bold text-slate-900"><Briefcase size={14} />{t(detailJob.type)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-400">{t(copy.place)}</dt><dd className="mt-1 inline-flex items-center gap-1 font-bold text-slate-900"><MapPin size={14} />{t(detailJob.location)}</dd></div>
            </dl>
            <h3 className="mt-6 text-sm font-bold text-slate-950">{t(copy.overview)}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t(detailJob.overview)}</p>
            <h3 className="mt-6 text-sm font-bold text-slate-950">{t(copy.duties)}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{detailJob.duties[lang].map((item) => <li key={item}>{item}</li>)}</ul>
            <h3 className="mt-5 text-sm font-bold text-slate-950">{t(copy.requirements)}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{detailJob.requirements[lang].map((item) => <li key={item}>{item}</li>)}</ul>
            <h3 className="mt-5 text-sm font-bold text-slate-950">{t(copy.benefits)}</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{detailJob.benefits[lang].map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDetailId(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">{t(copy.close)}</button>
              <button type="button" onClick={() => chooseRole(detailJob.id)} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white">{t(copy.apply)}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
