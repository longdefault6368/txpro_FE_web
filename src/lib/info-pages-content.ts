import type { InfoPageSlug } from "./info-pages";

export type InfoLang = "vi" | "en" | "zh";
type LocalizedText = Record<InfoLang, string>;
type LocalizedList = Record<InfoLang, string[]>;

export interface InfoPageSection {
  id: string;
  heading: LocalizedText;
  paragraphs: LocalizedText[];
  checklist?: LocalizedList;
  cta?: {
    href: string;
    label: LocalizedText;
  };
}

export interface InfoPageContent {
  slug: InfoPageSlug;
  badge: LocalizedText;
  title: LocalizedText;
  intro: LocalizedText;
  highlights: LocalizedList;
  sections: InfoPageSection[];
  relatedLinks: Array<{
    href: string;
    label: LocalizedText;
  }>;
}

const t = (vi: string, en: string, zh: string): LocalizedText => ({ vi, en, zh });
const list = (vi: string[], en: string[], zh: string[]): LocalizedList => ({ vi, en, zh });

const INFO_CONTENT: Record<InfoPageSlug, InfoPageContent> = {
  "gioi-thieu": {
    slug: "gioi-thieu",
    badge: t("Về nền tảng TXE PRO", "About TXE PRO", "关于 TXE PRO"),
    title: t("Giới thiệu TXE PRO", "About TXE PRO", "关于 TXE PRO"),
    intro: t(
      "TXE PRO là nền tảng kết nối trực tiếp giữa khách hàng có nhu cầu chở hàng hoặc di chuyển với tài xế đang có xe trống theo tuyến và khung giờ thực tế.",
      "TXE PRO directly connects customers who need cargo transport or travel with drivers who have available vehicles along matching routes and schedules.",
      "TXE PRO 直接连接有货运或出行需求的客户与沿线有空车且档期匹配的司机。"
    ),
    highlights: list(
      [
        "Một tài khoản thống nhất cho cả khách hàng tìm xe và tài xế đăng xe trống.",
        "Đa dạng nhóm xe: xe máy, ô tô, xe tải, xe đông lạnh, container và xe chuyên dụng.",
        "Theo dõi trạng thái chuyến đi công khai bằng mã vận đơn và cập nhật GPS trên ứng dụng.",
      ],
      [
        "One unified account for both customers searching for vehicles and drivers posting availability.",
        "Multiple vehicle groups: motorcycles, cars, trucks, refrigerated trucks, containers and specialist vehicles.",
        "Public order-code tracking and live GPS milestone updates inside the app.",
      ],
      [
        "同一账户可同时用于客户找车与司机发布空车。",
        "涵盖多种车型：摩托车、汽车、货车、冷藏车、集装箱及专用车。",
        "支持凭运单号公开查询进度，并在应用内实时追踪 GPS 节点。",
      ]
    ),
    sections: [
      {
        id: "su-menh",
        heading: t("Bài toán TXE PRO giải quyết", "The problem TXE PRO solves", "TXE PRO 解决的问题"),
        paragraphs: [
          t(
            "Trong vận tải thực tế, nhiều chủ hàng mất thời gian gọi từng nhà xe để hỏi tải trọng và giờ chạy, trong khi nhiều tài xế chạy chiều về bị rỗng thùng vì thiếu đầu mối ghép hàng đúng tuyến. TXE PRO gom cả hai nhu cầu vào một luồng tìm kiếm minh bạch theo điểm nhận, điểm trả, thời gian và nhóm phương tiện.",
            "In everyday logistics, shippers spend time calling carriers one by one to check capacity and departure windows while drivers return empty due to missing route-matched cargo. TXE PRO brings both sides into one transparent workflow structured by pickup, destination, timing and vehicle category.",
            "在实际运输中，货主往往需要逐一电话询车和确认时间，而不少司机返程空驶却找不到顺路货源。TXE PRO 将双向需求整合到按起终点、时间和车型匹配的透明流程中。"
          ),
          t(
            "Thay vì trao đổi rời rạc qua nhiều tin nhắn khó đối chiếu, toàn bộ thông tin đơn hàng, lịch chạy, phí hiển thị, lịch sử đổi vị trí và bằng chứng bàn giao được ghi nhận nhất quán trên website và ứng dụng di động.",
            "Instead of scattered messages that are hard to reconcile later, order details, schedules, displayed fees, location-change history and delivery evidence stay consistent across the website and mobile apps.",
            "相比零散难核对的聊天记录，订单信息、行程时间、页面费用明细、改址记录和交付凭证都在网站和手机端统一留痕。"
          ),
        ],
        cta: {
          href: "/dich-vu",
          label: t("Khám phá các dịch vụ vận chuyển", "Explore transport services", "浏览运输服务"),
        },
      },
      {
        id: "he-sinh-thai",
        heading: t("Cấu trúc hệ sinh thái TXE PRO", "How the TXE PRO ecosystem works", "TXE PRO 生态结构"),
        paragraphs: [
          t(
            "Hệ thống vận hành đồng bộ trên nền tảng web (txepro.vn) và ứng dụng di động dành cho Android và iOS. Người dùng có thể khởi tạo nhu cầu tìm xe hoặc đăng xe trống trên web, đồng thời dùng ứng dụng để xác minh danh tính, định vị GPS khi di chuyển và nhận thông báo tức thời.",
            "The platform runs in sync across the web portal (txepro.vn) and mobile apps for Android and iOS. Users can start requests or post available vehicles on the web while using the mobile app for identity verification, live GPS tracking and instant alerts.",
            "平台在网页端（txepro.vn）与 Android/iOS 手机端同步运行。用户可在网页发起找车或空车发布，并通过手机端完成实名认证、行程 GPS 定位与实时通知。"
          ),
        ],
        checklist: list(
          [
            "Khách hàng (Chủ hàng): đăng tuyến đường, loại hàng, tải trọng và chọn tài xế phù hợp trước khi xác nhận.",
            "Tài xế & chủ xe: quản lý hồ sơ phương tiện, đăng xe trống thủ công hoặc đặt lịch đăng tự động theo tuyến quen thuộc.",
            "Người nhận hàng: tra cứu hành trình tại trang Theo dõi đơn hàng chỉ bằng mã ORD mà không cần đăng nhập.",
          ],
          [
            "Customers (Shippers): enter route, cargo type and weight, then compare matching drivers before confirming.",
            "Drivers & fleet owners: maintain verified vehicle profiles and post availability manually or on recurring schedules.",
            "Recipients: check order progress on the public tracking page using the ORD code without signing in.",
          ],
          [
            "客户（货主）：填写路线、货物类型和重量，确认前自由比对合适司机。",
            "司机与车主：管理已验证车辆档案，手动发布空车或按常跑线路设置自动计划。",
            "收货方：无需登录，凭 ORD 单号即可在运单追踪页面查看状态。"
          ]
        ),
        cta: {
          href: "/tuyen-duong",
          label: t("Xem các tuyến vận chuyển phổ biến", "Browse popular freight routes", "查看热门运输线路"),
        },
      },
      {
        id: "minh-bach",
        heading: t("Nguyên tắc minh bạch trong từng chuyến đi", "Transparency principles on every trip", "每趟行程的透明原则"),
        paragraphs: [
          t(
            "Mọi điều kiện liên quan đến giá đề xuất, voucher áp dụng, khoản ký quỹ tạm giữ hay yêu cầu chụp ảnh bàn giao đều được trình bày trực tiếp trước bước xác nhận. TXE PRO tách bạch rõ khoản ký quỹ bảo đảm giao dịch với tiền cước vận chuyển để cả hai bên dễ kiểm soát tài chính.",
            "Every detail regarding proposed fares, eligible vouchers, temporary deposits and delivery-photo requirements is displayed clearly prior to confirmation. TXE PRO separates transaction security deposits from trip freight charges so both sides stay in full financial clarity.",
            "关于报价、可用优惠券、临时保证金及交付拍照要求的所有条款都会在确认前清晰展示。TXE PRO 将履约保证金与实际运费明确区分，方便双方财务核对。"
          ),
        ],
        cta: {
          href: "/dang-tin",
          label: t("Đăng nhu cầu hoặc xe trống ngay", "Post a request or vehicle now", "立即发布需求或空车"),
        },
      },
    ],
    relatedLinks: [
      { href: "/dich-vu", label: t("Danh mục dịch vụ vận chuyển", "Transport services", "运输服务目录") },
      { href: "/tai-xe", label: t("Dành cho tài xế đối tác", "For driver partners", "司机伙伴专区") },
      { href: "/thong-tin/quy-che-hoat-dong", label: t("Quy chế hoạt động", "Operating rules", "平台运行规则") },
      { href: "/tro-giup", label: t("Câu hỏi thường gặp (FAQ)", "Frequently asked questions", "常见问题") },
    ],
  },

  "quy-che-hoat-dong": {
    slug: "quy-che-hoat-dong",
    badge: t("Tiêu chuẩn vận hành sàn", "Platform operating framework", "平台运营规范"),
    title: t("Quy chế hoạt động TXE PRO", "TXE PRO Operating Rules", "TXE PRO 平台运行规则"),
    intro: t(
      "Khung quy định chung về vai trò người dùng, vòng đời đơn hàng, xác thực trạng thái GPS và nguyên tắc xử lý khi phát sinh thay đổi trên sàn giao dịch vận tải TXE PRO.",
      "Core operating rules governing user roles, order lifecycles, GPS milestone verification and exception handling across the TXE PRO transport marketplace.",
      "涵盖 TXE PRO 运输平台的用户角色、订单生命周期、GPS 节点校验及异常变更处理的总体规范。"
    ),
    highlights: list(
      [
        "Mỗi giao dịch đều gắn với trạng thái đơn hàng cụ thể và mốc thời gian ghi nhận trên hệ thống.",
        "Thay đổi điểm nhận/trả chỉ có hiệu lực khi cả khách hàng và tài xế cùng xác nhận.",
        "Tách biệt hoàn toàn quy trình hủy đơn với quy trình báo cáo sự cố chuyến đi.",
      ],
      [
        "Every booking follows explicit order states and server-recorded timestamps.",
        "Pickup or drop-off changes take effect only when approved by both customer and driver.",
        "Order cancellation and trip incident reporting follow distinct, auditable procedures.",
      ],
      [
        "每笔订单均遵循明确的订单状态与系统时间戳记录。",
        "起终点变更须经客户与司机双方确认后方可生效。",
        "取消订单与行程事件报告各自独立、全程可追溯。"
      ]
    ),
    sections: [
      {
        id: "vai-tro-xac-thuc",
        heading: t("1. Phân định vai trò và điều kiện tham gia", "1. Roles and participation requirements", "1. 角色划分与参与条件"),
        paragraphs: [
          t(
            "Thành viên trên TXE PRO tham gia theo hai vai trò chính: Khách hàng (chủ hàng/người đặt xe) và Tài xế (đối tác sở hữu hoặc điều khiển phương tiện). Một tài khoản có thể chuyển đổi vai trò sau khi được hệ thống xác nhận, nhưng để đăng tin xe trống hợp lệ, tài xế bắt buộc hoàn tất xác minh danh tính và đăng ký phương tiện đang hoạt động.",
            "Members participate under two primary roles: Customers (shippers/riders) and Drivers (vehicle owners or operators). One account may switch roles upon server confirmation, while posting vehicle availability always requires verified driver identity and an active registered vehicle.",
            "TXE PRO 成员分为两大角色：客户（货主/乘车人）和司机（车主或驾驶人）。单一账户经系统确认后可切换角色，但发布空车信息必须先完成实名认证并登记可用车辆。"
          ),
        ],
      },
      {
        id: "vong-doi-don",
        heading: t("2. Vòng đời tiêu chuẩn của một chuyến đi", "2. Standard lifecycle of a booking", "2. 订单标准生命周期"),
        paragraphs: [
          t(
            "Một giao dịch hoàn chỉnh trên TXE PRO đi qua chuỗi bước kiểm soát rõ ràng nhằm hạn chế hiểu nhầm giữa hai phía:",
            "A complete transaction on TXE PRO follows a structured sequence designed to prevent misunderstandings between both parties:",
            "TXE PRO 上的每笔完整交易均遵循以下清晰流程，最大限度减少双方误解："
          ),
        ],
        checklist: list(
          [
            "Khởi tạo & ghép tuyến: chủ hàng đăng nhu cầu hoặc chọn trực tiếp tin xe trống khớp loại xe, tải trọng và giờ chạy.",
            "Xác nhận & giữ bảo đảm: hệ thống kiểm tra quyền lợi voucher/số dư và ghi nhận xác nhận hai chiều.",
            "Thực hiện chuyến & mốc GPS: tài xế xác nhận đến điểm nhận, bắt đầu chuyến và đến điểm trả trong phạm vi bán kính cho phép.",
            "Nghiệm thu & hoàn tất: với nhóm xe chở hàng, tài xế tải ảnh bàn giao để chủ hàng đối chiếu xác nhận (hoặc tự hoàn tất theo hạn hệ thống nếu không có tranh chấp).",
          ],
          [
            "Creation & matching: shippers post needs or pick an available vehicle matching capacity, route and schedule.",
            "Confirmation & reservation: the system checks voucher/balance eligibility and logs mutual confirmation.",
            "Execution & GPS milestones: drivers confirm pickup arrival, trip start and destination arrival within the permitted radius.",
            "Handover & closure: freight categories require delivery photos for shipper review before completion (or automatic completion at deadline if undisputed).",
          ],
          [
            "发布与匹配：货主提交需求或直接选择车型、载重与时间相符的空车信息。",
            "确认与保障：系统校验优惠券或余额条件并记录双方确认。",
            "执行与 GPS 校验：司机在允许定位半径内确认到达起点、开始行程及到达终点。",
            "验收与完结：货运车型由司机上传交付照片供货主核对确认（无争议时按系统期限自动完结）。"
          ]
        ),
      },
      {
        id: "bien-dong-va-tranh-chap",
        heading: t("3. Quy tắc thay đổi lộ trình, hủy đơn và sự cố", "3. Route changes, cancellations and incidents", "3. 变更路线、取消与事件规则"),
        paragraphs: [
          t(
            "Mọi yêu cầu đổi địa chỉ đều lưu lịch sử trên đơn hàng; lộ trình mới chỉ áp dụng khi bên còn lại đồng ý. Khi cần hủy đơn trước giờ khởi hành, khung thời gian miễn phạt và chính sách áp dụng được tính dựa trên thời điểm tài xế chấp nhận đơn theo hiển thị xác nhận.",
            "All address-change requests remain logged in order history and only take effect upon counterparty approval. When cancelling prior to trip start, the penalty-free window and applicable rules follow the driver-acceptance timestamp shown on confirmation.",
            "所有改址申请均计入历史记录，仅在对方同意后生效。行程开始前取消时，免罚时限及适用规则以确认页显示的司机接单时间为准。"
          ),
          t(
            "Nếu phát sinh trở ngại thực tế trên đường, tài xế sử dụng tính năng báo cáo sự cố kèm bằng chứng rõ ràng để chủ hàng phản hồi trong 24 giờ hoặc chuyển bộ phận quản trị đối chiếu thủ công.",
            "When genuine roadside issues occur, drivers submit an incident report with clear evidence so shippers can respond within 24 hours or escalate for manual administrative review.",
            "途中如遇实际情况，司机应附清晰凭证提交事件报告，供货主在 24 小时内反馈或转交平台人工核查。"
          ),
        ],
        cta: {
          href: "/thong-tin/dieu-khoan-su-dung",
          label: t("Đọc toàn văn Điều khoản sử dụng", "Read full Terms of Service", "阅读完整使用条款"),
        },
      },
    ],
    relatedLinks: [
      { href: "/thong-tin/dieu-khoan-su-dung", label: t("Điều khoản sử dụng", "Terms of Service", "使用条款") },
      { href: "/thong-tin/thanh-toan-ky-quy", label: t("Ví, voucher và ký quỹ", "Wallet, vouchers & escrow", "钱包、优惠券与保证金") },
      { href: "/thong-tin/khieu-nai-boi-thuong", label: t("Sự cố và hỗ trợ xử lý", "Incidents & resolution", "事件与处理支持") },
      { href: "/tro-giup", label: t("Tra cứu hướng dẫn nhanh", "Search help articles", "搜索帮助中心") },
    ],
  },

  "huong-dan-chu-hang": {
    slug: "huong-dan-chu-hang",
    badge: t("Cẩm nang khách hàng", "Customer playbook", "客户操作手册"),
    title: t("Hướng dẫn đăng nhu cầu tìm xe", "Customer Guide to Finding a Vehicle", "发布找车需求完整指南"),
    intro: t(
      "Lộ trình 4 bước thực tế giúp chủ hàng và khách đặt xe chuẩn bị thông tin chính xác, chọn đúng tải trọng phương tiện, tối ưu cước phí và nghiệm thu an toàn trên TXE PRO.",
      "A practical 4-step playbook helping shippers and riders prepare accurate trip details, choose the right vehicle capacity, manage costs and complete safe handovers on TXE PRO.",
      "实用的四步操作指南，帮助货主与客户准备准确资料、选对车型载重、控制费用并安全完成交接。"
    ),
    highlights: list(
      [
        "Khai báo đủ loại hàng, số kiện, kích thước và điều kiện hẻm/giờ cấm tải để tránh đổi xe phút chót.",
        "So sánh trực tiếp loại xe, lịch chạy và giá đề xuất từ các tin xe trống phù hợp trước khi xác nhận.",
        "Chia sẻ mã vận đơn ORD cho người nhận để cùng theo dõi tiến độ chuyến đi.",
      ],
      [
        "Provide cargo type, package count, dimensions and street-access restrictions upfront to avoid last-minute vehicle swaps.",
        "Compare vehicle type, schedule and proposed fares across matching listings before confirming.",
        "Share the ORD tracking code with your recipient so everyone follows progress effortlessly.",
      ],
      [
        "提前说明货物类型、件数、尺寸及限行/窄路条件，避免临时换车。",
        "确认前直接对比匹配空车的车型、档期与报价。",
        "将 ORD 单号分享给收货人，随时同步运输进度。"
      ]
    ),
    sections: [
      {
        id: "buoc-1-chuan-bi",
        heading: t("Bước 1: Chuẩn bị thông tin hàng hóa và điểm dừng đỗ", "Step 1: Prepare cargo specs and access notes", "步骤一：准备货物参数与停靠说明"),
        paragraphs: [
          t(
            "Trước khi mở biểu mẫu tìm xe, bạn nên ước lượng cả khối lượng lẫn kích thước phủ bì của những kiện lớn nhất (như tủ lạnh, sofa, máy móc hoặc pallet hàng). Nhiều lô hàng nhẹ nhưng cồng kềnh cần thùng dài hoặc chiều cao phù hợp thay vì chỉ tính theo số kilôgam.",
            "Before opening the booking form, estimate both weight and outer dimensions of the largest items (appliances, furniture, equipment or pallets). Lightweight yet bulky loads often require a longer or taller cargo bed rather than being judged by weight alone.",
            "打开找车表单前，建议同时估算重量和大件物品的外廓尺寸（如家电、家具、设备或托盘）。许多轻泡货虽不重，却需要足够长度或高度的车厢空间。"
          ),
        ],
        checklist: list(
          [
            "Chụp sẵn 2–3 ảnh rõ mặt hàng khi đã đóng gói hoặc sắp xếp gọn tại điểm nhận.",
            "Kiểm tra đường vào có cấm xe tải theo khung giờ, hẻm nhỏ hoặc cần gửi xe hầm chung cư hay không.",
            "Chuẩn bị sẵn số điện thoại người giao và người nhận ở cả hai đầu tuyến.",
          ],
          [
            "Take 2–3 well-lit photos of packed goods ready at the pickup location.",
            "Check for truck-ban hours, narrow alleys or building loading-dock rules.",
            "Prepare reliable phone contacts at both pickup and destination.",
          ],
          [
            "提前拍摄 2–3 张清晰光线下的待运货物照片。",
            "确认装卸点是否有限行时段、窄巷或园区装卸规定。",
            "提前备好起终点联系人的畅通电话。"
          ]
        ),
      },
      {
        id: "buoc-2-dang-tim-xe",
        heading: t("Bước 2: Chọn tuyến đường, nhóm xe và đối chiếu tin phù hợp", "Step 2: Set route, vehicle group and compare matches", "步骤二：填写路线车型并筛选匹配车辆"),
        paragraphs: [
          t(
            "Trên trang Tìm xe, ghim chính xác điểm nhận và điểm trả trên bản đồ để hệ thống đo đúng quãng đường. Lựa chọn đúng nhóm xe (xe tải, xe đông lạnh, container, xe chuyên dụng, ô tô hoặc xe máy) cùng thời gian mong muốn, sau đó xem danh sách xe đang sẵn sàng cùng tuyến.",
            "On the Find a Vehicle form, pin both pickup and drop-off accurately on the map so distance calculations match reality. Pick the right vehicle category and schedule, then compare available listings on that route.",
            "在找车页面准确标注起终点以计算实际里程，选择合适的车型分类与时间后，浏览沿线可用车辆信息。"
          ),
        ],
        cta: {
          href: "/chu-hang/form-tao-don",
          label: t("Mở form đăng nhu cầu tìm xe", "Open vehicle request form", "打开找车需求表单"),
        },
      },
      {
        id: "buoc-3-theo-doi-nghiem-thu",
        heading: t("Bước 3: Theo dõi hành trình và xác nhận bàn giao", "Step 3: Track the trip and confirm handover", "步骤三：追踪行程与确认签收"),
        paragraphs: [
          t(
            "Khi tài xế nhận chuyến, đơn hàng được cấp mã theo dõi ORD. Bạn có thể kiểm tra từng mốc thời gian từ lúc bắt đầu đến khi xe tới điểm trả ngay trong mục Đơn của bạn hoặc trên trang Theo dõi đơn hàng. Với nhóm xe chở hàng, hãy kiểm tra ảnh bàn giao tài xế tải lên cùng số kiện thực tế trước khi bấm xác nhận hoàn thành.",
            "Once accepted, your order receives an ORD code. Follow every milestone from trip start to arrival in My Orders or on the public tracking page. For cargo categories, verify the driver's delivery photos and physical package count before confirming completion.",
            "司机接单后订单将生成 ORD 单号。您可在“我的订单”或追踪页面查看全程节点；货运车型请核对司机上传的交付照片与实际件数后再确认完成。"
          ),
        ],
        cta: {
          href: "/tracking",
          label: t("Tra cứu hành trình theo mã đơn", "Track an order by code", "按单号查询行程"),
        },
      },
    ],
    relatedLinks: [
      { href: "/dich-vu/tim-xe-cho-hang", label: t("Dịch vụ tìm xe chở hàng", "Cargo truck matching", "货车运输服务") },
      { href: "/dich-vu/ghep-hang-tien-chuyen", label: t("Ghép hàng tiện chuyến", "Shared return-trip cargo", "顺路拼货服务") },
      { href: "/tin-tuc/chon-xe-phu-hop", label: t("Cẩm nang chọn đúng loại xe", "Guide to choosing a vehicle", "选车指南") },
      { href: "/tro-giup", label: t("Xem giải đáp chi tiết (FAQ)", "View detailed FAQ", "查看常见问题") },
    ],
  },

  "huong-dan-tai-xe": {
    slug: "huong-dan-tai-xe",
    badge: t("Cẩm nang đối tác tài xế", "Driver partner playbook", "司机伙伴操作手册"),
    title: t("Hướng dẫn tài xế nhận chuyến", "Driver Guide on TXE PRO", "司机接单与运营指南"),
    intro: t(
      "Quy trình từng bước giúp tài xế và nhà xe hoàn thiện hồ sơ xác thực, đăng tin xe trống hiệu quả để giảm chuyến rỗng chiều về và tuân thủ đúng chuẩn vận hành GPS trên TXE PRO.",
      "Step-by-step guidance for drivers and fleet operators to complete verification, publish high-converting empty-vehicle listings and complete GPS-verified trips on TXE PRO.",
      "帮助司机与车队完成资质认证、高效发布空车信息减少返程空驶，并按规范完成 GPS 履约。"
    ),
    highlights: list(
      [
        "Xác minh danh tính eKYC và duyệt phương tiện trên app TXE PRO một lần, dùng đồng bộ trên cả web và di động.",
        "Hỗ trợ đăng nhiều tin xe trống cùng lúc và lập lịch đăng tự động cho các tuyến chạy cố định.",
        "Chính sách miễn phí tài xế áp dụng riêng cho nhóm xe máy chở người theo quy định hệ thống.",
      ],
      [
        "Complete identity eKYC and vehicle verification once in the TXE PRO app and sync seamlessly with the web.",
        "Post multiple availability listings simultaneously or configure automatic schedules for recurring routes.",
        "Driver-free policy applies specifically to passenger motorcycles under platform rules.",
      ],
      [
        "在 TXE PRO 应用完成一次实名与车辆验证，网页端与手机端同步生效。",
        "支持同时发布多条空车信息，或为常跑线路配置自动发布计划。",
        "按系统规则，载客摩托车类别适用司机免平台费政策。"
      ]
    ),
    sections: [
      {
        id: "hoan-thien-ho-so",
        heading: t("1. Hoàn thiện xác minh eKYC và đăng ký phương tiện", "1. Complete eKYC and register your vehicle", "1. 完成实名认证与车辆登记"),
        paragraphs: [
          t(
            "Tài xế mới tải ứng dụng TXE PRO trên Google Play hoặc App Store, chọn vai trò Tài xế và tải lên giấy tờ tùy thân, bằng lái cùng ảnh thực tế của phương tiện. Khi hồ sơ và xe được duyệt trạng thái hoạt động, bạn có thể đăng nhập cùng tài khoản đó trên website để đăng tin xe trống nhanh trên màn hình lớn.",
            "New drivers install TXE PRO from Google Play or the App Store, choose the Driver role and upload ID documents, driver's license and real vehicle photos. Once approved and active, the same account works seamlessly on the website for fast desktop posting.",
            "新司机可在 Google Play 或 App Store 下载 TXE PRO，选择司机角色并上传身份证件、驾照和实车照片。审核通过后，使用同一账号登录网页端即可快速发布空车。"
          ),
        ],
        cta: {
          href: "/tai-xe",
          label: t("Xem trang tổng quan dành cho tài xế", "Explore driver partner hub", "浏览司机伙伴专区"),
        },
      },
      {
        id: "toi-uu-tin-xe-trong",
        heading: t("2. Đăng tin xe trống rõ tuyến, đúng tải trọng thực tế", "2. Publish accurate routes and realistic capacity", "2. 准确填写路线与实际运力"),
        paragraphs: [
          t(
            "Một tin xe trống dễ được chủ hàng chọn luôn ghi rõ khu vực nhận – trả thực tế bạn chạy qua, khung giờ xuất phát khả dụng, tải trọng trong đúng giới hạn xe đã đăng ký và mức giá tham khảo hợp lý. Nếu chạy tuyến cố định hằng tuần, hãy bật tính năng đăng tin tự động trên app để duy trì hiển thị liên tục.",
            "Listings that win bookings specify realistic pickup/drop-off corridors, genuine departure windows, capacity within registered vehicle limits and clear proposed pricing. For regular weekly routes, configure automatic posting in the app so your vehicle stays discoverable.",
            "更容易获得订单的空车信息应明确实际途经起终点、真实可用时段、不超过登记上限的载重以及清晰报价。常跑固定周线的司机可在应用内开启自动发布保持曝光。"
          ),
        ],
        cta: {
          href: "/tai-xe/dang-tin",
          label: t("Đăng tin xe trống ngay", "Post available vehicle now", "立即发布空车"),
        },
      },
      {
        id: "thuc-hien-gps-va-anh",
        heading: t("3. Xác nhận mốc GPS và chụp ảnh bàn giao đúng chuẩn", "3. GPS milestones and delivery photo standards", "3. GPS 节点确认与交付拍照规范"),
        paragraphs: [
          t(
            "Khi thực hiện chuyến, luôn bật quyền vị trí chính xác và duy trì kết nối ổn định để hệ thống ghi nhận mốc đến điểm nhận và điểm trả trong phạm vi 3 km. Với đơn chở hàng có yêu cầu xác minh giao nhận, chụp 1–3 ảnh rõ mặt hàng tại địa điểm bàn giao để hoàn tất nhanh và bảo vệ quyền lợi khi đối soát.",
            "During trips, keep precise location permissions and connectivity enabled so the system validates pickup and drop-off arrival within the 3 km radius. For freight jobs requiring handover verification, capture 1–3 clear delivery photos on site to speed up confirmation and protect your record.",
            "执行行程时请保持精确定位与网络畅通，以便系统在 3 公里范围内校验起终点到达。需要交付验证的货运订单，请现场拍摄 1–3 张清晰交付照片以加快确认并留存凭证。"
          ),
        ],
        cta: {
          href: "/tin-tuc/dang-xe-trong-hieu-qua",
          label: t("Đọc cẩm nang đăng xe trống hiệu quả", "Read empty-vehicle posting guide", "阅读空车发布技巧"),
        },
      },
    ],
    relatedLinks: [
      { href: "/tai-xe", label: t("Trang dành cho tài xế TXE PRO", "TXE PRO Driver Hub", "TXE PRO 司机专区") },
      { href: "/tai-xe/dang-tin", label: t("Đăng tin xe trống", "Post available vehicle", "发布空车") },
      { href: "/tuyen-duong", label: t("Các tuyến đường nhiều nhu cầu", "High-demand freight routes", "热门货运线路") },
      { href: "/tin-tuc/quan-ly-lich-xe-trong", label: t("Quản lý lịch xe trống thông minh", "Manage vehicle schedules", "管理空车档期") },
    ],
  },

  "thanh-toan-ky-quy": {
    slug: "thanh-toan-ky-quy",
    badge: t("Tài chính minh bạch", "Financial clarity", "透明资金机制"),
    title: t("Ví, voucher và ký quỹ", "Wallet, Vouchers and Deposits", "钱包、优惠券与保证金说明"),
    intro: t(
      "Giải thích cấu trúc ví điện tử, cơ chế giữ bảo đảm giao dịch (ký quỹ), cách nạp tiền qua mã QR MB và phân biệt rõ khoản ký quỹ với tiền cước chuyến đi trên TXE PRO.",
      "A clear overview of wallet balances, temporary booking deposits, MB QR top-ups and how security holds differ from actual trip freight fares on TXE PRO.",
      "清晰说明 TXE PRO 的电子钱包、临时履约保证金、MB 二维码充值方式，以及保证金与实际运费的区别。"
    ),
    highlights: list(
      [
        "Ký quỹ là khoản bảo đảm cam kết chuyến, hoàn toàn tách biệt với tổng cước phí vận chuyển.",
        "Số tiền giữ bảo đảm, mức phí chuyến và VAT hiển thị minh bạch trước khi xác nhận.",
        "Nạp bổ sung số dư nhanh chóng bằng mã QR MB đúng số tiền còn thiếu ngay trên màn hình thao tác.",
      ],
      [
        "A deposit secures trip commitment and is completely separate from total freight charges.",
        "Security amounts, trip fees and VAT details appear clearly prior to confirmation.",
        "Top up shortfalls instantly via MB QR code with pre-calculated transfer details.",
      ],
      [
        "保证金用于保障履约承诺，与整趟运费完全独立。",
        "保留金额、平台费用与税费均在确认前透明展示。",
        "余额不足时可通过页面生成的 MB 二维码快速补足差额。"
      ]
    ),
    sections: [
      {
        id: "phan-biet-ky-quy-cuoc",
        heading: t("1. Phân biệt tiền ký quỹ, phí chuyến và tiền cước", "1. Deposits vs. trip fees vs. freight fare", "1. 区分保证金、行程费与运费"),
        paragraphs: [
          t(
            "Nhiều người dùng mới dễ nhầm khoản ký quỹ với toàn bộ giá cước phải trả. Thực tế trên TXE PRO, khoản giữ bảo đảm của khách hàng được tạm giữ lúc xác nhận đặt xe và hoàn trả lại khi chuyến hoàn tất hợp lệ (nếu không thuộc trường hợp hủy phạt theo chính sách). Ký quỹ của khách hàng không tự động chuyển thành tiền cước thanh toán cho tài xế.",
            "New users sometimes confuse security deposits with the entire transport fare. On TXE PRO, the customer's deposit is temporarily reserved at booking confirmation and released back upon valid trip completion (unless subject to cancellation penalties). It does not automatically become the driver's freight payment.",
            "部分新用户容易将保证金误认为整笔运费。在 TXE PRO 上，客户保证金仅在确认预订时暂时保留，行程有效完成后即退还（除非触发取消扣罚），不会自动作为运费付给司机。"
          ),
          t(
            "Về phía tài xế, khoản bảo đảm (hoặc voucher hợp lệ) được giữ khi đăng tin xe trống. Khi tài xế bắt đầu chuyến đi, phí chuyến được chuyển trực tiếp từ chính khoản đã giữ này chứ không thu chồng thêm lần thứ hai lúc kết thúc chuyến.",
            "For drivers, security or an eligible voucher is reserved when posting availability. When starting the trip, the platform trip fee is settled directly from that reserved amount rather than charged a second time upon completion.",
            "司机端在发布空车时保留保障金或有效优惠券；行程开始时，平台行程费直接由该笔保留金扣转，结束行程时不会重复收费。"
          ),
        ],
      },
      {
        id: "nap-vi-va-voucher",
        heading: t("2. Nạp tiền qua mã QR và sử dụng ví khuyến mãi", "2. QR top-ups and promotional wallet rules", "2. 二维码充值与优惠钱包规则"),
        paragraphs: [
          t(
            "Nếu số dư ví chưa đủ cho thao tác đặt xe hoặc đăng tin, hệ thống tự tính đúng phần chênh lệch cần nạp và tạo mã QR chuyển khoản MB kèm nội dung tham chiếu chính xác. Sau khi tiền vào ví, bạn kiểm tra lại thông tin và bấm tiếp tục xác nhận để hoàn tất tạo đơn.",
            "If your balance is short for a booking or listing, the system calculates the exact difference and presents an MB QR transfer code with the required reference. Once credited, review your summary and continue confirming to create the order.",
            "如钱包余额不足，系统会自动计算所需差额并生成带准确附言的 MB 充值二维码。到账后请核对信息并继续点击确认以完成下单或发布。"
          ),
          t(
            "Riêng khoản bồi thường ghi có vào ví khuyến mãi có thể dùng để ký quỹ ngay khi khả dụng; phần chưa sử dụng và không bị tạm giữ được mở chuyển về ví chính sau đủ 60 ngày kể từ ngày ghi có.",
            "Compensation credits posted to the promotional wallet can cover deposits immediately while available; any unused, unreserved portion becomes eligible to transfer to the main wallet 60 days after the credit date.",
            "记入优惠钱包的补偿款项可在可用时直接用于保证金；未使用且未冻结的部分自入账日起满 60 天后可转入主钱包。"
          ),
        ],
        cta: {
          href: "/tro-giup",
          label: t("Xem giải đáp chi tiết về ví và ký quỹ", "Read wallet & deposit FAQ", "查看钱包与保证金问答"),
        },
      },
    ],
    relatedLinks: [
      { href: "/thong-tin/quy-che-hoat-dong", label: t("Quy chế hoạt động", "Operating rules", "平台运行规则") },
      { href: "/thong-tin/dieu-khoan-su-dung", label: t("Điều khoản sử dụng", "Terms of Service", "使用条款") },
      { href: "/thong-tin/khieu-nai-boi-thuong", label: t("Sự cố và hỗ trợ xử lý", "Incidents & support", "事件与处理支持") },
      { href: "/thong-tin/lien-he", label: t("Liên hệ bộ phận hỗ trợ", "Contact support", "联系客服支持") },
    ],
  },

  "khieu-nai-boi-thuong": {
    slug: "khieu-nai-boi-thuong",
    badge: t("Bảo vệ quyền lợi hai bên", "Dispute & incident protection", "双向权益保障"),
    title: t("Sự cố và hỗ trợ xử lý", "Incidents and Resolution Support", "行程事件与处理支持"),
    intro: t(
      "Hướng dẫn cách ghi nhận bằng chứng, phân biệt hủy đơn với báo cáo sự cố chuyến đi và quy trình đối soát 24 giờ khi phát sinh vấn đề ngoài dự kiến trên TXE PRO.",
      "How to preserve evidence, distinguish cancellations from trip incident reports and follow the 24-hour review workflow when unexpected issues arise on TXE PRO.",
      "说明如何留存凭证、区分取消订单与行程事件报告，以及发生意外时的 24 小时核查流程。"
    ),
    highlights: list(
      [
        "Hủy đơn và báo cáo sự cố là hai quy trình độc lập với điều kiện áp dụng riêng.",
        "Chủ hàng có 24 giờ để chấp nhận hoặc phản đối báo cáo sự cố ngay trong ứng dụng.",
        "Hồ sơ có phản đối kèm bằng chứng được quản trị viên TXE PRO rà soát thủ công minh bạch.",
      ],
      [
        "Cancellations and incident reports follow separate procedures and rules.",
        "Shippers have 24 hours in-app to accept or object to a submitted incident report.",
        "Disputed cases with supporting evidence are reviewed manually by TXE PRO administrators.",
      ],
      [
        "取消订单与事件报告各自独立，适用不同规则。",
        "货主可在 24 小时内于应用内接受或反对已提交的事件报告。",
        "存在异议并附证据的记录将由 TXE PRO 管理员人工复核。"
      ]
    ),
    sections: [
      {
        id: "phan-biet-huy-va-su-co",
        heading: t("1. Khi nào dùng Hủy đơn, khi nào dùng Báo cáo sự cố?", "1. Cancellation vs. incident reporting", "1. 何时取消订单，何时提交事件报告？"),
        paragraphs: [
          t(
            "Thao tác Hủy đơn chỉ áp dụng khi một bên thay đổi kế hoạch trước khi hoàn tất chuyến và trạng thái đơn cho phép. Mốc miễn phạt 5 phút trước khi bắt đầu chuyến được tính từ thời điểm tài xế chấp nhận đơn.",
            "Cancellation applies when either party changes plans while order status allows it. The 5-minute penalty-free window before trip start is counted from driver acceptance.",
            "取消订单适用于状态允许时任意一方变更计划。行程开始前的 5 分钟免罚期从司机接单时刻起算。"
          ),
          t(
            "Ngược lại, Báo cáo sự cố được tài xế khởi tạo ngay trên chi tiết đơn khi phát sinh tình huống bất khả kháng hoặc trở ngại thực tế trên đường (hư hỏng phương tiện, kẹt đường nghiêm trọng, địa chỉ không thể tiếp cận...). Không dùng báo cáo sự cố để thay thế việc hủy đơn thông thường.",
            "Conversely, an Incident Report is filed by the driver inside order details when genuine roadside disruptions occur (vehicle breakdown, impassable access, force majeure). Incident reports must not be misused as routine cancellations.",
            "事件报告则由司机在途中遇实际阻碍或不可抗力（如车辆故障、道路受阻、现场无法进入等）时在订单详情内提交，不得替代普通取消操作。"
          ),
        ],
      },
      {
        id: "quy-trinh-doi-soat",
        heading: t("2. Quy trình phản hồi 24 giờ và chuẩn bị bằng chứng", "2. The 24-hour review window and evidence checklist", "2. 24 小时反馈流程与凭证清单"),
        paragraphs: [
          t(
            "Ngay khi báo cáo sự cố được gửi, trạng thái đơn chuyển sang theo dõi sự cố và gửi thông báo đến chủ hàng. Trong vòng 24 giờ, chủ hàng có quyền xem chi tiết, bằng chứng đính kèm rồi bấm Chấp nhận hoặc Phản đối. Nếu có phản đối trong thời hạn, quản trị viên sẽ tạm dừng đóng tự động và kiểm tra bằng chứng từ cả hai phía.",
            "As soon as an incident report is submitted, the order enters incident review and notifies the shipper. Within 24 hours, the shipper may review attached evidence and either Accept or Object. Any timely objection pauses automatic closure so an administrator can evaluate both sides' evidence.",
            "提交事件报告后，订单随即进入事件状态并通知货主。货主可在 24 小时内查阅凭证并选择接受或反对；期限内提出反对的，系统暂停自动结案并由管理员核查双方材料。"
          ),
        ],
        checklist: list(
          [
            "Lưu mã đơn hàng (ORD-...) và ảnh chụp màn hình trạng thái hoặc thông báo lỗi.",
            "Chụp ảnh rõ hàng hóa, hiện trạng phương tiện hoặc vị trí thực tế có đủ ánh sáng.",
            "Giữ lại lịch sử trao đổi tin nhắn giữa chủ hàng và tài xế trong ứng dụng.",
            "Liên hệ qua trang Liên hệ chính thức của TXE PRO nếu cần bổ sung hồ sơ đối chiếu.",
          ],
          [
            "Keep the order code (ORD-...) and screenshots of statuses or error messages.",
            "Take clear, well-lit photos of cargo condition, vehicle issues or site conditions.",
            "Preserve in-app chat history between shipper and driver.",
            "Submit supporting files through TXE PRO's official Contact page if further review is required.",
          ],
          [
            "保留订单号（ORD-...）及状态或错误提示截图。",
            "在光线充足条件下拍摄货物、车辆或现场实况照片。",
            "保留应用内货主与司机的沟通记录。",
            "如需补充核查材料，请通过 TXE PRO 官方联系页面提交。"
          ]
        ),
        cta: {
          href: "/thong-tin/lien-he",
          label: t("Gửi yêu cầu hỗ trợ trực tiếp", "Submit a support request", "提交人工支持请求"),
        },
      },
    ],
    relatedLinks: [
      { href: "/thong-tin/lien-he", label: t("Kênh liên hệ chính thức", "Official contact page", "官方联系渠道") },
      { href: "/tracking", label: t("Kiểm tra trạng thái đơn hàng", "Check order status", "查询订单状态") },
      { href: "/thong-tin/thanh-toan-ky-quy", label: t("Chính sách ký quỹ & hoàn tiền", "Deposits & refunds", "保证金与退款规则") },
      { href: "/tin-tuc/kiem-tra-hang-khi-giao-nhan", label: t("Kinh nghiệm kiểm tra hàng giao nhận", "Handover inspection checklist", "交接验货清单") },
    ],
  },
};

export function getInfoPageContent(slug: InfoPageSlug): InfoPageContent {
  return INFO_CONTENT[slug];
}

export function getAllInfoPageContents(): InfoPageContent[] {
  return Object.values(INFO_CONTENT);
}
