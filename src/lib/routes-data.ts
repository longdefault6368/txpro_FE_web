export const ROUTE_SLUGS = [
  "hue-da-nang",
  "hue-ha-noi",
  "hue-tp-hcm",
  "ha-noi-da-nang",
  "da-nang-tp-hcm",
  "ha-noi-tp-hcm",
  "tp-hcm-binh-duong-dong-nai",
  "tp-hcm-can-tho-mien-tay",
] as const;

export type RouteSlug = (typeof ROUTE_SLUGS)[number];
export type RouteRegion = "central" | "north-south" | "south";

export interface RouteCorridor {
  slug: RouteSlug;
  region: RouteRegion;
  regionLabel: string;
  originName: string;
  destinationName: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  heroSubtitle: string;
  image: string;
  imageAlt: string;
  highwayNote: string;
  typicalVehicles: string[];
  typicalGoods: string[];
  corridorInsights: string[];
  shipperTips: string[];
  driverTips: string[];
  faqs: Array<{ question: string; answer: string }>;
  relatedServices: string[];
  relatedRoutes: RouteSlug[];
  relatedGuides: Array<{ slug: string; title: string }>;
}

export const ROUTE_CORRIDORS: RouteCorridor[] = [
  {
    slug: "hue-da-nang",
    region: "central",
    regionLabel: "Miền Trung – Huế",
    originName: "TP. Huế",
    destinationName: "Đà Nẵng",
    name: "Vận chuyển hàng tuyến Huế – Đà Nẵng",
    seoTitle: "Tìm xe chở hàng Huế – Đà Nẵng & ghép xe chiều về | TXE PRO",
    seoDescription:
      "Kết nối chủ hàng và tài xế xe tải, ô tô chạy tuyến Huế – Đà Nẵng hai chiều. Đăng nhu cầu tìm xe hoặc đăng xe trống chiều về nhanh chóng trên TXE PRO.",
    heroSubtitle:
      "Tuyến kết nối trọng điểm giữa TP. Huế và TP. Đà Nẵng qua hầm Hải Vân và cao tốc La Sơn – Túy Loan, tần suất xe hai chiều cao mỗi ngày.",
    image: "/images/news/diem-giao-nhan.webp",
    imageAlt: "Vận chuyển hàng hóa tuyến Huế – Đà Nẵng trên TXE PRO",
    highwayNote: "Trục Quốc lộ 1A qua hầm đường bộ Hải Vân và tuyến cao tốc La Sơn – Hòa Liên",
    typicalVehicles: ["Xe tải nhỏ 500kg – 2.5 tấn", "Xe tải 3.5 – 8 tấn", "Xe đông lạnh", "Ô tô di chuyển theo tuyến"],
    typicalGoods: [
      "Hàng tiêu dùng, thực phẩm, đặc sản và hàng phân phối cho đại lý tại Huế – Đà Nẵng.",
      "Đồ nội thất, vật liệu trang trí, thiết bị văn phòng và hàng chuyển nhà liên tỉnh ngắn.",
      "Linh kiện, máy móc nhỏ và hàng ghép cần giao nhận trong ngày.",
    ],
    corridorInsights: [
      "Tuyến Huế – Đà Nẵng có cự ly ngắn giữa hai trung tâm kinh tế – du lịch miền Trung, rất thuận lợi cho cả đặt xe nguyên chuyến trong ngày lẫn ghép hàng tiện chuyến hai chiều.",
      "Xe tải lưu thông qua hầm Hải Vân cần tuân thủ quy định tải trọng, hàng hóa dễ cháy nổ và khung giờ cấm tải tại khu vực nội đô Đà Nẵng và trung tâm TP. Huế.",
    ],
    shipperTips: [
      "Ghi rõ địa chỉ nhận/trả nằm trong trung tâm hay khu công nghiệp (Phú Bài, Hòa Khánh, Liên Chiểu) để tài xế tính chuẩn thời gian chạy.",
      "Với hàng dễ ẩm hoặc đồ nội thất đi qua vùng đèo/mưa miền Trung, ưu tiên chọn xe tải thùng kín hoặc bạt che kỹ.",
      "Đặt xe sớm hơn khung giờ mong muốn để có thêm lựa chọn xe chiều về từ Đà Nẵng ra Huế hoặc ngược lại.",
    ],
    driverTips: [
      "Tài xế giao hàng xong tại Đà Nẵng hoặc KCN Phú Bài nên đăng ngay tin xe trống chiều về kèm khung giờ rời điểm trả để dễ khớp hàng ghép.",
      "Nếu chạy tuyến Huế – Đà Nẵng lặp lại các ngày trong tuần, thiết lập đăng tin tự động trên app TXE PRO để duy trì hiển thị đều đặn.",
    ],
    faqs: [
      {
        question: "Có thể tìm xe chở hàng hai chiều Huế – Đà Nẵng và Đà Nẵng – Huế trên TXE PRO không?",
        answer:
          "Có. Bạn chỉ cần nhập đúng điểm nhận và điểm trả theo chiều mong muốn trên biểu mẫu Tìm xe, hệ thống sẽ đối chiếu các tin xe trống phù hợp đang chạy đúng chiều.",
      },
      {
        question: "Tuyến Huế – Đà Nẵng phù hợp ghép hàng hay thuê nguyên xe?",
        answer:
          "Cả hai đều thuận tiện. Hàng nhiều kiện, đồ chuyển nhà hoặc hàng cần giao thẳng kho nên chọn nguyên xe tải nhỏ/trung; kiện hàng lẻ có thể chọn tin xe tiện chuyến chiều về.",
      },
      {
        question: "Làm sao theo dõi tiến độ xe khi hàng đang qua hầm Hải Vân?",
        answer:
          "Bạn theo dõi các mốc hành trình và thời điểm cập nhật GPS mới nhất ngay trên ứng dụng hoặc dùng mã đơn ORD tại trang Theo dõi đơn hàng. Lưu ý vị trí GPS có thể tạm trễ khi xe đi qua khu vực hầm hoặc sóng yếu.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "ghep-hang-tien-chuyen", "di-chuyen-o-to-xe-may"],
    relatedRoutes: ["hue-ha-noi", "hue-tp-hcm", "ha-noi-da-nang"],
    relatedGuides: [
      { slug: "chon-xe-phu-hop", title: "Chọn đúng xe, bắt đầu một hành trình thuận tiện" },
      { slug: "dang-xe-trong-hieu-qua", title: "Một tin xe trống rõ ràng cần những thông tin gì?" },
    ],
  },
  {
    slug: "hue-ha-noi",
    region: "central",
    regionLabel: "Miền Trung – Huế",
    originName: "TP. Huế",
    destinationName: "Hà Nội",
    name: "Vận chuyển hàng tuyến Huế – Hà Nội",
    seoTitle: "Tìm xe chở hàng Huế – Hà Nội & gửi hàng liên tỉnh | TXE PRO",
    seoDescription:
      "Tìm xe tải chở hàng, ghép hàng tiện chuyến tuyến Huế – Hà Nội hai chiều trên TXE PRO. Minh bạch lịch xe, tải trọng và theo dõi hành trình rõ ràng.",
    heroSubtitle:
      "Kết nối vận chuyển hàng hóa hai chiều giữa TP. Huế và khu vực Hà Nội dọc Quốc lộ 1A và trục cao tốc Bắc – Nam phía Đông.",
    image: "/images/news/lich-van-chuyen.webp",
    imageAlt: "Vận chuyển hàng hóa tuyến Huế – Hà Nội trên TXE PRO",
    highwayNote: "Trục Quốc lộ 1A và các đoạn cao tốc Cam Lộ – La Sơn, Vũng Áng – Bùng – Nghi Sơn – Pháp Vân",
    typicalVehicles: ["Xe tải 3.5 – 15 tấn đường dài", "Xe tải thùng kín / mui bạt", "Xe đông lạnh", "Xe ghép hàng tuyến Bắc – Trung"],
    typicalGoods: [
      "Hàng thương mại, thiết bị, vật tư và sản phẩm thủ công – đặc sản gửi từ Huế ra miền Bắc.",
      "Hàng tổng hợp, máy móc, vật tư công nghiệp và hàng tiêu dùng phân phối từ Hà Nội về Thừa Thiên Huế.",
      "Hàng chuyển nhà liên tỉnh và kiện hàng cỡ lớn cần thùng xe chống mưa gió đường dài.",
    ],
    corridorInsights: [
      "Cung đường Huế – Hà Nội kéo dài qua nhiều tỉnh Bắc Trung Bộ nên yêu cầu đóng gói chắc chắn, chằng buộc kỹ và thống nhất trước thời gian giao nhận ở cả hai đầu.",
      "Khu vực nội thành Hà Nội có nhiều khung giờ cấm xe tải nghiêm ngặt; việc xác định rõ điểm hạ hàng (kho ngoại thành hay trung tâm) giúp tránh chờ đợi phát sinh.",
    ],
    shipperTips: [
      "Đóng gói hàng chống sốc và bọc chống ẩm kỹ cho chặng đường dài qua nhiều vùng thời tiết.",
      "Ghi rõ có cần xe hạ tải trung chuyển vào nội đô Hà Nội hay giao tại bãi/kho vùng ven (Hoàng Mai, Gia Lâm, Hoài Đức, Đông Anh...).",
      "Chuẩn bị hóa đơn hoặc phiếu xuất kho kèm theo hàng hóa thương mại khi vận chuyển liên tỉnh.",
    ],
    driverTips: [
      "Chủ động đăng tin xe trống sớm trước 1–2 ngày khi có lịch chạy ra Hà Nội hoặc chiều về Huế để tối ưu tỷ lệ lấp đầy thùng.",
      "Cập nhật rõ tải trọng thực tế còn trống và các tỉnh có thể dừng nhận/trả hàng dọc tuyến Quảng Trị – Nghệ An – Thanh Hóa – Hà Nội.",
    ],
    faqs: [
      {
        question: "Gửi hàng lẻ tuyến Huế – Hà Nội có ghép được xe tải đường dài không?",
        answer:
          "Có. Chủ hàng chỉ cần mô tả rõ kích thước, khối lượng kiện hàng và thời gian gửi để đối chiếu với các tin xe tải đường dài đang tìm hàng ghép trên trục Huế – Hà Nội.",
      },
      {
        question: "Cần chuẩn bị giấy tờ gì cho hàng hóa vận chuyển liên tỉnh Huế – Hà Nội?",
        answer:
          "Với hàng hóa kinh doanh, chủ hàng nên kèm theo hóa đơn hoặc phiếu xuất kho hợp lệ theo quy định hiện hành để quá trình lưu thông trên đường được thuận lợi.",
      },
      {
        question: "Chủ hàng có kiểm tra được ảnh hàng khi giao tại Hà Nội không?",
        answer:
          "Có. Khi tài xế kết thúc chuyến chở hàng, ứng dụng yêu cầu tải 1–3 ảnh giao nhận rõ nét để chủ hàng xem và xác nhận hoàn thành.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "ghep-hang-tien-chuyen", "xe-dong-lanh-container-chuyen-dung"],
    relatedRoutes: ["hue-da-nang", "hue-tp-hcm", "ha-noi-da-nang"],
    relatedGuides: [
      { slug: "chuan-bi-hang-de-vo", title: "Chuẩn bị và đóng gói hàng dễ vỡ khi vận chuyển" },
      { slug: "theo-doi-chuyen-di-va-gps", title: "Theo dõi chuyến đi và thông tin GPS" },
    ],
  },
  {
    slug: "hue-tp-hcm",
    region: "central",
    regionLabel: "Miền Trung – Huế",
    originName: "TP. Huế",
    destinationName: "TP. Hồ Chí Minh",
    name: "Vận chuyển hàng tuyến Huế – TP. Hồ Chí Minh",
    seoTitle: "Vận chuyển hàng Huế – TP. HCM & tìm xe tải hai chiều | TXE PRO",
    seoDescription:
      "Tìm xe tải chở hàng, ghép hàng tiện chuyến tuyến Huế – TP. Hồ Chí Minh hai chiều. Đăng nhu cầu trực tuyến, chọn đúng xe và theo dõi vận đơn trên TXE PRO.",
    heroSubtitle:
      "Kết nối luồng hàng hai chiều giữa TP. Huế và trung tâm kinh tế TP. Hồ Chí Minh với đa dạng xe tải đường dài, xe lạnh và xe ghép chuyến.",
    image: "/images/news/gps-hanh-trinh.webp",
    imageAlt: "Theo dõi vận chuyển hàng tuyến Huế – TP. Hồ Chí Minh trên TXE PRO",
    highwayNote: "Trục Quốc lộ 1A kết nối cao tốc Đà Nẵng – Quảng Ngãi và hệ thống cao tốc Duyên hải Nam Trung Bộ – Dầu Giây",
    typicalVehicles: ["Xe tải 5 – 15 tấn mui bạt / thùng kín", "Xe đông lạnh đường dài", "Xe container", "Xe tải ghép hàng chiều về"],
    typicalGoods: [
      "Hàng thương mại, thiết bị gia dụng, nguyên vật liệu và hàng kho xưởng từ TP. HCM về Huế.",
      "Nông sản, sản phẩm chế biến, đồ gỗ mỹ nghệ và đồ đạc gia đình chuyển từ Huế vào Nam.",
      "Hàng lô doanh nghiệp cần lịch xuất bến và đầu mối nhận hàng cố định.",
    ],
    corridorInsights: [
      "Đây là tuyến vận tải đường dài xuyên miền Trung – Nam Trung Bộ nên việc đồng bộ lịch bốc xếp ở kho gửi và kho nhận giúp giảm đáng kể thời gian chờ hạ hàng.",
      "Nhiều xe tải từ TP. HCM ra miền Trung có nhu cầu gom hàng chiều về rất lớn, tạo điều kiện thuận lợi cho chủ hàng tại Huế đặt xe tiện chuyến.",
    ],
    shipperTips: [
      "Phân rõ kiện dễ vỡ, hàng lỏng và hàng nặng để xếp đúng vị trí trên thùng xe đường dài.",
      "Cung cấp trước thời gian kho nhận tại TP. HCM mở cửa và quy định giờ vào nội thành đối với xe tải lớn.",
      "Dùng mã ORD để chia sẻ trực tiếp cho bộ phận kho nhận hàng chủ động sắp xếp nhân lực bốc dỡ.",
    ],
    driverTips: [
      "Kiểm tra lốp, phanh, bạt phủ thùng và pin/kết nối GPS trước khi khởi hành chặng dài.",
      "Đăng tin xe trống trước khi hoàn tất chuyến đi trước để nối chuyến mượt tại đầu Huế hoặc TP. HCM.",
    ],
    faqs: [
      {
        question: "Có thể thuê nguyên xe tải hoặc ghép hàng tuyến Huế – TP. HCM không?",
        answer:
          "Có. TXE PRO cho phép chủ hàng đăng nhu cầu phù hợp tải trọng thực tế để kết nối với cả xe chạy nguyên chuyến lẫn xe còn trống tải trọng cùng cung đường.",
      },
      {
        question: "Cần chú ý gì về điểm giao hàng tại TP. Hồ Chí Minh?",
        answer:
          "Xe tải nặng bị hạn chế lưu thông trong nội thành TP. HCM vào nhiều khung giờ ban ngày. Bạn nên ghi rõ địa chỉ nhận để thống nhất giờ giao hoặc phương án trung chuyển phù hợp.",
      },
      {
        question: "Hàng gửi đi đường dài có được xác nhận hiện trạng lúc bàn giao không?",
        answer:
          "Có. Hai bên nên chụp ảnh hàng trước khi xếp lên xe, và khi giao hàng tại điểm trả tài xế sẽ tải 1–3 ảnh bàn giao lên ứng dụng để chủ hàng kiểm tra trước khi xác nhận hoàn thành.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "ghep-hang-tien-chuyen", "chuyen-nha-noi-that"],
    relatedRoutes: ["hue-da-nang", "da-nang-tp-hcm", "ha-noi-tp-hcm"],
    relatedGuides: [
      { slug: "chup-anh-hang-hoa-ro-rang", title: "Chụp ảnh hàng hóa rõ ràng trước chuyến" },
      { slug: "theo-doi-don-theo-ma", title: "Theo dõi đơn theo mã vận đơn trên TXE PRO" },
    ],
  },
  {
    slug: "ha-noi-da-nang",
    region: "north-south",
    regionLabel: "Trục đường dài Bắc – Nam",
    originName: "Hà Nội",
    destinationName: "Đà Nẵng",
    name: "Vận chuyển hàng tuyến Hà Nội – Đà Nẵng",
    seoTitle: "Tìm xe chở hàng Hà Nội – Đà Nẵng & ghép xe tải | TXE PRO",
    seoDescription:
      "Kết nối tìm xe tải chở hàng, xe ghép chuyến và xe đông lạnh tuyến Hà Nội – Đà Nẵng hai chiều. Minh bạch lịch chạy và theo dõi hành trình trên TXE PRO.",
    heroSubtitle:
      "Hành lang vận tải Bắc – Trung sôi động nối khu vực Hà Nội với trung tâm logistics Đà Nẵng, hỗ trợ cả đơn hàng doanh nghiệp và ghép chuyến.",
    image: "/images/news/trao-doi-truoc-chuyen.webp",
    imageAlt: "Kết nối xe tải chở hàng tuyến Hà Nội – Đà Nẵng trên TXE PRO",
    highwayNote: "Trục cao tốc Bắc – Nam phía Đông kết hợp Quốc lộ 1A qua Thanh Hóa, Nghệ An, Hà Tĩnh, Quảng Bình, Huế",
    typicalVehicles: ["Xe tải 5 – 15 tấn", "Xe tải thùng kín chở hàng thương mại", "Xe đông lạnh", "Xe đầu kéo container"],
    typicalGoods: [
      "Hàng điện máy, thiết bị công nghiệp, phụ tùng và vật tư thương mại từ Hà Nội vào miền Trung.",
      "Hàng thủy hải sản đông lạnh, thực phẩm, vật liệu và hàng phân phối từ Đà Nẵng ra Bắc.",
      "Hàng dự án, thiết bị sự kiện và nội thất cho khách sạn, công trình.",
    ],
    corridorInsights: [
      "Hà Nội – Đà Nẵng là một trong những tuyến có lưu lượng xe tải hai chiều ổn định nhất miền Trung, thuận tiện kết nối cả hàng nguyên xe lẫn hàng ghép dọc tuyến.",
      "Chặng đường đi qua nhiều đoạn đèo và địa hình thay đổi thời tiết nhanh ở Bắc Trung Bộ nên cần thùng kín hoặc chằng bạt cẩn thận.",
    ],
    shipperTips: [
      "Nêu rõ điểm nhận/trả thuộc khu công nghiệp hay nội thành để tài xế tính phương án di chuyển ngoài khung giờ cấm tải.",
      "Kiểm kê chính xác số kiện và dán mã nhận diện lên từng thùng trước khi bàn giao.",
      "Thỏa thuận rõ trách nhiệm nâng hạ (xe nâng, bốc xếp tay) ở cả hai đầu kho.",
    ],
    driverTips: [
      "Đăng sớm lịch chạy Hà Nội – Đà Nẵng và chiều ngược lại để đón trước các lô hàng phân phối đặt lịch trước 1–3 ngày.",
      "Khai báo đúng kích thước lòng thùng và tải trọng đăng kiểm để chủ hàng dễ quyết định ngay.",
    ],
    faqs: [
      {
        question: "Tuyến Hà Nội – Đà Nẵng có hỗ trợ xe đông lạnh và xe tải lớn không?",
        answer:
          "Có. Chủ hàng có thể chọn trực tiếp nhóm Xe tải, Xe đông lạnh hoặc Container ngay trên biểu mẫu đăng nhu cầu tìm xe của TXE PRO.",
      },
      {
        question: "Làm sao trao đổi rõ điều kiện bốc xếp trước khi xác nhận đơn?",
        answer:
          "Bạn nên ghi rõ yêu cầu bốc xếp trong mô tả đơn hàng và trao đổi lại với tài xế về điểm đậu xe, thiết bị nâng hạ trước bước xác nhận đặt xe.",
      },
      {
        question: "Tài xế có thể nhận thêm đơn ghép dọc đường trên tuyến Hà Nội – Đà Nẵng không?",
        answer:
          "Có. Quy trình hiện tại cho phép tài xế đăng nhiều tin xe trống và quản lý từng tuyến phù hợp với tải trọng thực tế còn lại của xe.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "ghep-hang-tien-chuyen", "xe-dong-lanh-container-chuyen-dung"],
    relatedRoutes: ["hue-ha-noi", "hue-da-nang", "da-nang-tp-hcm"],
    relatedGuides: [
      { slug: "trao-doi-truoc-khi-dat-xe", title: "Trao đổi thông tin rõ ràng trước khi đặt xe" },
      { slug: "de-xuat-gia-cuoc-xe", title: "Hướng dẫn đề xuất giá cước rõ ràng cho tài xế" },
    ],
  },
  {
    slug: "da-nang-tp-hcm",
    region: "north-south",
    regionLabel: "Trục đường dài Bắc – Nam",
    originName: "Đà Nẵng",
    destinationName: "TP. Hồ Chí Minh",
    name: "Vận chuyển hàng tuyến Đà Nẵng – TP. Hồ Chí Minh",
    seoTitle: "Tìm xe chở hàng Đà Nẵng – TP. HCM & ghép hàng tiện chuyến | TXE PRO",
    seoDescription:
      "Tìm xe tải chở hàng, xe ghép chuyến và xe lạnh tuyến Đà Nẵng – TP. Hồ Chí Minh hai chiều trên TXE PRO. Đặt xe minh bạch, theo dõi lộ trình trực tuyến.",
    heroSubtitle:
      "Tuyến vận tải huyết mạch Trung – Nam kết nối cụm khu công nghiệp Đà Nẵng với TP. Hồ Chí Minh và vùng kinh tế trọng điểm phía Nam.",
    image: "/images/news/ban-giao-hang.webp",
    imageAlt: "Bàn giao và vận chuyển hàng tuyến Đà Nẵng – TP. Hồ Chí Minh",
    highwayNote: "Cao tốc Đà Nẵng – Quảng Ngãi, Quốc lộ 1A và chuỗi cao tốc Nam Trung Bộ kết nối TP. Hồ Chí Minh",
    typicalVehicles: ["Xe tải 5 – 15 tấn đường dài", "Xe container", "Xe đông lạnh", "Xe ghép hàng liên tỉnh"],
    typicalGoods: [
      "Hàng tiêu dùng, nguyên liệu sản xuất, bao bì, cơ khí từ TP. HCM phân phối ra Đà Nẵng.",
      "Hàng dệt may, thủy sản, nội thất và hàng công nghiệp từ Đà Nẵng đi TP. HCM.",
      "Hàng chuyển kho, chuyển thiết bị sự kiện và kiện hàng ghép thương mại.",
    ],
    corridorInsights: [
      "Cung đường Đà Nẵng – TP. HCM có nhiều điểm trung chuyển dọc Duyên hải Nam Trung Bộ (Quảng Nam, Bình Định, Khánh Hòa, Đồng Nai), phù hợp ghép tuyến linh hoạt.",
      "Lưu lượng hàng xuất phát từ TP. HCM ra miền Trung thường rất cao vào cuối tuần và dịp lễ, nên chủ hàng cần chủ động đặt lịch sớm.",
    ],
    shipperTips: [
      "Kiểm tra kích thước pallet và trọng lượng từng kiện để chọn xe có chiều dài thùng phù hợp.",
      "Chuẩn bị sẵn thông tin người nhận dự phòng để tránh xe phải chờ hạ hàng tại kho TP. HCM hoặc Đà Nẵng.",
      "Chụp ảnh hàng hóa và số niêm phong (nếu có) trước lúc khởi hành.",
    ],
    driverTips: [
      "Khi trả hàng xong tại KCN Hòa Khánh, Liên Chiểu hoặc các bãi xe Q.12/Bình Tân/Thủ Đức, đăng ngay tin xe trống chiều về để giảm thời gian đậu chờ.",
      "Ghi rõ khả năng chạy thẳng kho hay giao dọc trục QL1A để lọc đúng nhu cầu phù hợp.",
    ],
    faqs: [
      {
        question: "Chủ hàng có thể tìm xe chiều về từ Đà Nẵng vào TP. HCM trên TXE PRO không?",
        answer:
          "Có. Rất nhiều xe chở hàng từ TP. HCM ra miền Trung cần tìm hàng chiều về; bạn chỉ cần đăng nhu cầu tuyến Đà Nẵng – TP. HCM để đối chiếu các tin xe trống phù hợp.",
      },
      {
        question: "Có thể tra cứu trạng thái vận đơn Đà Nẵng – TP. HCM trên website không?",
        answer:
          "Có. Nhập mã vận đơn ORD tại trang Theo dõi đơn hàng trên website txepro.vn để xem trạng thái và các mốc hành trình đã được hệ thống ghi nhận.",
      },
      {
        question: "Khi có sự cố phát sinh dọc đường dài thì xử lý thế nào?",
        answer:
          "Tài xế gửi báo cáo sự cố kèm mô tả và bằng chứng trực tiếp từ chi tiết đơn trên ứng dụng; chủ hàng nhận thông báo và có 24 giờ để phản hồi hoặc yêu cầu đối soát.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "ghep-hang-tien-chuyen", "xe-dong-lanh-container-chuyen-dung"],
    relatedRoutes: ["hue-da-nang", "hue-tp-hcm", "ha-noi-tp-hcm"],
    relatedGuides: [
      { slug: "kiem-tra-hang-khi-giao-nhan", title: "Kiểm tra hàng khi giao nhận để hạn chế sai lệch" },
      { slug: "san-sang-truoc-chuyen-di", title: "Chuẩn bị kỹ trước mỗi chuyến đường dài" },
    ],
  },
  {
    slug: "ha-noi-tp-hcm",
    region: "north-south",
    regionLabel: "Trục đường dài Bắc – Nam",
    originName: "Hà Nội",
    destinationName: "TP. Hồ Chí Minh",
    name: "Vận chuyển hàng Bắc – Nam (Hà Nội – TP. Hồ Chí Minh)",
    seoTitle: "Vận chuyển hàng Bắc Nam Hà Nội – TP. HCM | Tìm xe tải TXE PRO",
    seoDescription:
      "Kết nối tìm xe tải đường dài, xe container, xe đông lạnh và ghép hàng tuyến Bắc – Nam (Hà Nội – TP. Hồ Chí Minh) minh bạch trên TXE PRO.",
    heroSubtitle:
      "Trục vận tải xương sống Bắc – Nam nối liền hai trung tâm kinh tế lớn nhất cả nước, tối ưu cho hàng lô doanh nghiệp, container, xe lạnh và hàng ghép.",
    image: "/images/news/quan-ly-doi-xe.webp",
    imageAlt: "Vận tải đường dài Bắc Nam Hà Nội – TP. Hồ Chí Minh trên TXE PRO",
    highwayNote: "Trục xuyên Việt Quốc lộ 1A và hệ thống cao tốc Bắc – Nam phía Đông",
    typicalVehicles: ["Xe tải nặng 8 – 15 tấn", "Xe đầu kéo container", "Xe đông lạnh đường dài", "Xe tải ghép tuyến Bắc – Nam"],
    typicalGoods: [
      "Hàng công nghiệp, máy móc, linh kiện điện tử và nguyên vật liệu sản xuất liên vùng.",
      "Hàng tiêu dùng nhanh, thực phẩm đóng gói, hàng thời trang và kho vận thương mại điện tử.",
      "Đồ gia đình chuyển nhà Bắc – Nam, xe máy/thiết bị đóng kiện kỹ và hàng cần kiểm soát nhiệt độ.",
    ],
    corridorInsights: [
      "Chặng xuyên Việt Hà Nội – TP. HCM đòi hỏi kỷ luật đóng gói, chằng buộc và chứng từ hàng hóa chặt chẽ nhất trong các tuyến nội địa.",
      "Tài xế và đội xe đường dài có thể kết hợp nhận thêm hàng ghép tại các điểm nút như Thanh Hóa, Nghệ An, Huế, Đà Nẵng, Nha Trang để tăng hiệu quả khai thác xe.",
    ],
    shipperTips: [
      "Sử dụng pallet, thùng gỗ hoặc màng co dày cho máy móc, thiết bị điện tử và hàng dễ móp méo.",
      "Chuẩn bị đầy đủ hóa đơn, phiếu xuất kho kiêm vận chuyển nội bộ theo đúng quy định lưu thông.",
      "Thống nhất rõ giờ giao nhận kho hai đầu và dự phòng biên độ thời gian hợp lý cho chặng đường dài.",
    ],
    driverTips: [
      "Đăng tải lịch trình xuyên Việt sớm trước ngày xuất phát để dễ ghép đủ tải trọng từ đầu tuyến.",
      "Duy trì GPS hoạt động ổn định và cập nhật đúng các mốc đón hàng, khởi hành, giao hàng trên ứng dụng.",
    ],
    faqs: [
      {
        question: "TXE PRO phù hợp với loại hình vận chuyển nào trên tuyến Bắc – Nam?",
        answer:
          "Nền tảng kết nối trực tiếp chủ hàng với tài xế/đội xe tải nặng, xe đông lạnh, container và xe ghép tuyến, phù hợp cho cả đơn nguyên xe lẫn hàng ghép có kế hoạch trước.",
      },
      {
        question: "Làm sao đảm bảo minh bạch chi phí cho chuyến đường dài Bắc – Nam?",
        answer:
          "Chủ hàng xem trực tiếp thông tin phương tiện, tải trọng, giá đề xuất và các điều kiện áp dụng trước khi xác nhận đặt xe; mọi thông tin đơn hàng đều lưu lịch sử trên tài khoản.",
      },
      {
        question: "Tài xế chạy Bắc – Nam có thể đăng nhiều tuyến trung gian cùng lúc không?",
        answer:
          "Có. Tài xế có thể tạo nhiều tin xe trống tương ứng với các chặng dừng phù hợp và chủ động quản lý trạng thái từng tin trên hệ thống.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "xe-dong-lanh-container-chuyen-dung", "ghep-hang-tien-chuyen"],
    relatedRoutes: ["ha-noi-da-nang", "da-nang-tp-hcm", "hue-tp-hcm"],
    relatedGuides: [
      { slug: "quan-ly-lich-xe-trong", title: "Quản lý lịch xe trống cho tài xế đường dài" },
      { slug: "theo-doi-chuyen-di-va-gps", title: "Theo dõi hành trình và GPS minh bạch" },
    ],
  },
  {
    slug: "tp-hcm-binh-duong-dong-nai",
    region: "south",
    regionLabel: "TP. HCM & Khu vực phía Nam",
    originName: "TP. Hồ Chí Minh",
    destinationName: "Bình Dương – Đồng Nai",
    name: "Tìm xe chở hàng TP. HCM – Bình Dương – Đồng Nai",
    seoTitle: "Tìm xe tải chở hàng TP. HCM – Bình Dương – Đồng Nai | TXE PRO",
    seoDescription:
      "Đặt xe tải chở hàng, xe container, xe cẩu giữa TP. Hồ Chí Minh, Bình Dương và Đồng Nai. Phục vụ kho xưởng, khu công nghiệp và chuyển nhà nhanh trên TXE PRO.",
    heroSubtitle:
      "Kết nối nhanh đội xe tải, xe cẩu và container giữa TP. Hồ Chí Minh với các cụm khu công nghiệp trọng điểm tại Bình Dương và Đồng Nai.",
    image: "/images/news/chon-xe-phu-hop.webp",
    imageAlt: "Tìm xe chở hàng TP. Hồ Chí Minh – Bình Dương – Đồng Nai",
    highwayNote: "Trục Quốc lộ 13, Xa lộ Hà Nội – Quốc lộ 1A, Mỹ Phước – Tân Vạn và cao tốc TP. HCM – Long Thành – Dầu Giây",
    typicalVehicles: ["Xe tải 1 – 5 tấn ra vào kho xưởng", "Xe tải nặng 8 – 15 tấn", "Xe cẩu tự hành", "Xe container"],
    typicalGoods: [
      "Nguyên liệu, bán thành phẩm, hàng gia công luân chuyển hằng ngày giữa các KCN VSIP, Sóng Thần, Amata, Biên Hòa, Nhơn Trạch.",
      "Hàng phân phối từ kho tổng về hệ thống cửa hàng, đại lý nội thành và vùng ven.",
      "Đồ nội thất, vật liệu xây dựng và đơn chuyển nhà/văn phòng giữa TP. HCM – Bình Dương – Đồng Nai.",
    ],
    corridorInsights: [
      "Đây là tam giác công nghiệp có nhu cầu vận chuyển lặp lại hằng ngày với mật độ phương tiện rất cao, nhưng dễ ùn tắc tại các nút giao giờ cao điểm và có khung giờ cấm tải nghiêm ngặt vào nội đô TP. HCM.",
      "Việc ghim chính xác cổng KCN/nhà xưởng trên bản đồ giúp tài xế tiếp cận nhanh và tránh đi nhầm cổng không cho xe tải lớn vào.",
    ],
    shipperTips: [
      "Ghi rõ tên khu công nghiệp, số lô/đường nội bộ và khung giờ kho cho phép xe vào lấy/trả hàng.",
      "Kiểm tra khung giờ cấm xe tải của TP. HCM để đặt lịch chạy hợp lý (sáng sớm, trưa hoặc ban đêm với xe tải nặng).",
      "Nếu hàng nặng trên pallet, ghi rõ hai đầu kho có sẵn xe nâng hay cần xe cẩu hỗ trợ.",
    ],
    driverTips: [
      "Tài xế thường xuyên chạy tuyến TP. HCM – Bình Dương – Đồng Nai nên dùng lịch đăng tin tự động theo các ngày làm việc trong tuần.",
      "Cập nhật nhanh trạng thái sẵn sàng ngay khi hoàn tất giao hàng tại KCN để nhận chuyến quay đầu trong ngày.",
    ],
    faqs: [
      {
        question: "Có thể đặt xe tải đi trong ngày giữa TP. HCM, Bình Dương và Đồng Nai không?",
        answer:
          "Có. Bạn chỉ cần nhập điểm nhận – điểm trả, chọn thời gian mong muốn và nhóm xe tải phù hợp để xem các tin xe trống sẵn sàng chạy trong ngày.",
      },
      {
        question: "Kho xưởng cần đặt nhiều chuyến liên tục trong ngày có tiện không?",
        answer:
          "Có. Bạn có thể tạo và quản lý song song nhiều đơn trên cùng tài khoản chủ hàng, theo dõi trạng thái và ảnh bàn giao của từng mã đơn ORD riêng biệt.",
      },
      {
        question: "Nên chọn loại xe nào khi giao hàng vào hẻm nội thành TP. HCM?",
        answer:
          "Với điểm giao trong hẻm hoặc khung giờ ban ngày, nên ưu tiên xe tải nhỏ có tải trọng phù hợp quy định lưu thông nội đô và đo sẵn độ rộng đường vào.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "chuyen-nha-noi-that", "xe-dong-lanh-container-chuyen-dung"],
    relatedRoutes: ["tp-hcm-can-tho-mien-tay", "da-nang-tp-hcm", "ha-noi-tp-hcm"],
    relatedGuides: [
      { slug: "chon-diem-nhan-tra-tren-ban-do", title: "Chọn điểm nhận trả chính xác trên bản đồ" },
      { slug: "tim-xe-theo-ngay-gio", title: "Tìm xe theo đúng ngày giờ hoạt động của kho" },
    ],
  },
  {
    slug: "tp-hcm-can-tho-mien-tay",
    region: "south",
    regionLabel: "TP. HCM & Khu vực phía Nam",
    originName: "TP. Hồ Chí Minh",
    destinationName: "Cần Thơ & Miền Tây",
    name: "Vận chuyển hàng TP. HCM – Cần Thơ & Miền Tây",
    seoTitle: "Tìm xe chở hàng TP. HCM – Cần Thơ & Miền Tây | TXE PRO",
    seoDescription:
      "Tìm xe tải chở hàng, xe đông lạnh và ghép hàng chiều về tuyến TP. Hồ Chí Minh – Cần Thơ – các tỉnh Miền Tây trên TXE PRO.",
    heroSubtitle:
      "Kết nối vận chuyển hàng phân phối, nông sản, thủy sản và hàng tiêu dùng hai chiều giữa TP. Hồ Chí Minh với Cần Thơ và Đồng bằng sông Cửu Long.",
    image: "/images/news/dang-xe-trong.webp",
    imageAlt: "Vận chuyển hàng tuyến TP. HCM – Cần Thơ và Miền Tây trên TXE PRO",
    highwayNote: "Trục cao tốc TP. HCM – Trung Lương – Mỹ Thuận – Cần Thơ và Quốc lộ 1A",
    typicalVehicles: ["Xe tải 1.5 – 8 tấn", "Xe tải đông lạnh chở nông – thủy sản", "Xe ghép hàng tiện chuyến", "Ô tô đi tỉnh"],
    typicalGoods: [
      "Nông sản, trái cây, thủy sản đông lạnh và thực phẩm từ Cần Thơ và các tỉnh Miền Tây lên TP. HCM.",
      "Hàng tiêu dùng, vật tư nông nghiệp, thiết bị điện máy và hàng phân phối từ TP. HCM về Miền Tây.",
      "Hàng chuyển nhà, đồ gia dụng và đơn ghép giao nhận dọc trục Tiền Giang – Vĩnh Long – Cần Thơ.",
    ],
    corridorInsights: [
      "Tuyến cao tốc nối liền TP. HCM – Mỹ Thuận – Cần Thơ giúp rút ngắn đáng kể thời gian di chuyển, tăng khả năng xoay vòng chuyến trong ngày cho xe tải và xe lạnh.",
      "Nhiều điểm giao nhận tại khu vực Miền Tây có cầu nhỏ hoặc giới hạn tải trọng cầu đường nông thôn; cần kiểm tra kỹ tải trọng xe trước khi xác nhận.",
    ],
    shipperTips: [
      "Với trái cây tươi và thủy sản, chọn đúng nhóm Xe đông lạnh hoặc thùng kín thông thoáng và thống nhất giờ lấy hàng sát lúc xuất bến.",
      "Ghi rõ tải trọng cầu và độ rộng đường nếu điểm nhận hàng nằm ở khu vực chợ huyện hoặc đường liên xã.",
      "Tận dụng xe chiều về từ TP. HCM xuống Cần Thơ hoặc từ Miền Tây lên TP. HCM để tối ưu chi phí vận chuyển.",
    ],
    driverTips: [
      "Tài xế chở nông sản lên chợ đầu mối TP. HCM nên đăng ngay tin xe trống chiều về Miền Tây để nhận thêm hàng phân phối quay đầu.",
      "Khai báo rõ các điểm tỉnh thành đi qua dọc tuyến để tăng khả năng khớp đơn ghép.",
    ],
    faqs: [
      {
        question: "Có tìm được xe đông lạnh chở nông sản/thủy sản tuyến Cần Thơ – TP. HCM không?",
        answer:
          "Có. Chủ hàng chỉ cần chọn phân loại Xe đông lạnh khi đăng nhu cầu tìm xe và mô tả rõ mặt hàng, nhiệt độ bảo quản mong muốn.",
      },
      {
        question: "Có thể gửi hàng về các tỉnh dọc tuyến như Tiền Giang, Vĩnh Long trước Cần Thơ không?",
        answer:
          "Có. Hệ thống hỗ trợ ghim điểm nhận và điểm trả linh hoạt theo bản đồ toàn quốc, giúp kết nối thuận tiện với các xe chạy ngang trục TP. HCM – Cần Thơ.",
      },
      {
        question: "Tài xế Miền Tây cần chuẩn bị gì để đăng tin xe trống trên TXE PRO?",
        answer:
          "Tài xế chỉ cần hoàn tất xác minh danh tính và đăng ký phương tiện trên ứng dụng TXE PRO, sau đó có thể đăng tin xe trống ngay trên app hoặc website.",
      },
    ],
    relatedServices: ["tim-xe-cho-hang", "ghep-hang-tien-chuyen", "xe-dong-lanh-container-chuyen-dung"],
    relatedRoutes: ["tp-hcm-binh-duong-dong-nai", "da-nang-tp-hcm", "hue-tp-hcm"],
    relatedGuides: [
      { slug: "dang-xe-trong-hieu-qua", title: "Đăng tin xe trống hiệu quả cho tuyến chiều về" },
      { slug: "chon-xe-phu-hop", title: "Chọn đúng loại xe cho từng nhóm hàng hóa" },
    ],
  },
];

const ROUTE_MAP = new Map<RouteSlug, RouteCorridor>(ROUTE_CORRIDORS.map((item) => [item.slug, item]));

export function isRouteSlug(slug: string): slug is RouteSlug {
  return ROUTE_MAP.has(slug as RouteSlug);
}

export function getRouteBySlug(slug: string): RouteCorridor | null {
  return ROUTE_MAP.get(slug as RouteSlug) || null;
}
