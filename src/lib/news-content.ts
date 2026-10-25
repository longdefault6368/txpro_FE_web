import { getEditorialDetails } from "./news-editorial-details";

export type NewsReadingGuide = {
  intro: string; takeaways: string[]; conclusion: string;
  sections: {
    heading: string; paragraphs: string[];
    image?: { source: string; alt: string; caption: string };
    checklist?: string[]; example?: string; note?: string;
  }[];
};
export type NewsCategory = "news" | "guide" | "community" | "promotion" | "product";
export type NewsArticle = {
  id: string; title: string; summary: string; content: string;
  category: NewsCategory; imageUrl: string; publishedAt: string | null;
  editorial?: boolean;
  readingGuide?: NewsReadingGuide;
};
type Text = { vi: string; en: string; zh: string };
const t = (vi: string, en: string, zh: string): Text => ({ vi, en, zh });
type Editorial = {
  id: string; category: NewsCategory; imageUrl: string; title: Text; summary: Text;
  sections: { heading: Text; text: Text }[];
};

// Original evergreen guides: no invented dates, promotions, statistics or testimonials.
const editorials: Editorial[] = [
  {
    id: "chon-xe-phu-hop", category: "guide", imageUrl: "/images/home/shipper-cargo.png",
    title: t("Chọn đúng xe, bắt đầu một hành trình thuận tiện", "Choose the right vehicle for your next journey", "选对车辆，轻松开始下一段旅程"),
    summary: t("Chuẩn bị thông tin về hành trình, hàng hóa và thời gian trước khi tìm xe trên TXE PRO.", "Prepare your route, cargo details and timing before finding a vehicle on TXE PRO.", "找车前，先准备好路线、货物信息和出发时间。"),
    sections: [
      {
        heading: t("Bắt đầu từ nhu cầu thực tế", "Start with what you need", "从实际需求出发"),
        text: t("Trước khi tìm xe, hãy xác định chuyến đi dành cho hành khách hay vận chuyển hàng hóa. Với hàng hóa, chuẩn bị loại hàng, khối lượng dự kiến, số kiện và kích thước những món lớn. Đừng chỉ dựa vào cân nặng: một món đồ nhẹ nhưng cồng kềnh vẫn cần không gian phù hợp. Nếu chưa chắc loại xe nào phù hợp, ghi rõ đặc điểm hàng để trao đổi với tài xế trước khi xác nhận.", "First decide whether you need passenger transport or a vehicle for goods. For cargo, prepare the type of goods, estimated weight, number of packages and dimensions of large items. Weight alone is not enough: a light but bulky item still needs suitable space. If you are unsure about a vehicle, describe your goods and check with the driver before confirming.", "首先确定是乘客出行还是货物运输。运输货物时，请准备货物类型、预计重量、件数和大件尺寸。不要只看重量：轻而体积大的物品也需要合适空间。如果不确定车型，可详细描述货物，并在确认前与司机沟通。"),
      },
      {
        heading: t("Kiểm tra cả hai điểm trên bản đồ", "Check both ends of the route", "核对起点与终点"),
        text: t("Chọn đúng điểm nhận và điểm trả trên bản đồ, sau đó đối chiếu lại địa chỉ hiển thị. Bổ sung thông tin về cổng vào, điểm hẹn, đường nhỏ hoặc nơi dừng xe nếu cần. Chọn thời gian phù hợp với lịch bốc xếp hoặc đón khách; nếu đặt cho ngày khác, kiểm tra cả ngày lẫn giờ trước khi tiếp tục.", "Select the pickup and destination on the map and check the displayed addresses. Add useful details such as the entrance, meeting point, a narrow access road or parking arrangements. Choose a time that works for loading or passenger pickup. For a future journey, double-check both the date and time before continuing.", "在地图上选好起点和终点，再核对显示的地址。必要时补充入口、集合地点、狭窄道路或停车信息。时间应与装货或接客安排相符。预约其他日期时，请在继续前再次确认日期和时间。"),
      },
      {
        heading: t("Xem thông tin trước khi chọn tài xế", "Review before choosing a driver", "选择司机前仔细查看"),
        text: t("So sánh thông tin phương tiện, lịch xe và giá đề xuất trong danh sách phù hợp. Ảnh hàng hóa rõ ràng giúp hai bên trao đổi dễ hơn, nhưng không thay thế việc xác nhận các yêu cầu đặc biệt. Đọc điều kiện đang hiển thị trước khi đặt xe. Sau khi kết nối, theo dõi trạng thái đơn và dùng kênh liên hệ trong ứng dụng nếu cần làm rõ chi tiết.", "Compare vehicle details, availability and proposed prices in the matching list. Clear cargo photos help the conversation but do not replace agreement on special requirements. Review the conditions shown before booking. After connecting, follow the order status and use the app's contact options to clarify details.", "比较匹配列表中的车辆资料、可用时间和报价。清晰的货物照片有助于沟通，但特殊要求仍需另行确认。预订前请阅读当前显示的条件。建立联系后，关注订单状态，必要时通过应用内联系方式确认细节。"),
      },
    ],
  },
  {
    id: "dang-xe-trong-hieu-qua", category: "guide", imageUrl: "/splash1.png",
    title: t("Một tin xe trống rõ ràng cần những thông tin gì?", "What makes a clear vehicle-availability listing?", "一条清晰的空车信息需要什么？"),
    summary: t("Tuyến đường, thời gian và thông tin xe đầy đủ giúp chủ hàng dễ cân nhắc lựa chọn.", "A clear route, availability and vehicle details help shippers make an informed choice.", "完整的路线、时间和车辆资料，有助于货主做出选择。"),
    sections: [
      {
        heading: t("Chọn đúng phương tiện và khoảng hoạt động", "Choose the vehicle and operating area", "选择车辆与服务范围"),
        text: t("Trước khi đăng, kiểm tra phương tiện đã chọn, loại xe và thông tin hồ sơ. Khai báo khả năng chở phù hợp với phương tiện thực tế; không đặt khoảng tải trọng vượt mức xe đã đăng ký. Với chuyến chở người, kiểm tra loại xe và số chỗ. Chọn khu vực nhận và trả phù hợp với tuyến bạn dự định chạy, thay vì mở quá rộng nhưng khó đáp ứng.", "Before posting, review the selected vehicle, its type and profile details. Describe capacity that matches the actual registered vehicle, without setting a range above its recorded limit. For passenger trips, check the vehicle type and seats. Select pickup and destination areas that suit your intended route rather than an overly broad area you cannot reliably serve.", "发布前，检查所选车辆、车型和资料。运力应与实际登记车辆相符，载重范围不要超过登记上限。载客行程请核对车型和座位数。起终点服务范围应符合计划路线，不宜设置过广却难以履行的范围。"),
      },
      {
        heading: t("Lịch xe và giá cần nhất quán", "Keep timing and pricing clear", "时间与报价保持清晰"),
        text: t("Đặt thời gian xe thực sự sẵn sàng, có tính đến lịch chạy và thời gian chuẩn bị. Với lịch đăng tự động, kiểm tra lại những ngày được chọn và khung giờ áp dụng sau khi lưu. Nhập giá dự kiến cẩn thận, đồng thời ghi rõ các yêu cầu cần trao đổi trước chuyến nếu có. Điều kiện voucher hoặc ký quỹ phải theo thông tin hệ thống hiển thị cho lần đăng đó.", "Set a time when the vehicle is genuinely available, allowing for your schedule and preparation. For automatic listings, review the selected dates and time window after saving. Enter your proposed price carefully and note anything that needs discussion before the trip. Voucher and deposit conditions follow the information displayed for that listing.", "设置车辆真正可用的时间，并考虑现有行程和准备时间。使用自动发布时，保存后再次检查所选日期及时间段。仔细填写报价，并注明出发前需要沟通的事项。优惠券和保证金条件以本次发布界面显示的信息为准。"),
      },
      {
        heading: t("Giữ thông tin cập nhật", "Keep the listing up to date", "及时更新信息"),
        text: t("Theo dõi thông báo và phản hồi khi xe được chọn. Nếu lịch thay đổi hoặc xe không còn sẵn sàng, chủ động cập nhật hoặc tạm dừng tin liên quan. Khi có nhiều tin, kiểm tra từng tuyến và từng phương tiện để tránh nhận lịch khó thực hiện. Thông tin chính xác và phản hồi rõ ràng giúp hai bên thống nhất chuyến đi thuận tiện hơn.", "Watch notifications and respond when your vehicle is selected. If your schedule changes or the vehicle is no longer available, update or pause the relevant listing. With multiple listings, check each route and vehicle to avoid accepting conflicting commitments. Accurate information and clear responses make it easier to agree on the journey.", "车辆被选中后，请留意通知并及时回应。时间变化或车辆不可用时，主动更新或暂停相关信息。同时发布多条信息时，要逐一核对路线和车辆，避免接受难以履行的安排。准确资料与清晰沟通有助于双方确认行程。"),
      },
    ],
  },
  {
    id: "chuan-bi-do-noi-that", category: "guide", imageUrl: "/images/news/furniture.png",
    title: t("Chuẩn bị đồ nội thất trước ngày vận chuyển", "Prepare furniture before moving day", "搬运前如何准备家具"),
    summary: t("Một danh sách đơn giản để kiểm kê, đóng gói và trao đổi việc giao nhận rõ ràng hơn.", "A practical checklist for inventory, packing and clear handover arrangements.", "用一份清单，理清物品、包装和交接安排。"),
    sections: [
      {
        heading: t("Lập danh sách và chụp hiện trạng", "Make an inventory and record condition", "列清单并记录现状"),
        text: t("Ghi lại các món cần chuyển, số lượng và những chi tiết dễ trầy xước hoặc dễ vỡ. Đo các món lớn và lối đi liên quan để trao đổi trước về khả năng đưa đồ qua cửa, thang máy hoặc cầu thang. Chụp hiện trạng bằng ảnh rõ nét, đủ sáng. Nếu có món cần tháo lắp hoặc xử lý chuyên biệt, thống nhất trước với người thực hiện.", "List the items, quantities and surfaces that are fragile or easily scratched. Measure larger pieces and relevant access points to discuss doorways, lifts or stairs in advance. Take clear, well-lit condition photos. If an item requires dismantling or specialist handling, agree on the arrangements with the people carrying out the work.", "记录需要搬运的物品、数量及易碎或易刮花部位。测量大件物品和相关通道，提前沟通门口、电梯或楼梯是否可通过。拍摄清晰、光线充足的现状照片。需要拆装或专业处理的物品，应提前与执行人员商定。"),
      },
      {
        heading: t("Đóng gói và đánh dấu dễ nhận biết", "Pack and label clearly", "做好包装与标记"),
        text: t("Chuẩn bị vật liệu bảo vệ phù hợp với từng món và hướng dẫn của nhà sản xuất. Phân loại phụ kiện, để ốc vít vào túi riêng có nhãn đi cùng món đồ. Ghi tên món hoặc khu vực nhận lên kiện để tránh nhầm lẫn. Đồ đặc biệt nặng, kính lớn hoặc thiết bị có yêu cầu riêng nên được người có chuyên môn hướng dẫn cách xử lý.", "Use protective materials suited to each item and the manufacturer's instructions. Group accessories and place screws in labelled bags associated with the correct piece. Label packages by item or destination room. Seek qualified handling guidance for very heavy pieces, large glass panels or equipment with special requirements.", "按物品特点及制造商说明选择保护材料。配件分类存放，螺丝装入带标签的独立袋中，并与对应家具一起交接。包装上标注物品或目的房间。特别重的家具、大块玻璃或有特殊要求的设备，请咨询专业人员的处理方式。"),
      },
      {
        heading: t("Thống nhất việc giao nhận", "Agree on the handover", "明确交接安排"),
        text: t("Gửi cho tài xế thông tin số kiện, kích thước và ảnh cần thiết trước chuyến. Trao đổi rõ địa chỉ, chỗ dừng xe, giờ có thể giao nhận và ai phụ trách bốc xếp. Khi nhận lại đồ, đối chiếu danh sách và hiện trạng cùng bên giao. Nếu có khác biệt, ghi nhận ngay bằng thông tin cụ thể để các bên có cơ sở trao đổi.", "Share the package count, dimensions and relevant photos with the driver before the trip. Confirm addresses, stopping arrangements, handover hours and who handles loading. At the destination, compare the inventory and condition with the delivering party. Record any differences clearly so everyone has a shared basis for discussion.", "出发前向司机提供件数、尺寸及必要照片。明确地址、停车安排、可交接时间及装卸负责人。到达后，与交付方共同核对清单和现状。发现差异时，及时记录具体情况，方便各方沟通。"),
      },
    ],
  },
  {
    id: "san-sang-truoc-chuyen-di", category: "community", imageUrl: "/images/news/vehicle-check.png",
    title: t("Dành ít phút chuẩn bị trước mỗi chuyến đi", "Take time to prepare before every trip", "每次出发前，留一点准备时间"),
    summary: t("Kiểm tra lịch trình, thông tin liên hệ và tình trạng phương tiện trước khi khởi hành.", "Review your plan, contact details and vehicle readiness before setting off.", "出发前，检查行程、联系信息与车辆状态。"),
    sections: [
      {
        heading: t("Đối chiếu thông tin chuyến", "Review the trip details", "核对行程资料"),
        text: t("Mở lại thông tin đơn, đối chiếu điểm nhận, điểm trả và thời gian đã thống nhất. Nếu có yêu cầu đổi vị trí, đọc kỹ nội dung trước khi phản hồi để tránh đi theo địa chỉ chưa được hai bên xác nhận. Lưu ý lối vào, nơi dừng xe và thông tin người liên hệ ở từng đầu. Chủ động trao đổi khi một chi tiết chưa rõ.", "Reopen the trip details and check the agreed pickup, destination and time. If a location change has been requested, review it before responding so you do not follow an address that has not been agreed by both parties. Note access points, stopping arrangements and the contact at each end. Ask whenever something is unclear.", "重新查看订单，核对双方约定的起点、终点和时间。收到位置变更请求时，先仔细阅读再回应，避免前往尚未确认的地址。留意入口、停车安排及两端联系人。遇到不明确的信息，应主动沟通。"),
      },
      {
        heading: t("Chuẩn bị phương tiện và thiết bị", "Prepare the vehicle and your device", "准备车辆与设备"),
        text: t("Thực hiện việc kiểm tra xe theo hướng dẫn sử dụng và lịch bảo dưỡng của phương tiện. Khi phát hiện dấu hiệu bất thường, nhờ đơn vị có chuyên môn kiểm tra trước khi vận hành. Chuẩn bị pin điện thoại, kết nối mạng và quyền định vị cần cho chuyến. Thiết lập các mục cần thiết khi đang dừng xe an toàn, không thao tác điện thoại trong lúc điều khiển.", "Follow the vehicle's operating manual and maintenance schedule for readiness checks. Have unusual signs assessed by a qualified service provider before operating. Prepare your phone battery, network connection and the location permissions needed for the journey. Set up the app while safely parked, not while driving.", "按车辆使用说明和保养计划进行出发前检查。发现异常时，应先请专业服务人员检查，再决定是否使用。准备好手机电量、网络和行程所需的定位权限。应用设置应在安全停车时完成，驾驶中不要操作手机。"),
      },
      {
        heading: t("Trao đổi sớm khi kế hoạch thay đổi", "Communicate changes early", "计划变化时及时沟通"),
        text: t("Nếu dự kiến đến muộn hoặc không thể thực hiện đúng lịch, thông báo cho bên còn lại càng sớm càng tốt. Khi phát sinh vấn đề, cung cấp thông tin cụ thể và dùng chức năng hỗ trợ phù hợp trong ứng dụng. Thông tin rõ ràng giúp mọi người điều chỉnh kế hoạch; không nên tự suy đoán trạng thái chuyến chỉ từ vị trí hiển thị trên bản đồ.", "If you expect a delay or cannot keep the agreed schedule, let the other party know early. When a problem arises, share concrete details and use the appropriate support function in the app. Clear information helps everyone adjust their plans. Do not infer the trip's status from the map position alone.", "预计迟到或无法按时完成时，应尽早通知对方。发生问题后，提供具体信息，并使用应用内合适的支持功能。清晰沟通有助于各方调整计划，不要只凭地图位置猜测行程状态。"),
      },
    ],
  },
];

export function getEditorialArticles(language = "vi"): NewsArticle[] {
  const lang = language === "en" || language === "zh" ? language : "vi";
  return editorials.map(item => {
    const extra = getEditorialDetails(item.id, lang);
    const sections = item.sections.map((section, index) => {
      const addition = extra?.additions[index];
      return {
        heading: section.heading[lang],
        paragraphs: [section.text[lang], ...(addition ? [addition.paragraph] : [])],
        image: addition?.image, checklist: addition?.checklist,
        example: addition?.example, note: addition?.note,
      };
    });
    const readingGuide = extra ? { intro: extra.intro, takeaways: extra.takeaways, conclusion: extra.conclusion, sections } : undefined;
    const content = [
      extra?.intro, ...(extra?.takeaways || []),
      ...sections.flatMap(section => [
        "## " + section.heading, ...section.paragraphs, ...(section.checklist || []),
        section.example, section.note,
      ]),
      extra?.conclusion,
    ].filter(Boolean).join("\n\n");
    return {
      id: item.id, category: item.category, imageUrl: item.imageUrl, editorial: true,
      title: item.title[lang], summary: item.summary[lang], publishedAt: null,
      content, readingGuide,
    };
  });
}

/** Convert CMS markup into inert text, never inject stored HTML into the page. */
export function newsPlainText(input: string): string {
  return input
    .replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|ul|ol|blockquote)>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos);|&#(?:\d+|x[\da-f]+);/gi, value => {
      const named: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
      if (named[value.toLowerCase()]) return named[value.toLowerCase()];
      const code = value.toLowerCase().startsWith("&#x") ? parseInt(value.slice(3), 16) : parseInt(value.slice(2), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
