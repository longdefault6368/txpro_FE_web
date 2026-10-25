type Localized = { vi: string; en: string; zh: string };
const t = (vi: string, en: string, zh: string): Localized => ({ vi, en, zh });
type Media = { source: string; alt: Localized; caption: Localized };
type Addition = { paragraph: Localized; image?: Media; checklist?: Localized[]; example?: Localized; note?: Localized };
type Details = { intro: Localized; takeaways: Localized[]; additions: Addition[]; conclusion: Localized };

// Editorial expansion only. No database mutations, financial promises or invented case studies.
const details: Record<string, Details> = {
  "chon-xe-phu-hop": {
    intro: t("Một chuyến vận chuyển thuận tiện không bắt đầu từ việc chọn chiếc xe rẻ nhất, mà từ việc mô tả đúng nhu cầu. Khi loại hàng, địa chỉ và thời gian đã rõ, bạn sẽ có cơ sở tốt hơn để trao đổi với tài xế. Bài viết này đi qua ba bước chuẩn bị, kèm những thông tin nên kiểm tra trước khi đặt xe.",
      "A useful search starts with an accurate description of the journey, not simply the lowest price. Clear cargo details, addresses and timing give you a better basis for discussing the trip with a driver. This guide walks through three preparation steps and the details worth checking before booking.",
      "一次顺畅的运输，不应只从最低报价开始，而应先把需求描述清楚。货物、地址和时间越明确，与司机沟通就越有依据。本文从三个准备步骤出发，整理预订前值得核对的信息。"),
    takeaways: [
      t("Phân biệt nhu cầu chở người với chở hàng; mô tả cả khối lượng lẫn độ cồng kềnh.", "Distinguish passenger trips from freight; describe both weight and bulk.", "区分载客与货运，同时说明重量与体积。"),
      t("Kiểm tra điểm ghim trên bản đồ và điều kiện tiếp cận ở cả hai đầu.", "Check map pins and access arrangements at both ends.", "核对两端地图标记与车辆通行条件。"),
      t("Đọc thông tin xe, giá đề xuất và điều kiện hiển thị trước khi xác nhận.", "Review vehicle details, proposed price and displayed conditions before confirming.", "确认前查看车辆资料、报价和页面显示的条件。"),
    ],
    additions: [
      {
        paragraph: t("Hãy mô tả món lớn nhất trước, rồi đến tổng số kiện. Tủ lạnh, máy giặt hoặc tủ quần áo thường cần trao đổi thêm về tư thế vận chuyển, cách bảo vệ và người phụ trách bốc xếp. Đừng xem tên nhóm xe là lời bảo đảm rằng mọi món đồ đều vừa: cần đối chiếu với thông tin phương tiện và trao đổi cụ thể với tài xế.",
          "Describe the largest item first, then the package count. Appliances and wardrobes may need discussion about handling, protection and who will load them. A vehicle category alone does not guarantee that every item will fit. Compare the actual vehicle details and clarify requirements with the driver.",
          "先说明最大的一件物品，再补充总件数。冰箱、洗衣机或衣柜，往往还需要沟通搬运方式、保护措施和装卸负责人。车型名称本身并不保证所有物品都能装下，仍需对照实际车辆资料与司机确认。"),
        image: { source: "/images/news/electronics.png",
          alt: t("Tủ lạnh, máy giặt và tivi có kích thước khác nhau", "A refrigerator, washing machine and television", "冰箱、洗衣机与电视的图"),
          caption: t("Cùng là đồ gia dụng nhưng mỗi món có kích thước và yêu cầu bảo vệ khác nhau.", "Household items differ in dimensions and handling requirements.", "家用物品的尺寸与保护要求各不相同，运输前应逐件核实。") },
        checklist: [
          t("Loại hàng, số kiện và khối lượng dự kiến đã được ghi rõ.", "Record the goods, package count and estimated weight.", "写明货物种类、件数与预计重量。"),
          t("Món lớn nhất có kích thước hoặc ảnh để tài xế dễ đối chiếu.", "Provide dimensions or photos of the largest item.", "提供最大物品的尺寸或照片，方便核对。"),
          t("Yêu cầu bốc xếp, tháo lắp hoặc bảo vệ đặc biệt đã được trao đổi riêng.", "Discuss loading, dismantling or special protection separately.", "单独沟通装卸、拆装或特殊保护要求。"),
        ],
      },
      {
        paragraph: t("Tên đường hoặc tên tòa nhà chưa đủ để nhận diện nơi giao nhận. Hãy xem điểm ghim có nằm ở đúng cổng, đúng phía đường hay trong khu vực xe có thể tiếp cận không. Nếu xe không thể vào tận nơi, hai bên cần thống nhất điểm gặp và cách chuyển hàng trước chuyến; không nên chờ tài xế tới mới làm rõ.",
          "A street or building name may not identify the handover point precisely. Check the entrance, side of the road and whether the vehicle can approach the pin. If it cannot reach the door, agree on a meeting point and how goods will be moved before the trip rather than waiting until the driver arrives.",
          "只有道路或大楼名称，未必能准确指向交接点。请查看标记是否在正确入口、道路一侧，以及车辆能否接近。若车辆无法到门口，应在出发前约定会合点及货物转运方式，而不是等司机到达后再确认。"),
        image: { source: "/images/news/furniture.png",
          alt: t("Ghế sofa, bàn và đèn cần kiểm tra kích thước trước khi chuyển", "Furniture requiring size and access checks", "搬运前需要核对尺寸的沙发、茶几和灯具"),
          caption: t("Với đồ cồng kềnh, lối đi và điểm dừng xe cũng quan trọng như khoảng trống trên xe.", "Access and stopping arrangements matter as much as vehicle space for bulky items.", "运输大件时，通道和停车点与车内空间同样重要。") },
        example: t("Ví dụ chuẩn bị thông tin: “Một ghế sofa, bốn thùng đồ; nhận tại cổng B, có thang máy. Cần trao đổi thêm người bốc xếp.” Đây là mẫu mô tả, không phải một đơn hàng hay báo giá thực tế.",
          "Example description: “One sofa and four boxes; pickup at entrance B, lift available. Loading help needs discussion.” This is a writing example, not a real booking or quote.",
          "描述示例：“一张沙发、四箱物品；B 门交接，有电梯，装卸人员需另行商议。”这只是填写示例，并非真实订单或报价。"),
      },
      {
        paragraph: t("Khi đã chọn được xe, hãy đọc lại toàn bộ thông tin một lượt thay vì chỉ nhìn vào giá. Xác nhận xem lịch nhận hàng có trùng với thời gian đã chọn không và các yêu cầu quan trọng đã được bên còn lại hiểu rõ chưa. Trên website và ứng dụng có thể có phạm vi thao tác khác nhau; nếu một bước được hướng dẫn thực hiện trong ứng dụng, hãy mở đúng đơn để tiếp tục.",
          "Once you have a suitable option, review the whole request rather than the price alone. Check that the pickup window matches the agreed timing and that key requirements are understood. Website and app capabilities can differ; if a step directs you to the app, open the correct order before continuing.",
          "找到合适车辆后，应再次核对完整需求，而不只是价格。确认接货时间是否一致，重要要求是否已被对方理解。网站与应用可执行的操作可能不同；若某一步提示在应用中完成，请打开正确订单继续处理。"),
        note: t("Giá, voucher, ký quỹ và điều kiện áp dụng phải theo thông tin hiển thị cho chính lần đặt xe đó. Bài hướng dẫn này không thay thế điều khoản hoặc thỏa thuận cụ thể của chuyến.",
          "Prices, vouchers, deposits and applicable conditions follow the information shown for that booking. This guide does not replace the terms or the trip's specific arrangements.",
          "价格、优惠券、保证金和适用条件，应以本次预订显示的信息为准。本文不能代替平台条款或具体行程约定。"),
      },
    ],
    conclusion: t("Trước khi đặt xe, hãy tự kiểm tra lại ba việc: đã mô tả đúng nhu cầu, đã chọn đúng hai điểm và đã hiểu các thông tin trước khi xác nhận. Một lần chuẩn bị kỹ giúp cuộc trao đổi với tài xế rõ ràng hơn, dù bạn đặt xe cho chuyến đi cá nhân hay một đợt chuyển hàng.",
      "Before booking, check three things: an accurate description, the right two locations and a clear understanding of the details shown before confirmation. Careful preparation makes the conversation clearer for both passenger journeys and freight.",
      "预订前再检查三件事：需求是否准确、两端位置是否正确、确认前的信息是否理解清楚。无论是个人出行还是货物运输，认真准备都有助于双方沟通。"),
  },
  "dang-xe-trong-hieu-qua": {
    intro: t("Một tin xe trống không chỉ cho biết bạn có xe. Tin đó còn giúp chủ hàng hiểu xe có phù hợp với hàng hoặc hành khách, có sẵn vào đúng giờ và có thể phục vụ tuyến họ cần hay không. Thay vì viết thật dài, hãy tập trung vào thông tin có thể kiểm chứng và những yêu cầu cần trao đổi trước chuyến.",
      "An availability listing does more than say that you have a vehicle. It helps a shipper assess suitability, timing and route coverage. Rather than writing a long advertisement, focus on details that can be checked and requirements that need agreement before the journey.",
      "空车信息不仅是在说“我有车”，还应让货主判断车辆是否合适、时间是否可用、路线能否满足需求。与其写很长的宣传文字，不如把可核实的信息和出发前需要沟通的要求写清楚。"),
    takeaways: [
      t("Tin đăng phải gắn với đúng phương tiện và khả năng phục vụ thực tế.", "Match the listing to the correct vehicle and realistic availability.", "信息应对应正确车辆及实际服务能力。"),
      t("Khoảng thời gian cần đủ cho việc chuẩn bị và các lịch đã nhận.", "Allow time for preparation and existing commitments.", "时间安排应考虑准备工作与已接受的行程。"),
      t("Nhận được yêu cầu không có nghĩa là mọi chi tiết đã được thống nhất.", "A request does not mean that every trip detail has already been agreed.", "收到请求，不代表所有行程细节都已达成一致。"),
    ],
    additions: [
      {
        paragraph: t("Nếu tài khoản quản lý nhiều xe, kiểm tra lại biển số và loại phương tiện trước mỗi lần đăng. Thông tin tải trọng hoặc số chỗ không nên lấy theo một xe khác đang có trong tài khoản. Với khoảng nhận và trả, cân nhắc quãng đường có thể di chuyển tới điểm hẹn, điều kiện đường đi và lịch chạy sau đó; một phạm vi rộng hơn không phải lúc nào cũng phù hợp hơn.",
          "If you manage several vehicles, check the plate and vehicle type each time you post. Do not use another vehicle's capacity or seats. When setting pickup and destination areas, consider the approach to the meeting point, access and your following commitments. A larger operating area is not always more suitable.",
          "管理多辆车时，每次发布前都应核对车牌和车型，不能把另一辆车的载重或座位数填进当前信息。设置两端服务范围时，要考虑前往会合点的路程、通行条件和后续安排；范围更大不一定更合适。"),
        image: { source: "/images/vehicles/truck.png",
          alt: t("Xe tải để đối chiếu loại phương tiện đăng tin", "Truck for checking the listing's vehicle type", "用于核对发布车型的货车图"),
          caption: t("Thông tin loại xe; khả năng phục vụ phải đối chiếu với phương tiện thực tế đã chọn.", "Vehicle types; check capacity against the actual selected vehicle.", "车辆类型与服务能力应在预订前对照实际所选车辆进行核实。") },
        checklist: [
          t("Đúng phương tiện, đúng biển số và đúng loại xe.", "Correct vehicle, plate and category.", "车辆、车牌与车型一致。"),
          t("Khoảng tải trọng hoặc số chỗ phù hợp với hồ sơ phương tiện.", "Capacity or seats match the vehicle's recorded details.", "载重范围或座位数符合车辆资料。"),
          t("Khu vực nhận, trả nằm trong khả năng phục vụ của lịch xe.", "Pickup and destination areas fit the available schedule.", "接送范围符合可用时间与实际能力。"),
        ],
      },
      {
        paragraph: t("Tách bạch giờ mở tin với thời gian bạn có thể nhận chuyến. Khi dùng lịch tự động, xem lại ngày đã chọn, giờ bắt đầu, giờ kết thúc và trạng thái lưu trước khi rời màn hình. Sau khi lưu, nên mở lại để đối chiếu một lần. Nếu lịch di chuyển hoặc bảo dưỡng thay đổi, điều chỉnh các tin liên quan thay vì để chủ hàng dựa trên lịch không còn đúng.",
          "Distinguish the listing schedule from when you can actually take a trip. For automatic schedules, review dates, start and end times and the saved state before leaving. Reopen the schedule once to check it. Update related listings when travel or maintenance plans change so shippers are not relying on outdated availability.",
          "请区分信息开放时间与真正能够接单的时间。使用自动发布时，离开页面前要检查日期、起止时间及保存状态，保存后再打开核对一次。若出行或保养计划变化，应及时调整相关信息，避免货主依据过期时间安排。"),
        image: { source: "/images/news/vehicle-check.png",
          alt: t("Nhân viên kiểm tra bánh xe trước khi phương tiện sẵn sàng", "A vehicle check before availability", "车辆可用前检查轮胎的图"),
          caption: t("Thời gian xe sẵn sàng cần tính cả việc chuẩn bị và kiểm tra phương tiện.", "Availability should allow for preparation and vehicle checks.", "车辆可用时间应包含出发前准备和检查车辆所需的时间。") },
        example: t("Ví dụ cách rà lịch: nếu xe có việc vào buổi sáng, chỉ đăng khung thời gian buổi chiều mà bạn thực sự đáp ứng được. Đây là ví dụ lập kế hoạch, không phải quy tắc khớp đơn hoặc cam kết sẽ có khách.",
          "Planning example: if the vehicle is committed in the morning, post only an afternoon window you can genuinely serve. This is a planning example, not a matching rule or a promise of bookings.",
          "排期示例：车辆上午已有安排，就只发布确实能够履行的下午时间段。这只是排期示例，并非订单匹配规则或接单承诺。"),
      },
      {
        paragraph: t("Khi xe được chọn, xem lại điểm nhận, điểm trả và yêu cầu hàng hóa trước khi phản hồi. Nếu đang có nhiều tin hoặc nhiều chuyến, kiểm tra khả năng thực hiện đồng thời thay vì mặc định chúng không ảnh hưởng nhau. Một thay đổi về thời gian hoặc địa chỉ có thể tác động tới cả lịch sau đó; cần trao đổi rõ rồi mới tiếp tục theo trạng thái của đơn.",
          "When your vehicle is selected, review the locations and cargo requirements before responding. If you have several listings or trips, check whether you can fulfil the commitments together rather than assuming they do not conflict. A change in time or address can affect later plans and should be clarified before continuing.",
          "车辆被选中时，回应前要重新查看两端位置和货物要求。若同时有多条信息或多个行程，应检查是否能够兼顾，而不是默认互不影响。时间或地址变化可能影响后续安排，需先沟通清楚，再按订单状态继续。"),
        note: t("Nội dung tin nên cụ thể, không hứa thời gian đến, điều kiện hoàn phí hoặc quyền lợi mà hệ thống chưa xác nhận. Các điều kiện tài chính luôn phải đọc ở bước thao tác tương ứng.",
          "Keep the listing specific. Do not promise arrival times, refunds or benefits that have not been confirmed. Read financial conditions at the relevant action step.",
          "信息应具体，不要承诺尚未确认的到达时间、退款条件或权益。涉及费用的条件，应在对应操作步骤中阅读。"),
      },
    ],
    conclusion: t("Tin đăng tốt là tin phản ánh đúng chiếc xe, đúng lịch và đúng khả năng phục vụ của bạn. Dành một lượt kiểm tra trước khi đăng và một lượt đối chiếu khi nhận yêu cầu sẽ giúp hai bên trao đổi trên cùng một bộ thông tin.",
      "A useful listing reflects the right vehicle, schedule and realistic service capacity. Check once before posting and again when a request arrives so both parties work from the same information.",
      "好的信息应真实反映车辆、时间和服务能力。发布前检查一次，收到请求后再核对一次，有助于双方依据同一份信息沟通。"),
  },
  "chuan-bi-do-noi-that": {
    intro: t("Chuyển đồ nội thất thường khó ở những chi tiết nhỏ: thiếu danh sách phụ kiện, chưa kiểm tra cửa ra vào hoặc chưa rõ ai sẽ bốc xếp. Chuẩn bị từ trước giúp bạn mô tả công việc cụ thể hơn và đối chiếu thuận tiện khi giao nhận. Hãy xem đây là một quy trình tổ chức thông tin, không phải hướng dẫn kỹ thuật tháo lắp cho mọi loại đồ.",
      "Furniture moves often become difficult because of small missing details: an incomplete accessories list, unchecked doorways or unclear loading arrangements. Preparing in advance helps you describe the work and check the handover. Treat this as an organisation guide, not technical dismantling instructions for every item.",
      "家具搬运的麻烦，常来自细节遗漏：配件清单不全、门口未量好，或装卸负责人不明确。提前准备能帮助您描述具体工作，也方便交接核对。本文提供的是信息整理方法，并非适用于所有家具的拆装技术指南。"),
    takeaways: [
      t("Kiểm kê từng món và ghi lại hiện trạng trước khi đóng gói.", "Inventory each item and record its condition before packing.", "包装前逐件登记，并记录现状。"),
      t("Gắn nhãn phụ kiện theo món; tách riêng yêu cầu xử lý đặc biệt.", "Label accessories by item and identify special handling needs.", "配件标签对应具体物品，特殊处理要求单独说明。"),
      t("Thống nhất điểm giao nhận, người phụ trách và cách đối chiếu.", "Agree on handover locations, responsibilities and checks.", "明确交接地点、负责人和核对方式。"),
    ],
    additions: [
      {
        paragraph: t("Có thể chia danh sách thành các nhóm: đồ nguyên khối, đồ có thể tháo theo hướng dẫn của nhà sản xuất và đồ cần người có chuyên môn xử lý. Với mỗi món, ghi tên, số lượng, kích thước cần thiết và nơi đặt khi nhận. Chụp riêng những vết xước hoặc chi tiết đã hư từ trước để tránh nhầm lẫn giữa hiện trạng ban đầu và thay đổi phát sinh.",
          "Group the inventory into intact pieces, items that can be dismantled according to the manufacturer's instructions and items needing specialist handling. Record the name, quantity, relevant dimensions and destination room. Photograph existing scratches or damage separately so the starting condition is clear.",
          "清单可以分为整体搬运、可按制造商说明拆装，以及需要专业处理的物品。逐项记录名称、数量、必要尺寸及到达后放置的房间。原有划痕或损坏应单独拍照，便于区分初始状态与后续变化。"),
        image: { source: "/images/home/shipper-cargo.png",
          alt: t("Các kiện hàng tập hợp để kiểm kê trước vận chuyển", "Packages grouped for an inventory before transport", "运输前集中登记包装件的图"),
          caption: t("Kiểm kê theo từng món hoặc từng kiện giúp hai bên đối chiếu cùng một danh sách.", "An item-by-item inventory gives both parties the same checklist.", "按物品或包装逐件登记，便于双方在交接时按同一份清单核对。") },
        checklist: [
          t("Mỗi món có tên hoặc mã nhận biết dễ đọc.", "Give each item a readable name or reference.", "每件物品都有清楚的名称或编号。"),
          t("Ảnh bao quát và ảnh chi tiết phản ánh đúng hiện trạng.", "Take both overall and detail photos of the actual condition.", "整体照片与细节照片如实反映现状。"),
          t("Đã đo hoặc kiểm tra các vị trí khó đi qua trước ngày chuyển.", "Check difficult access points before moving day.", "搬运日前检查难以通过的位置。"),
        ],
      },
      {
        paragraph: t("Không nên gom tất cả phụ kiện vào một túi không ghi chú. Một túi nhỏ có tên món đồ, số lượng phụ kiện và ảnh tham chiếu sẽ dễ bàn giao hơn. Thiết bị điện, đồ có kính và những món có cơ cấu đặc biệt cần tuân theo hướng dẫn riêng; nếu không chắc, hỏi đơn vị có chuyên môn thay vì tự tháo. Các yêu cầu này nên được trao đổi trước, không mặc định nằm trong dịch vụ tài xế đã nhận.",
          "Avoid putting every accessory in one unlabelled bag. A small bag with the item's name, accessory count and a reference photo is easier to hand over. Electrical appliances, glass and specialist mechanisms need their own instructions. Ask a qualified handler if uncertain; do not assume dismantling is included in the driver's agreed work.",
          "不要把所有配件混装在没有标签的袋子里。独立小袋写明物品名称、配件数量并附参考照片，会更方便交接。电器、玻璃和特殊结构需遵循各自说明；不确定时请咨询专业人员，也不要默认拆装已包含在司机接受的工作中。"),
        image: { source: "/images/news/electronics.png",
          alt: t("Thiết bị gia dụng cần hướng dẫn xử lý riêng", "Household appliances illustrating item-specific handling", "需要按各自说明处理的家电图"),
          caption: t("Vật liệu bảo vệ và cách xử lý phải phù hợp với từng món, không áp dụng một cách cho tất cả.", "Protection and handling should suit the item rather than follow one rule for everything.", "保护与处理方式应适合具体物品，不能一概而论。") },
        example: t("Mẫu nhãn: “Bàn làm việc A — túi phụ kiện A1 — nhận tại phòng làm việc”. Cách đánh dấu này chỉ là gợi ý tổ chức, không thay thế hướng dẫn lắp ráp của món đồ.",
          "Example label: “Desk A — accessories bag A1 — study room.” This is an organisational suggestion, not a replacement for the item's assembly instructions.",
          "标签示例：“书桌 A — 配件袋 A1 — 放置于书房”。这只是整理建议，不能代替物品的安装说明。"),
      },
      {
        paragraph: t("Trước giờ xe đến, thông báo số kiện cuối cùng và những thay đổi so với lần trao đổi trước. Đối chiếu rõ ai bốc xếp ở điểm nhận, ai nhận bàn giao ở điểm trả và thời gian có thể sử dụng thang máy nếu liên quan. Sau khi giao, kiểm tra danh sách, phụ kiện và tình trạng nhìn thấy được cùng người bàn giao; ghi nhận khác biệt bằng thông tin và ảnh cụ thể, không chỉ mô tả chung là “bị hỏng”.",
          "Before arrival, share the final package count and any changes. Confirm loading responsibilities, the receiving contact and lift-access times if relevant. At handover, check the inventory, accessories and visible condition together. Record discrepancies with concrete details and photos rather than a general statement that something is damaged.",
          "车辆到达前，告知最终件数及与此前沟通不同之处。明确起点装卸负责人、终点接收人及必要的电梯使用时间。交接时共同核对清单、配件和可见状态。发现差异应以具体描述和照片记录，而不只是笼统地说“坏了”。"),
        note: t("Bài viết không khẳng định tài xế mặc định cung cấp bốc xếp, tháo lắp hoặc bảo hiểm cho đồ. Phạm vi công việc và các điều kiện liên quan cần được các bên xác nhận riêng.",
          "This article does not imply that loading, dismantling or insurance is included by default. Confirm the scope of work and relevant conditions separately.",
          "本文不表示装卸、拆装或保险默认包含在服务中。工作范围及相关条件，应由各方另行确认。"),
      },
    ],
    conclusion: t("Một danh sách rõ, nhãn dễ hiểu và thông tin giao nhận thống nhất sẽ hữu ích hơn việc chuẩn bị thật nhiều nhưng không có cách đối chiếu. Giữ lại danh sách và ảnh tham chiếu cho tới khi các bên đã kiểm tra xong việc bàn giao.",
      "A clear inventory, readable labels and agreed handover details are more useful than extensive preparation without a way to check it. Keep the list and reference photos until the handover has been reviewed.",
      "清楚的清单、易读的标签和一致的交接信息，比没有核对方法的大量准备更有用。请保留清单与参考照片，直到各方完成交接检查。"),
  },
  "san-sang-truoc-chuyen-di": {
    intro: t("Trước mỗi chuyến đi, việc kiểm tra lại thông tin quan trọng giúp bạn nhận ra điểm chưa rõ khi vẫn còn thời gian trao đổi. Bài viết tập trung vào ba nhóm việc: đúng chuyến, đủ điều kiện sẵn sàng và biết cách liên hệ khi kế hoạch thay đổi. Các kiểm tra kỹ thuật phải theo tài liệu của phương tiện và hướng dẫn của đơn vị có chuyên môn.",
      "Reviewing key details before a trip helps you identify uncertainties while there is still time to discuss them. This guide focuses on the right trip, readiness and communication when plans change. Technical checks must follow the vehicle's documentation and qualified service guidance.",
      "出发前复核关键信息，能让您在仍有时间沟通时发现不明确之处。本文重点是核对行程、确认准备状态，以及计划变化时如何联系。技术检查应遵循车辆资料和专业服务人员的指导。"),
    takeaways: [
      t("Mở đúng đơn và đối chiếu địa chỉ đang có hiệu lực.", "Open the correct order and check the agreed addresses.", "打开正确订单，核对当前有效地址。"),
      t("Chuẩn bị phương tiện, thiết bị và thời gian cho chuyến.", "Prepare the vehicle, device and time needed for the journey.", "准备车辆、设备和行程所需时间。"),
      t("Thông báo sớm bằng thông tin cụ thể nếu có thay đổi.", "Communicate changes early and with concrete details.", "发生变化时尽早告知，并说明具体情况。"),
    ],
    additions: [
      {
        paragraph: t("Khi đang theo dõi nhiều đơn, hãy đối chiếu thêm mã đơn, phương tiện và người liên hệ để tránh mở nhầm hành trình. Địa chỉ trong một yêu cầu thay đổi chưa được xử lý không nên tự động xem là địa chỉ đã chốt. Nếu thông tin trên màn hình và trao đổi giữa hai bên khác nhau, dừng lại làm rõ khi đang ở nơi an toàn rồi mới tiếp tục kế hoạch.",
          "When managing several orders, also check the order reference, vehicle and contact so you do not open the wrong journey. A pending location-change request should not automatically be treated as the agreed address. If displayed details and the conversation differ, clarify the discrepancy while safely stopped before proceeding.",
          "同时关注多个订单时，还需核对订单号、车辆和联系人，避免打开错误行程。尚未处理的位置变更请求，不应自动视作已确认地址。若页面信息与双方沟通不一致，应在安全停靠处确认清楚，再继续安排。"),
        image: { source: "/images/vehicles/car.png",
          alt: t("Ô tô cần đối chiếu với thông tin phương tiện của chuyến", "Car for checking the trip's vehicle details", "用于核对行程车辆资料的汽车图"),
          caption: t("Dù chở người hay chở hàng, hãy đối chiếu đúng phương tiện và đúng hành trình.", "Check the correct vehicle and journey for both passenger and freight trips.", "无论载客或货运，出发前都应核对正确车辆与约定的行程。") },
        checklist: [
          t("Mã đơn và phương tiện trùng với chuyến đang chuẩn bị.", "The order reference and vehicle match the intended trip.", "订单号与车辆对应当前准备的行程。"),
          t("Điểm nhận, điểm trả và người liên hệ đã rõ.", "Pickup, destination and contacts are clear.", "起点、终点及联系人信息明确。"),
          t("Yêu cầu thay đổi đang chờ đã được xem và phản hồi đúng luồng.", "Review pending changes and respond through the proper flow.", "查看待处理变更，并按正确流程回应。"),
        ],
      },
      {
        paragraph: t("Không nên chờ tới lúc cần xác nhận một bước mới kiểm tra pin, mạng hoặc quyền định vị. Trước khi khởi hành, mở ứng dụng để chắc chắn bạn có thể xem đúng đơn và biết thời điểm GPS được cập nhật. Vị trí cũ hoặc kết nối yếu không chứng minh xe đang ở nơi hiển thị. Nếu dữ liệu chưa mới, xử lý khi dừng xe an toàn và trao đổi thêm với bên còn lại.",
          "Do not wait until a confirmation is needed to check battery, network or location permissions. Before setting off, open the app and verify that you can view the right order and its GPS update time. Old coordinates or a weak connection do not prove the vehicle is currently at the displayed point. Address stale data while safely stopped and communicate when needed.",
          "不要等到需要确认操作时，才检查电量、网络或定位权限。出发前打开应用，确认能查看正确订单及 GPS 更新时间。旧坐标或弱网络并不能证明车辆当前就在显示位置。若数据不够新，应在安全停车时处理，并及时沟通。"),
        note: t("Phần này không hướng dẫn sửa xe hoặc tự đánh giá an toàn kỹ thuật. Nếu có dấu hiệu bất thường ở phương tiện, cần nhờ đơn vị có chuyên môn kiểm tra và hướng dẫn.",
          "This section is not a vehicle-repair or technical safety assessment guide. Have unusual vehicle signs checked by a qualified service provider.",
          "本节不是车辆维修或技术安全评估指南。发现车辆异常时，应请专业服务人员检查并指导。"),
      },
      {
        paragraph: t("Thông báo thay đổi nên gồm điều gì xảy ra, đang ảnh hưởng tới phần nào của chuyến và cần bên còn lại phối hợp việc gì. Chỉ đưa mốc thời gian bạn có cơ sở dự kiến; nếu chưa thể xác định, nói rõ là chưa có giờ cập nhật chắc chắn. Với yêu cầu hỗ trợ, gửi đúng thông tin đơn và tình huống để bộ phận tiếp nhận có thể hiểu vấn đề trước khi trao đổi tiếp.",
          "A useful update explains what happened, which part of the journey is affected and what coordination is needed. Give an estimated time only when you have a basis for it; otherwise say that the timing is not yet clear. A support request should include the correct order and situation so the receiving team can understand the issue.",
          "有效的变更通知应说明发生了什么、影响行程哪个部分，以及需要对方如何配合。有依据时再给出预计时间；尚不确定时，就明确说明。提交支持请求时，应提供正确订单与具体情况，让接收人员先理解问题。"),
        image: { source: "/images/news/roadside.png",
          alt: t("Phương tiện cứu hộ hỗ trợ một xe gặp vấn đề", "Roadside assistance for a vehicle", "道路救援车辆协助处理问题的图"),
          caption: t("Hỗ trợ phương tiện; không thể hiện cam kết cứu hộ hoặc phạm vi dịch vụ mặc định của TXE PRO.", "Roadside support, not a promise of rescue or a statement of included TXE PRO services.", "道路协助图，不代表 TXE PRO 的救援承诺或默认服务范围。") },
        example: t("Mẫu cập nhật: “Tôi đang dừng tại vị trí an toàn để kiểm tra xe. Thời gian đến dự kiến có thể thay đổi; tôi sẽ báo lại khi có thông tin rõ hơn.” Đây là ví dụ giao tiếp, không phải tình huống thực tế được xác minh.",
          "Example update: “I am safely stopped for a vehicle check. Arrival timing may change; I will update you when I have clearer information.” This is a communication example, not a verified incident.",
          "通知示例：“我已在安全地点停车检查车辆，到达时间可能变化，有明确信息后会再通知。”这只是沟通示例，并非已核实的真实事件。"),
      },
    ],
    conclusion: t("Một lượt chuẩn bị có ích khi giúp bạn biết điều gì đã rõ và điều gì còn cần xác nhận. Hoàn tất những việc có thể làm trước chuyến, giữ cách liên hệ thuận tiện và chỉ thao tác thiết bị khi dừng xe an toàn.",
      "Preparation is useful when it makes clear what is confirmed and what still needs discussion. Complete the tasks you can before the trip, keep communication available and use the device only while safely stopped.",
      "有效的准备，应让您知道哪些已确认，哪些仍需沟通。提前完成能完成的事项，保持联系方式可用，并只在安全停车时操作设备。"),
  },
};

export function getEditorialDetails(id: string, language: string) {
  const item = details[id];
  if (!item) return undefined;
  const lang = language === "en" || language === "zh" ? language : "vi";
  return {
    intro: item.intro[lang], takeaways: item.takeaways.map(value => value[lang]),
    conclusion: item.conclusion[lang],
    additions: item.additions.map(part => ({
      paragraph: part.paragraph[lang],
      image: part.image ? { source: part.image.source, alt: part.image.alt[lang], caption: part.image.caption[lang] } : undefined,
      checklist: part.checklist?.map(value => value[lang]),
      example: part.example?.[lang], note: part.note?.[lang],
    })),
  };
}
