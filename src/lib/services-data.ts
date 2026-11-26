export const SERVICE_SLUGS = [
  "tim-xe-cho-hang",
  "ghep-hang-tien-chuyen",
  "chuyen-nha-noi-that",
  "xe-dong-lanh-container-chuyen-dung",
  "di-chuyen-o-to-xe-may",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceItem {
  slug: ServiceSlug;
  badge: string;
  name: string;
  shortName: string;
  seoTitle: string;
  seoDescription: string;
  serviceType: string;
  heroSubtitle: string;
  image: string;
  imageAlt: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  vehicles: string[];
  highlights: string[];
  suitableFor: string[];
  workflow: Array<{ step: string; title: string; detail: string }>;
  checklist: string[];
  faqs: ServiceFaq[];
  relatedRoutes: string[];
  relatedGuides: Array<{ slug: string; title: string }>;
}

export const SERVICES: ServiceItem[] = [
  {
    slug: "tim-xe-cho-hang",
    badge: "Vận tải hàng hóa",
    name: "Tìm xe tải chở hàng theo chuyến",
    shortName: "Tìm xe chở hàng",
    seoTitle: "Tìm xe tải chở hàng & thuê xe theo chuyến | TXE PRO",
    seoDescription:
      "Đăng nhu cầu tìm xe tải chở hàng theo điểm nhận, điểm trả và tải trọng. So sánh tin xe trống, xác nhận chuyến minh bạch và theo dõi hành trình trên TXE PRO.",
    serviceType: "Dịch vụ kết nối tìm xe tải chở hàng theo chuyến",
    heroSubtitle:
      "Đăng tuyến đường, loại hàng và tải trọng cần chở để đối chiếu các tin xe tải sẵn lịch chạy phù hợp, theo dõi trạng thái vận đơn và nghiệm thu rõ ràng.",
    image: "/images/news/chon-xe-phu-hop.webp",
    imageAlt: "Tìm xe tải chở hàng theo chuyến trên nền tảng TXE PRO",
    ctaHref: "/chu-hang/form-tao-don",
    ctaLabel: "Đăng nhu cầu tìm xe ngay",
    secondaryCtaHref: "/tracking",
    secondaryCtaLabel: "Tra cứu đơn hàng",
    vehicles: ["Xe tải nhỏ nội thành", "Xe tải thùng kín / thùng bạt", "Xe tải trung & nặng liên tỉnh"],
    highlights: [
      "Chọn chính xác điểm nhận – điểm trả trên bản đồ, hệ thống tự tính lộ trình tham khảo.",
      "Xem trước nhóm phương tiện, lịch xe và mức giá đề xuất từ tài xế trước khi xác nhận.",
      "Cấp mã vận đơn ORD để cả người gửi lẫn người nhận theo dõi trạng thái trực tiếp.",
    ],
    suitableFor: [
      "Cửa hàng, đại lý phân phối cần chuyển lô hàng định kỳ hoặc đột xuất trong tỉnh và liên tỉnh.",
      "Xưởng sản xuất, vật tư xây dựng, nông sản cần chọn đúng tải trọng thùng xe.",
      "Khách hàng cá nhân gửi kiện hàng lớn, máy móc hoặc đồ cồng kềnh không vừa xe nhỏ.",
    ],
    workflow: [
      {
        step: "01",
        title: "Nhập điểm nhận, điểm trả và đặc điểm hàng hóa",
        detail: "Ghim địa chỉ hai đầu tuyến, chọn nhóm xe tải, nhập loại hàng, khối lượng ước tính và khung giờ cần lấy hàng.",
      },
      {
        step: "02",
        title: "So sánh tin xe trống khớp tuyến và giờ chạy",
        detail: "Xem thông tin phương tiện, khả năng chở và giá đề xuất của các tài xế đang sẵn lịch trên cùng cung đường.",
      },
      {
        step: "03",
        title: "Xác nhận đặt xe và kiểm tra điều kiện chuyến",
        detail: "Đối chiếu kỹ địa chỉ, yêu cầu bốc xếp và khoản bảo đảm hiển thị trên màn hình trước khi gửi yêu cầu đến tài xế.",
      },
      {
        step: "04",
        title: "Theo dõi vận đơn và xác nhận ảnh bàn giao",
        detail: "Quan sát các mốc hành trình qua mã ORD và kiểm tra 1–3 ảnh giao hàng tài xế tải lên khi hoàn tất.",
      },
    ],
    checklist: [
      "Đo sẵn chiều dài, rộng, cao kiện hàng lớn nhất để chọn kích thước thùng vừa vặn.",
      "Chụp ảnh hàng đã đóng gói rõ ràng giúp tài xế chuẩn bị dây ràng và phương án xếp hàng.",
      "Ghi chú giờ cấm tải, đường hẻm nhỏ hoặc quy định ra vào kho/khu công nghiệp.",
    ],
    faqs: [
      {
        question: "Cần cung cấp thông tin gì khi đăng nhu cầu tìm xe tải?",
        answer:
          "Bạn cần chọn điểm nhận, điểm trả, thời gian mong muốn, nhóm xe tải, loại hàng và khối lượng ước tính. Nên bổ sung ảnh kiện hàng và ghi chú đường vào để tài xế đánh giá chính xác trước khi nhận chuyến.",
      },
      {
        question: "Khoản ký quỹ khi đặt xe tải có phải toàn bộ tiền cước không?",
        answer:
          "Không. Ký quỹ là khoản bảo đảm giao dịch hiển thị trước bước xác nhận và được hoàn trả khi chuyến hoàn tất hợp lệ theo chính sách, không tự động chuyển thành tiền cước trả tài xế.",
      },
      {
        question: "Người nhận hàng có thể theo dõi xe tải đang đi đến đâu không?",
        answer:
          "Có. Bạn chỉ cần gửi mã đơn ORD cho người nhận để tra cứu trạng thái và lộ trình công khai tại trang Theo dõi đơn hàng trên TXE PRO mà không cần đăng nhập.",
      },
    ],
    relatedRoutes: ["hue-da-nang", "hue-ha-noi", "ha-noi-tp-hcm", "tp-hcm-binh-duong-dong-nai"],
    relatedGuides: [
      { slug: "chon-xe-phu-hop", title: "Chọn đúng xe, bắt đầu một hành trình thuận tiện" },
      { slug: "dang-nhu-cau-tim-xe", title: "Hướng dẫn đăng nhu cầu tìm xe rõ ràng, dễ khớp chuyến" },
      { slug: "kiem-tra-hang-khi-giao-nhan", title: "Kiểm tra hàng hóa khi giao nhận đúng chuẩn" },
    ],
  },
  {
    slug: "ghep-hang-tien-chuyen",
    badge: "Tối ưu chi phí tuyến",
    name: "Ghép hàng tiện chuyến & xe chiều về",
    shortName: "Ghép hàng tiện chuyến",
    seoTitle: "Ghép hàng tiện chuyến & tìm xe chiều về tiết kiệm | TXE PRO",
    seoDescription:
      "Kết nối hàng hóa với xe tải trống quay đầu, xe chạy tiện chuyến liên tỉnh trên TXE PRO. Minh bạch lịch chạy, theo dõi vận đơn rõ ràng.",
    serviceType: "Dịch vụ kết nối ghép hàng tiện chuyến và xe tải chiều về",
    heroSubtitle:
      "Tận dụng các chuyến xe trống quay đầu hoặc còn dư tải trọng cùng tuyến đường để gửi hàng liên tỉnh linh hoạt và kiểm soát tốt chi phí.",
    image: "/images/news/tim-chuyen-phu-hop.webp",
    imageAlt: "Ghép hàng tiện chuyến và tìm xe chiều về trên TXE PRO",
    ctaHref: "/chu-hang/form-tao-don",
    ctaLabel: "Tìm xe tiện chuyến ngay",
    secondaryCtaHref: "/tai-xe/dang-tin",
    secondaryCtaLabel: "Tài xế đăng xe chiều về",
    vehicles: ["Xe tải chạy chiều về liên tỉnh", "Xe thùng kín / mui bạt còn chỗ trống", "Xe tuyến Bắc – Trung – Nam"],
    highlights: [
      "Ghép trực tiếp với tin xe trống do tài xế chủ động đăng theo tuyến quay đầu.",
      "Biết trước khung giờ xuất phát và tải trọng còn trống thay vì chờ gom hàng thụ động.",
      "Theo dõi hành trình theo từng mốc thời gian và kiểm chứng bằng ảnh giao nhận.",
    ],
    suitableFor: [
      "Chủ hàng có kiện hàng vừa và nhỏ muốn gửi liên tỉnh không cần thuê nguyên xe.",
      "Shop online, đại lý gửi hàng mẫu, thiết bị, nông sản khô dọc trục Quốc lộ 1A và các tỉnh lân cận.",
      "Tài xế vừa trả hàng xong muốn đăng xe trống tìm hàng chiều về giảm chi phí dầu đường.",
    ],
    workflow: [
      {
        step: "01",
        title: "Xác định tuyến đường và khung thời gian linh hoạt",
        detail: "Đăng nhu cầu tìm xe sớm trước giờ dự kiến gửi hàng để có nhiều lựa chọn xe quay đầu chạy qua khu vực của bạn.",
      },
      {
        step: "02",
        title: "Đối chiếu tải trọng còn dư và giá đề xuất",
        detail: "Xem các tin xe trống phù hợp tải trọng, kiểm tra khu vực nhận – trả dọc tuyến và giá đề xuất của tài xế.",
      },
      {
        step: "03",
        title: "Đóng gói chắc chắn và ghi nhãn người nhận rõ ràng",
        detail: "Hàng ghép nên đóng thùng kín, chèn xốp góc cạnh và ghi rõ tên, số điện thoại người nhận trên từng kiện.",
      },
      {
        step: "04",
        title: "Bàn giao và theo dõi hành trình bằng mã ORD",
        detail: "Chụp ảnh hiện trạng kiện hàng lúc giao, theo dõi trạng thái qua TXE PRO và xác nhận khi hàng đến nơi.",
      },
    ],
    checklist: [
      "Đóng kiện gọn, chịu xếp chồng tốt và phân biệt rõ hàng dễ vỡ bằng tem cảnh báo.",
      "Thống nhất rõ điểm hẹn giao nhận (tận kho hay dọc trục quốc lộ/bến trung chuyển).",
      "Xác nhận trước khung giờ có người trực nhận hàng ở đầu đến.",
    ],
    faqs: [
      {
        question: "Khi nào nên chọn ghép hàng tiện chuyến thay vì thuê nguyên xe?",
        answer:
          "Ghép hàng tiện chuyến phù hợp khi lượng hàng chỉ chiếm một phần thùng xe và lịch giao có thể linh hoạt theo khung giờ chạy của xe chiều về. Nếu hàng cần giao gấp theo giờ cố định hoặc chiếm gần kín thùng, nên đặt nguyên chuyến.",
      },
      {
        question: "Làm sao hạn chế thất lạc hoặc hư hại khi gửi hàng ghép?",
        answer:
          "Hãy đóng gói riêng từng kiện bằng thùng cứng hoặc bọc màng co, ghi rõ thông tin người nhận lên mặt thùng, chụp ảnh hiện trạng trước khi lên xe và đối chiếu lại số kiện khi nhận hàng.",
      },
      {
        question: "Tài xế chạy chiều về đăng tìm hàng ghép ở đâu?",
        answer:
          "Tài xế đã xác minh hồ sơ và phương tiện có thể vào mục Đăng xe trống trên website hoặc ứng dụng TXE PRO, chọn tuyến chiều về, khung giờ khởi hành và tải trọng khả dụng.",
      },
    ],
    relatedRoutes: ["hue-da-nang", "da-nang-tp-hcm", "ha-noi-da-nang", "tp-hcm-can-tho-mien-tay"],
    relatedGuides: [
      { slug: "tim-chuyen-phu-hop-gia-de-xuat", title: "Cách chọn chuyến phù hợp và đối chiếu giá đề xuất" },
      { slug: "chup-anh-hang-hoa-ro-rang", title: "Chụp ảnh hàng hóa rõ ràng trước khi đặt xe" },
      { slug: "chuan-bi-hang-de-vo", title: "Chuẩn bị và đóng gói hàng dễ vỡ an toàn" },
    ],
  },
  {
    slug: "chuyen-nha-noi-that",
    badge: "Chuyển nhà & nội thất",
    name: "Chuyển nhà, chuyển phòng & chở đồ nội thất",
    shortName: "Chuyển nhà & nội thất",
    seoTitle: "Tìm xe chuyển nhà, chuyển phòng & chở đồ nội thất | TXE PRO",
    seoDescription:
      "Đặt xe tải chuyển nhà, chuyển phòng trọ, văn phòng và vận chuyển đồ nội thất kích thước lớn. Chọn đúng kích thước thùng xe và kiểm kê bàn giao rõ ràng trên TXE PRO.",
    serviceType: "Dịch vụ kết nối xe tải chuyển nhà và vận chuyển nội thất",
    heroSubtitle:
      "Chọn xe tải có kích thước thùng phù hợp cho giường, tủ, bàn ghế, thiết bị gia dụng và theo dõi lịch đón trả minh bạch ngay trong ngày chuyển.",
    image: "/images/news/chuyen-do-noi-that.webp",
    imageAlt: "Vận chuyển đồ nội thất và chuyển nhà bằng xe tải trên TXE PRO",
    ctaHref: "/chu-hang/form-tao-don",
    ctaLabel: "Tìm xe chuyển nhà ngay",
    secondaryCtaHref: "/tin-tuc/chuan-bi-do-noi-that",
    secondaryCtaLabel: "Xem checklist đóng gói",
    vehicles: ["Xe tải nhỏ 500kg – 1.5 tấn vào hẻm", "Xe tải thùng kín 2 – 3.5 tấn chống mưa", "Xe tải thùng dài chở nội thất cỡ lớn"],
    highlights: [
      "Chủ động chọn thùng kín bảo vệ nệm, sofa, đồ gỗ và thiết bị điện tử khỏi nắng mưa.",
      "Trao đổi trực tiếp với tài xế về thang máy, cầu thang bộ, bãi đậu xe và bốc xếp trước khi xác nhận.",
      "Có ảnh bàn giao và lịch sử đơn hàng giúp kiểm kê đầy đủ từng kiện đồ.",
    ],
    suitableFor: [
      "Gia đình, sinh viên, người đi làm chuyển nhà hoặc chuyển phòng trọ trong nội thành và liên tỉnh.",
      "Văn phòng di dời bàn ghế, máy tính, tủ hồ sơ theo khung giờ ngoài giờ hành chính.",
      "Cửa hàng nội thất, điện máy giao hàng cồng kềnh đến tận nhà khách.",
    ],
    workflow: [
      {
        step: "01",
        title: "Kiểm kê danh sách đồ lớn và đo kích thước lối đi",
        detail: "Liệt kê các món chiếm diện tích (tủ lạnh, máy giặt, giường, bàn ăn) và kiểm tra chiều rộng cửa, thang máy ở cả hai địa chỉ.",
      },
      {
        step: "02",
        title: "Đóng gói phân loại và chụp hiện trạng đồ dễ trầy",
        detail: "Bọc góc cạnh nội thất, gom ốc vít vào túi dán nhãn theo từng món và chụp ảnh trước lúc bốc lên xe.",
      },
      {
        step: "03",
        title: "Chọn xe thùng phù hợp và thống nhất thời gian bốc đồ",
        detail: "Đăng điểm đi – điểm đến trên TXE PRO, chọn khung giờ phù hợp quy định ban quản lý tòa nhà và giờ cấm tải.",
      },
      {
        step: "04",
        title: "Đối chiếu số kiện khi nhận đồ và hoàn tất đơn",
        detail: "Kiểm tra lại toàn bộ danh sách đồ đạc cùng ảnh bàn giao trước khi bấm xác nhận hoàn thành.",
      },
    ],
    checklist: [
      "Xả nước máy giặt, rã đông tủ lạnh trước giờ chuyển ít nhất vài giờ để tránh rò rỉ nước.",
      "Đánh dấu rõ thùng chứa đồ thủy tinh, gốm sứ, màn hình tivi và thiết bị điện tử.",
      "Đăng ký trước thang máy chở hàng với ban quản lý chung cư hoặc tòa nhà văn phòng.",
    ],
    faqs: [
      {
        question: "Chuyển phòng trọ hoặc căn hộ nhỏ nên chọn nhóm xe nào?",
        answer:
          "Bạn nên ước lượng tổng số thùng carton cộng kích thước món đồ dài nhất (như nệm, tủ, bàn). Chụp ảnh tập trung số đồ cần chuyển và ghi chú rõ trên đơn tìm xe để chọn đúng cỡ xe tải, tránh đặt xe quá nhỏ phải chạy nhiều chuyến.",
      },
      {
        question: "Cần thỏa thuận trước việc bốc xếp khi đặt xe chuyển nhà không?",
        answer:
          "Có. Hãy trao đổi rõ với tài xế ngay trước khi xác nhận về việc ai phụ trách bốc xếp, quãng đường đẩy xe từ cửa nhà ra vị trí đậu xe tải và điều kiện thang bộ/thang máy.",
      },
      {
        question: "Nếu muốn thay đổi địa chỉ giao đồ đột xuất thì xử lý thế nào?",
        answer:
          "Bạn có thể gửi yêu cầu đổi vị trí ngay trong chi tiết đơn trên ứng dụng khi trạng thái đơn cho phép. Lộ trình mới chỉ có hiệu lực sau khi tài xế xem xét và đồng ý.",
      },
    ],
    relatedRoutes: ["hue-da-nang", "tp-hcm-binh-duong-dong-nai", "ha-noi-da-nang", "hue-tp-hcm"],
    relatedGuides: [
      { slug: "chuan-bi-do-noi-that", title: "Chuẩn bị đồ nội thất trước ngày vận chuyển" },
      { slug: "trao-doi-truoc-khi-dat-xe", title: "Những thông tin cần trao đổi trước khi đặt xe" },
      { slug: "chon-diem-nhan-tra-tren-ban-do", title: "Cách chọn điểm nhận và điểm trả chính xác trên bản đồ" },
    ],
  },
  {
    slug: "xe-dong-lanh-container-chuyen-dung",
    badge: "Vận tải chuyên biệt",
    name: "Xe đông lạnh, container & xe chuyên dụng",
    shortName: "Xe lạnh, container & cẩu",
    seoTitle: "Tìm xe đông lạnh, xe container & xe cẩu chuyên dụng | TXE PRO",
    seoDescription:
      "Kết nối chủ hàng doanh nghiệp với đội xe đông lạnh, xe đầu kéo container và xe cẩu chuyên dụng trên TXE PRO. Quản lý nhiều chuyến và theo dõi GPS tập trung.",
    serviceType: "Dịch vụ kết nối xe đông lạnh, container và xe chuyên dụng",
    heroSubtitle:
      "Đáp ứng các đơn hàng yêu cầu kiểm soát nhiệt độ, tải trọng lớn, hàng công trình hoặc thiết bị nặng cần cẩu hạ chuyên biệt trên các trục đường dài.",
    image: "/images/news/quan-ly-doi-xe.webp",
    imageAlt: "Đội xe đông lạnh, container và xe chuyên dụng trên TXE PRO",
    ctaHref: "/chu-hang/form-tao-don",
    ctaLabel: "Tìm xe chuyên dụng ngay",
    secondaryCtaHref: "/thong-tin/lien-he",
    secondaryCtaLabel: "Liên hệ tư vấn doanh nghiệp",
    vehicles: ["Xe tải đông lạnh bảo ôn", "Xe container 20ft / 40ft", "Xe tải gắn cẩu & xe chuyên dụng"],
    highlights: [
      "Phân tách rõ danh mục xe đông lạnh, container và xe chuyên dụng ngay từ bước đăng nhu cầu.",
      "Hỗ trợ quản lý đồng thời nhiều đơn hàng đang chạy và lịch sử trạng thái tập trung.",
      "Theo dõi lộ trình, mốc thời gian đến điểm nhận/trả và lưu chứng từ ảnh bàn giao.",
    ],
    suitableFor: [
      "Doanh nghiệp thực phẩm, thủy hải sản, nông sản tươi cần xe đông lạnh giữ nhiệt độ ổn định.",
      "Nhà máy, kho ngoại quan, đơn vị xuất nhập khẩu cần vận chuyển hàng container giữa cảng và khu công nghiệp.",
      "Nhà thầu cơ khí, xây dựng cần xe cẩu tự hành chở máy móc, sắt thép, kết cấu nặng.",
    ],
    workflow: [
      {
        step: "01",
        title: "Khai báo yêu cầu kỹ thuật của hàng hóa",
        detail: "Nêu rõ mức nhiệt độ bảo quản (với hàng lạnh), kích thước/trọng lượng kiện nâng (với xe cẩu) hoặc loại container và chứng từ ra vào cảng/kho.",
      },
      {
        step: "02",
        title: "Chọn đúng phân nhóm phương tiện chuyên biệt",
        detail: "Lọc các tin xe đông lạnh, container hoặc xe chuyên dụng có tải trọng và lịch trình khớp khung giờ bốc hàng.",
      },
      {
        step: "03",
        title: "Xác nhận điều kiện điểm hạ hàng và quy định kho bãi",
        detail: "Thống nhất trước giờ mở cửa kho, tải trọng cầu đường, mặt bằng hạ chân chống cẩu hoặc thủ tục cân xe.",
      },
      {
        step: "04",
        title: "Giám sát lộ trình và nghiệm thu chứng từ bàn giao",
        detail: "Theo dõi cập nhật GPS trên ứng dụng và đối chiếu ảnh hiện trạng hàng hóa, niêm phong khi giao nhận.",
      },
    ],
    checklist: [
      "Kiểm tra trước dải nhiệt độ thùng đông lạnh và thời gian làm mát thùng trước khi chất hàng.",
      "Chuẩn bị đầy đủ phiếu xuất kho, hóa đơn/chứng từ vận chuyển đi đường theo quy định pháp luật.",
      "Xác nhận tải trọng cầu, chiều cao dây điện và khoảng quay đầu cho xe container/xe cẩu.",
    ],
    faqs: [
      {
        question: "TXE PRO có hỗ trợ tìm xe đông lạnh và xe cẩu không?",
        answer:
          "Có. Hệ thống hỗ trợ phân loại riêng cho Xe đông lạnh, Container và Xe chuyên dụng để chủ hàng kết nối đúng tài xế có phương tiện đã đăng ký và xác minh.",
      },
      {
        question: "Doanh nghiệp có thể đặt nhiều chuyến xe liên tục trên một tài khoản không?",
        answer:
          "Có. Tài khoản chủ hàng trên TXE PRO có thể tạo và theo dõi nhiều vận đơn song song trong mục Đơn của bạn, kèm mã tra cứu ORD riêng cho từng chuyến.",
      },
      {
        question: "Cần lưu ý gì khi đăng yêu cầu tìm xe cẩu hoặc container?",
        answer:
          "Hãy ghi rõ khối lượng và kích thước kiện nặng nhất, tầm với cần cẩu dự kiến, điều kiện mặt bằng đậu xe và khung giờ cho phép xe tải nặng lưu thông tại điểm nhận – trả.",
      },
    ],
    relatedRoutes: ["ha-noi-tp-hcm", "tp-hcm-binh-duong-dong-nai", "da-nang-tp-hcm", "hue-ha-noi"],
    relatedGuides: [
      { slug: "quan-ly-lich-xe-trong", title: "Quản lý lịch xe trống và phân bổ đội xe hiệu quả" },
      { slug: "theo-doi-chuyen-di-va-gps", title: "Theo dõi chuyến đi và hiểu đúng thông tin GPS" },
      { slug: "san-sang-truoc-chuyen-di", title: "Dành ít phút chuẩn bị trước mỗi chuyến đi" },
    ],
  },
  {
    slug: "di-chuyen-o-to-xe-may",
    badge: "Di chuyển theo tuyến",
    name: "Tìm ô tô & xe máy di chuyển theo lịch trình",
    shortName: "Di chuyển ô tô & xe máy",
    seoTitle: "Tìm ô tô, xe ghép tuyến & xe máy di chuyển trên TXE PRO",
    seoDescription:
      "Tìm ô tô và xe máy phù hợp lịch trình di chuyển trong tỉnh hoặc liên tỉnh trên TXE PRO. Xem trước thông tin xe, giá đề xuất và theo dõi lộ trình trực tiếp.",
    serviceType: "Dịch vụ kết nối ô tô và xe máy chở khách theo tuyến",
    heroSubtitle:
      "Kết nối hành khách cần di chuyển nội thành hoặc liên tỉnh với tài xế ô tô, xe máy có lịch chạy rõ ràng, minh bạch thông tin trước khi khởi hành.",
    image: "/images/news/chuan-bi-hanh-trinh.webp",
    imageAlt: "Kết nối ô tô và xe máy di chuyển theo tuyến trên TXE PRO",
    ctaHref: "/chu-hang/form-tao-don",
    ctaLabel: "Tìm xe di chuyển ngay",
    secondaryCtaHref: "/tai-xe",
    secondaryCtaLabel: "Tài xế đăng ký nhận chuyến",
    vehicles: ["Ô tô 4 – 7 chỗ đi tỉnh / sân bay", "Xe du lịch / xe hợp đồng theo tuyến", "Xe máy di chuyển linh hoạt"],
    highlights: [
      "Chọn rõ số lượng hành khách, điểm đón, điểm đến và giờ khởi hành mong muốn.",
      "Xem trước thông tin xe, số chỗ và mức giá đề xuất trước khi xác nhận đặt chuyến.",
      "Quy trình hoàn thành nhanh gọn cho nhóm xe chở người, không cần bước tải ảnh giao hàng.",
    ],
    suitableFor: [
      "Cá nhân, gia đình đi sân bay, về quê, công tác hoặc du lịch giữa các tỉnh thành.",
      "Hành khách muốn đặt trước xe theo khung giờ cụ thể thay vì chờ gọi xe sát giờ.",
      "Tài xế xe máy chở khách (áp dụng chính sách miễn phí tài xế theo quy định hệ thống) và tài xế ô tô chạy tuyến cố định.",
    ],
    workflow: [
      {
        step: "01",
        title: "Chọn điểm đón, điểm đến và thời gian xuất phát",
        detail: "Ghim chính xác vị trí đón – trả trên bản đồ, ghi chú thêm hành lý cồng kềnh nếu có và chọn nhóm Ô tô hoặc Xe máy.",
      },
      {
        step: "02",
        title: "So sánh phương tiện và giá đề xuất",
        detail: "Kiểm tra loại xe, số chỗ và lịch trình của các tài xế phù hợp đang mở trên hệ thống.",
      },
      {
        step: "03",
        title: "Xác nhận chuyến và trao đổi điểm hẹn đón",
        detail: "Gửi yêu cầu đặt xe, nhận thông báo xác nhận từ tài xế và dùng kênh liên hệ trong ứng dụng để chốt cổng đón thuận tiện.",
      },
      {
        step: "04",
        title: "Theo dõi hành trình đến khi hoàn tất",
        detail: "Theo dõi lộ trình di chuyển trên bản đồ; khi đến đúng điểm trả, tài xế xác nhận kết thúc hợp lệ để hoàn tất chuyến đi.",
      },
    ],
    checklist: [
      "Ghi rõ số người đi cùng và số lượng vali/hành lý lớn để tài xế chuẩn bị cốp xe phù hợp.",
      "Kiểm tra lại cả ngày lẫn giờ nếu đặt lịch cho chuyến đi sân bay hoặc sáng sớm.",
      "Chia sẻ mã theo dõi chuyến cho người thân nếu muốn người nhà nắm được tiến độ hành trình.",
    ],
    faqs: [
      {
        question: "Nhóm xe máy trên TXE PRO phục vụ nhu cầu nào?",
        answer:
          "Theo quy định vận hành hiện tại của TXE PRO, Xe máy thuộc nhóm phương tiện chở người và áp dụng chính sách miễn phí tài xế (không yêu cầu ký quỹ hoặc voucher với tài xế xe máy).",
      },
      {
        question: "Đặt ô tô chở người có cần xác nhận ảnh khi kết thúc chuyến không?",
        answer:
          "Không. Với nhóm ô tô chở người và xe máy, khi tài xế xác nhận kết thúc hợp lệ tại điểm trả trong phạm vi GPS quy định thì chuyến đi hoàn thành trực tiếp.",
      },
      {
        question: "Tôi có thể đặt trước chuyến đi cho ngày hôm sau không?",
        answer:
          "Có. Bạn chỉ cần chọn đúng ngày và khung giờ khởi hành dự kiến trong biểu mẫu tìm xe và kiểm tra kỹ lại lịch trước khi xác nhận.",
      },
    ],
    relatedRoutes: ["hue-da-nang", "tp-hcm-binh-duong-dong-nai", "tp-hcm-can-tho-mien-tay", "hue-ha-noi"],
    relatedGuides: [
      { slug: "tim-xe-theo-ngay-gio", title: "Tìm xe đúng ngày giờ để hành trình đúng kế hoạch" },
      { slug: "san-sang-truoc-chuyen-di", title: "Dành ít phút chuẩn bị trước mỗi chuyến đi" },
      { slug: "theo-doi-don-theo-ma", title: "Theo dõi đơn theo mã vận đơn không cần đăng nhập" },
    ],
  },
];

const SERVICE_MAP = new Map<ServiceSlug, ServiceItem>(SERVICES.map((item) => [item.slug, item]));

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return SERVICE_MAP.has(slug as ServiceSlug);
}

export function getServiceBySlug(slug: string): ServiceItem | null {
  return SERVICE_MAP.get(slug as ServiceSlug) || null;
}
