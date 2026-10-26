import type { NewsArticle, NewsReadingGuide, NewsCategory } from "./news-content";
type Draft = { id: string; title: string; summary: string; imageUrl: string; category?: NewsCategory; guide: NewsReadingGuide };
const media = (name: string, alt: string, caption: string) => ({ source: "/images/news/" + name, alt, caption });
const drafts: Draft[] = [
{
 id: "tim-xe-theo-ngay-gio", title: "Đặt xe theo ngày giờ: chuẩn bị lịch nhận và trả thế nào cho rõ?",
 summary: "Cách chọn giờ tìm xe, kiểm tra lịch kho và trao đổi thời gian giao nhận để chủ hàng và tài xế cùng chủ động trước chuyến.",
 imageUrl: "/images/news/lich-van-chuyen.webp",
 guide: {
 intro: "Thời gian đặt xe còn gắn với lúc hàng đã sẵn sàng, kho có người mở cửa và tài xế có thể tới nhận. Nếu những mốc này chưa thống nhất, chuyến đi dễ phát sinh chờ đợi. Cẩm nang này giúp bạn sắp xếp lịch trước khi tìm xe trên TXE PRO, đặc biệt khi đặt cho ngày khác hoặc giao nhận tại địa điểm có giờ hoạt động riêng.",
 takeaways: ["Chọn giờ mà hàng và người giao nhận đều sẵn sàng.", "Kiểm tra cả ngày, giờ và lịch làm việc ở hai đầu.", "Trao đổi lại khi kế hoạch thay đổi."],
 sections: [
 { heading: "Xác định thời điểm thực sự có thể nhận",
 paragraphs: ["Trước khi tìm xe, hỏi người giao thời điểm đóng gói xong và có thể bàn giao. Nếu cần kiểm đếm, đưa hàng xuống tầng trệt hoặc làm thủ tục tại kho, hãy bố trí trước. Chọn giờ khi các bước chuẩn bị đã hoàn tất giúp việc trao đổi với tài xế rõ hơn so với đặt sớm rồi chưa biết phải chờ bao lâu.",
 "Với nhu cầu đi ngay, kiểm tra lựa chọn thời gian trên màn hình trước khi tiếp tục. Với chuyến đặt trước, đọc lại đầy đủ ngày và giờ, nhất là khi quay lại biểu mẫu đã lưu. Không dùng giờ mở ứng dụng làm giờ hẹn nếu lịch nhận thực tế đã thay đổi trong lúc bạn chuẩn bị."],
 image: media("dang-xe-trong.webp", "Tài xế kiểm tra lịch xe tại nơi đỗ", "Đối chiếu lịch trước khi kết nối giúp thống nhất thời điểm nhận."),
 checklist: ["Hàng đã chuẩn bị xong.", "Có người bàn giao và đủ thời gian kiểm đếm.", "Ngày giờ trên biểu mẫu đúng lịch thực tế."] },
 { heading: "Đối chiếu lịch ở cả điểm nhận và trả",
 paragraphs: ["Kho hoặc tòa nhà có thể chỉ cho xe vào trong một số khung giờ. Hỏi trước người liên hệ ở cả hai đầu, thay vì chỉ kiểm tra nơi xuất phát. Những yêu cầu như đăng ký biển số, báo bảo vệ hoặc chờ thang hàng cần được trao đổi để tài xế biết phải chuẩn bị gì trước khi tới nơi.",
 "Thời gian trên bản đồ hỗ trợ lập kế hoạch nhưng có thể thay đổi theo tuyến đi và điều kiện thực tế. Khi trao đổi lịch trả, tính thêm thời gian nhận hàng, bốc xếp và thủ tục. Không biến một con số ước tính thành cam kết giờ đến nếu các bên chưa thống nhất những điều kiện liên quan."],
 image: media("roadside.png", "Tuyến đường cần xem xét khi lên lịch", "Lịch giao nhận nên tính cả thời gian chuẩn bị và các bước tại kho."),
 example: "Kho nhận chỉ mở buổi sáng: xác nhận giờ xe có thể tới với cả tài xế và người nhận. Ghi “giao sớm” chưa đủ để mọi người hiểu cùng một thời điểm.",
 note: "Giờ hẹn và thời gian di chuyển ước tính là hai thông tin khác nhau. Hãy kiểm tra lại khi kế hoạch đổi." },
 { heading: "Trao đổi sớm khi cần thay đổi giờ hẹn",
 paragraphs: ["Nếu hàng chưa sẵn sàng hoặc người nhận đổi lịch, thông báo sớm bằng kênh liên hệ có sẵn. Nói rõ mốc cũ, mốc đề xuất và việc cần xác nhận lại. Một tin cụ thể giúp người nhận phản hồi hữu ích hơn mô tả chung như “chờ thêm một chút” trong khi chưa biết sẽ chờ tới khi nào.",
 "Sau trao đổi, mở lại đúng đơn và kiểm tra thông tin đang hiển thị. Nếu thao tác cần thiết không có trên màn hình, dùng kênh hỗ trợ chính thức để hỏi; không tạo nhiều yêu cầu giống nhau chỉ nhằm thay giờ. Giữ mã đơn để đối chiếu khi có nhiều chuyến được đặt trong cùng khoảng thời gian."],
 checklist: ["Nói rõ giờ cũ và giờ đề xuất.", "Chờ phản hồi về thay đổi quan trọng.", "Kiểm tra lại đúng đơn sau khi thống nhất."] }
 ],
 conclusion: "Một lịch rõ ràng cần gắn với khả năng giao nhận thực tế ở cả hai đầu. Trước khi tìm xe, kiểm tra hàng, người liên hệ và giờ hoạt động của địa điểm. Sau khi kết nối, chủ động trao đổi khi có thay đổi và đối chiếu lại thông tin của đúng đơn trên TXE PRO."
 }
},
{
 id: "chup-anh-hang-hoa-ro-rang", title: "Chụp ảnh hàng hóa thế nào để tài xế dễ đánh giá trước chuyến?",
 summary: "Gợi ý góc chụp tổng thể, chi tiết đóng gói và cách bảo vệ thông tin cá nhân khi gửi ảnh hàng cho tài xế.",
 imageUrl: "/images/news/chup-anh-hang-hoa.webp",
 guide: {
 intro: "Ảnh rõ giúp tài xế hiểu nhanh hơn hàng cần chở, nhưng chụp sát một góc dễ bỏ sót kích thước và số lượng thực tế. Bạn không cần thiết bị chuyên nghiệp: hãy chuẩn bị ánh sáng, chọn góc nhìn có ích và bổ sung mô tả bằng chữ. Bài viết hướng dẫn cách chọn ảnh phục vụ cuộc trao đổi trước chuyến trên TXE PRO.",
 takeaways: ["Chụp tổng thể trước khi chụp chi tiết.", "Gửi kèm số lượng và đặc điểm hàng.", "Loại bỏ thông tin cá nhân không cần thiết."],
 sections: [
 { heading: "Chụp tổng thể toàn bộ nhóm hàng",
 paragraphs: ["Đặt các kiện ở nơi đủ sáng và chụp từ góc thấy được nhiều mặt. Nếu hàng nằm ở nhiều phòng hoặc nhiều dãy, không chỉ chụp phần gần cửa rồi mô tả đó là toàn bộ lô. Chọn góc thể hiện số lượng và độ cồng kềnh; tránh để người hoặc đồ vật khác che phần mà tài xế cần quan sát.",
 "Xem lại ảnh để chắc rằng không rung, tối hoặc mất góc. Với đồ lớn, bổ sung số đo bằng chữ thay vì yêu cầu người xem ước lượng từ ảnh. Với nhiều thùng giống nhau, ghi số kiện và kích thước điển hình. Ảnh giúp hình dung nhu cầu, còn thông số rõ ràng hỗ trợ việc đối chiếu."],
 image: media("chuyen-do-noi-that.webp", "Hàng đã đóng gói cạnh xe chuyển đồ", "Ảnh tổng thể nên cho thấy số lượng và đặc điểm của cả nhóm hàng."),
 checklist: ["Đủ sáng và không rung mờ.", "Thấy được nhóm hàng cần chở.", "Có số lượng và kích thước bổ sung."] },
 { heading: "Chọn chi tiết ảnh hưởng việc vận chuyển",
 paragraphs: ["Sau ảnh tổng thể, chọn chi tiết cần lưu ý như góc dễ xước, mặt kính, bao bì lớn hoặc phần không thể tháo rời. Nếu hàng đã đóng kín, mô tả cách bảo quản bằng ghi chú. Không tự mở bao bì chuyên dụng chỉ để chụp đẹp khi việc đó có thể ảnh hưởng đến bảo vệ sản phẩm bên trong.",
 "Ảnh cần phản ánh hiện trạng, không chỉ là hình sản phẩm khi mới mua. Khi có vết xước hoặc bao bì rách, ghi nhận rõ để hai bên trao đổi. Nếu có yêu cầu kỹ thuật riêng, tham khảo hướng dẫn của đơn vị cung cấp; một ảnh chi tiết không thay thế quy trình vận chuyển của thiết bị."],
 image: media("furniture.png", "Nội thất có góc cạnh cần bảo vệ", "Chọn chi tiết giúp tài xế hiểu cách bảo vệ và giao nhận."),
 example: "Bàn kính đã tháo chân: gửi ảnh cả bộ, cạnh kính đã bảo vệ và ghi rõ các phần rời. Tài xế có cơ sở trao đổi không gian xếp hơn khi chỉ thấy ảnh mặt bàn.",
 note: "Ảnh mô tả không tự xác nhận khả năng chở. Hai bên vẫn cần đối chiếu phương tiện và yêu cầu thực tế." },
 { heading: "Kiểm tra thông tin riêng tư trước khi gửi",
 paragraphs: ["Xem lại nhãn vận đơn, giấy tờ, màn hình máy tính hoặc người xuất hiện trong ảnh. Chỉ gửi thông tin cần cho chuyến. Với nhãn nhạy cảm, chọn góc chụp khác hoặc che phần không liên quan, đồng thời giữ hình dạng và tình trạng hàng mà người xem cần biết để đánh giá việc nhận chở.",
 "Chọn ảnh rõ nhất trong số lượng mà màn hình cho phép. Tránh gửi nhiều ảnh gần như giống nhau khiến chi tiết quan trọng bị bỏ qua. Nếu hàng hoặc cách đóng gói thay đổi đáng kể sau cuộc trao đổi, báo lại bằng thông tin mới. Gắn nội dung với đúng đơn để dễ đối chiếu khi giao nhận."],
 checklist: ["Không lộ dữ liệu cá nhân thừa.", "Chọn ảnh khác góc, bổ sung cho nhau.", "Báo lại khi hàng thay đổi so với ảnh."] }
 ],
 conclusion: "Ảnh hàng có ích khi rõ, đúng hiện trạng và đi cùng mô tả cụ thể. Dùng ảnh tổng thể giới thiệu nhu cầu, ảnh chi tiết chỉ ra điểm cần lưu ý, rồi kiểm tra dữ liệu riêng tư trước khi gửi. Sự chuẩn bị này giúp cuộc trao đổi với tài xế trên TXE PRO dễ hiểu hơn."
 }
},
{
 id: "chon-diem-nhan-tra-tren-ban-do", title: "Chọn điểm nhận và trả trên bản đồ: tránh nhầm cổng, nhầm địa chỉ",
 summary: "Đối chiếu điểm ghim, địa chỉ, lối vào và yêu cầu đổi vị trí để hai bên gặp đúng nơi trong hành trình.", category: "product",
 imageUrl: "/images/news/diem-giao-nhan.webp",
 guide: {
 intro: "Địa chỉ đúng vẫn có thể khiến tài xế dừng ở cổng khác của khu công nghiệp hoặc phía đối diện tòa nhà. Điểm ghim và mô tả lối vào cần được kiểm tra cùng nhau. Bài viết giúp chủ hàng chuẩn bị vị trí nhận, trả rõ ràng và hiểu cách xử lý khi đề xuất địa điểm mới trên TXE PRO.",
 takeaways: ["Đối chiếu tên địa chỉ cùng điểm ghim.", "Bổ sung cổng vào và nơi xe có thể dừng.", "Theo dõi phản hồi khi gửi yêu cầu đổi vị trí."],
 sections: [
 { heading: "Tìm địa chỉ và kiểm tra lại điểm ghim",
 paragraphs: ["Nhập địa chỉ hoặc tên địa điểm đủ cụ thể để xem gợi ý. Sau khi chọn, đối chiếu vị trí trên bản đồ với tên đang hiển thị. Địa điểm có tên gần giống nhau có thể ở khu vực khác; đừng chọn chỉ vì dòng đầu trông quen thuộc. Nếu biết vị trí, kiểm tra lại bằng thao tác đánh dấu trên bản đồ.",
 "Phóng gần để quan sát đường tiếp cận, nhưng không suy ra mọi lối đi đều dùng được cho loại xe đã chọn. Với nơi có nhiều cổng, đánh dấu điểm giao nhận thực sự và mô tả cổng vào. Khi đặt cho người khác, hỏi lại người tại địa điểm trước khi tiếp tục để tránh dùng một vị trí mà bạn chưa kiểm chứng."],
 image: media("chon-xe-phu-hop.webp", "Phương tiện trên tuyến đường giao nhận", "Địa điểm rõ ràng giúp tài xế lập kế hoạch tiếp cận phù hợp."),
 checklist: ["Đúng địa điểm và khu vực.", "Ghim tại nơi dự kiến giao nhận.", "Có người tại địa điểm xác nhận khi cần."] },
 { heading: "Mô tả lối vào và vị trí dừng xe",
 paragraphs: ["Ghi chú ngắn nên trả lời: vào cổng nào, có báo bảo vệ không, hàng ở tầng nào và xe dừng ở đâu? Với xe lớn, nói rõ đường hẹp, giới hạn chiều cao hoặc chỗ cần trung chuyển. Các thông tin này giúp tài xế cân nhắc trước thay vì chỉ xử lý khi đã tới mà không thể tiếp cận điểm nhận.",
 "Nếu cần gặp nhau ở nơi khác gần địa chỉ, thống nhất trước điểm hẹn. Vị trí chia sẻ để tìm người không tự đổi địa chỉ chính thức của đơn. Khi gửi, nói rõ bạn đang chỉ nơi đứng chờ hay muốn đổi điểm giao nhận, để hai bên không hiểu khác nhau về lộ trình cần thực hiện."],
 image: media("dang-xe-trong.webp", "Tài xế xem địa điểm khi xe đang đỗ", "Kiểm tra mô tả lối vào trước khi tới điểm hẹn giao nhận."),
 example: "Kho có cổng văn phòng và cổng xe tải: ghi rõ cổng giao nhận và ghim đúng phía đường có thể tiếp cận. Chỉ tên công ty chưa đủ phân biệt hai lối này.",
 note: "Bản đồ hỗ trợ lập kế hoạch. Điều kiện tiếp cận thực tế vẫn cần đối chiếu với người tại địa điểm." },
 { heading: "Kiểm tra phản hồi khi đề nghị đổi vị trí",
 paragraphs: ["Nếu đơn hỗ trợ Đổi vị trí mới, mở đúng đơn rồi kiểm tra cả ô nhận và trả trước khi gửi. Nói rõ lý do thay đổi khi trao đổi với tài xế. Sau thao tác, quan sát trạng thái chờ phản hồi; không coi địa chỉ đề xuất đã trở thành lộ trình thực hiện ngay khi vừa bấm gửi yêu cầu.",
 "Khi có phản hồi, mở lại lộ trình để xem thông tin đã có hiệu lực. Nếu không đồng ý hoặc yêu cầu được thu hồi, đối chiếu địa chỉ đang dùng thay vì dựa vào bản đề xuất trước đó. Với đơn đã kết thúc hoặc màn hình không cho đổi, dùng hỗ trợ chính thức để được hướng dẫn theo trạng thái hiện tại."],
 checklist: ["Kiểm tra đúng đơn và hai đầu.", "Xem yêu cầu còn chờ hay đã được phản hồi.", "Theo lộ trình sau khi xử lý yêu cầu."] }
 ],
 conclusion: "Điểm ghim, địa chỉ và mô tả cổng vào cần bổ sung cho nhau. Trước khi đặt xe, xác nhận nơi giao nhận với người tại địa điểm. Khi thay đổi, dùng đúng chức năng và kiểm tra phản hồi để chủ hàng và tài xế cùng theo một thông tin trên TXE PRO."
 }
},
{
 id: "theo-doi-chuyen-di-va-gps", title: "Theo dõi chuyến đi trên TXE PRO: đọc trạng thái và thời gian GPS",
 summary: "Hiểu vị trí mới nhất, thời gian cập nhật và trạng thái hành trình; không nhầm điểm GPS với xác nhận giao nhận.", category: "product",
 imageUrl: "/images/news/gps-hanh-trinh.webp",
 guide: {
 intro: "Bản đồ cho biết vị trí được cập nhật gần nhất của tài xế, còn trạng thái đơn cho biết hệ thống đã ghi nhận bước nào của chuyến. Hai thông tin này liên quan nhưng không thay thế nhau. Cẩm nang hướng dẫn cách đọc màn hình theo dõi trên TXE PRO và trao đổi khi vị trí chưa được cập nhật như mong đợi.",
 takeaways: ["Đọc thời gian cập nhật cùng điểm GPS.", "Xem trạng thái để biết bước đã được ghi nhận.", "Liên hệ bằng thông tin cụ thể khi vị trí chưa rõ."],
 sections: [
 { heading: "Mỗi vị trí hiển thị có một thời điểm cập nhật",
 paragraphs: ["Khi mở theo dõi, nhìn cả vị trí và thời gian GPS được cập nhật. Một điểm từ trước không cho biết chắc xe đang đứng nguyên tại đó. Tín hiệu, mạng, thiết bị và quyền vị trí có thể ảnh hưởng việc gửi mẫu mới; thời gian cập nhật giúp bạn hiểu mức độ mới của thông tin đang được nhìn thấy.",
 "Nếu lần cập nhật đã lâu, tránh tự kết luận tài xế dừng chuyến hoặc đi sai đường. Chờ mẫu mới hoặc liên hệ để làm rõ khi cần. Khi hỏi, nêu mã đơn và thời điểm đang thấy. Điều này cụ thể hơn chỉ nói “bản đồ không chạy” mà chưa biết mình đang quan sát dữ liệu của lần nào."],
 image: media("dang-xe-trong.webp", "Tài xế xem thông tin tại nơi đỗ xe", "Kiểm tra kết nối và thiết bị khi xe đang dừng ở nơi an toàn."),
 checklist: ["Đang xem đúng đơn.", "Có đọc thời gian GPS cập nhật.", "Phân biệt dữ liệu cũ với vị trí mới."] },
 { heading: "Trạng thái thể hiện hành động đã được ghi nhận",
 paragraphs: ["Các trạng thái đến điểm nhận, đang di chuyển hoặc đã giao phản ánh bước mà ứng dụng đã ghi nhận. Xe ở gần điểm trả không chứng minh hàng đã bàn giao. Hãy xem trạng thái và thông tin xác nhận tương ứng, đặc biệt với phương tiện có yêu cầu ảnh hoặc có bước phản hồi từ chủ hàng.",
 "Nếu mở nhiều đơn, kiểm tra mã trước khi so bản đồ với cuộc trao đổi. Các chuyến có thể cùng khu vực nhưng khác thời gian, xe hoặc người liên hệ. Khi quay lại từ thông báo, đọc trạng thái hiện tại thay vì chỉ dựa vào nội dung đã được gửi trước đó và có thể không còn phản ánh bước mới nhất."],
 image: media("chon-xe-phu-hop.webp", "Phương tiện di chuyển trên tuyến vận chuyển", "Đọc vị trí trên đường cùng trạng thái thực hiện giao nhận."),
 example: "Xe gần kho nhưng đơn vẫn đang giao: bạn có thể chuẩn bị người nhận và chờ bước xác nhận tương ứng thay vì coi chuyến đã hoàn tất.",
 note: "Thông tin theo dõi hỗ trợ phối hợp, không thay thế kiểm tra và xác nhận giao nhận thực tế." },
 { heading: "Chia sẻ điểm gặp và trao đổi khi cần hỗ trợ",
 paragraphs: ["Khi tài xế chưa tìm được người liên hệ, dùng chia sẻ vị trí nếu màn hình hỗ trợ. Xem kỹ bạn đang gửi vị trí hiện tại, điểm cố định hay phiên chia sẻ có thời hạn. Chỉ gửi điều cần thiết để gặp nhau và kiểm tra trạng thái chia sẻ sau khi đã liên lạc được người cần gặp.",
 "Nếu cần hỗ trợ, ghi mã đơn, thời điểm quan sát và nội dung đang hiển thị. Dùng kênh chính thức trong ứng dụng hoặc trang Liên hệ để cung cấp thông tin. Khi tài xế cần thao tác thiết bị, trao đổi lúc xe có thể dừng an toàn; tránh yêu cầu vừa lái xe vừa chụp màn hình hay trả lời liên tục."],
 checklist: ["Nói rõ điểm gặp hoặc điều cần xác nhận.", "Kiểm tra chế độ chia sẻ trước khi gửi.", "Cung cấp mã đơn và thời điểm khi cần hỗ trợ."] }
 ],
 conclusion: "Đọc màn hình theo dõi bắt đầu từ đúng đơn, đúng trạng thái và đúng thời gian cập nhật. Khi chưa rõ, trao đổi cụ thể giúp hai bên phối hợp tốt hơn. Dùng GPS như công cụ hỗ trợ và thực hiện các bước xác nhận trên TXE PRO theo tình huống thực tế."
 }
},
{
 id: "trao-doi-truoc-khi-dat-xe", title: "Trước khi đặt xe, chủ hàng nên trao đổi với tài xế những gì?",
 summary: "Danh sách cần làm rõ về hàng, thời gian, bốc xếp và lối vào để hai bên hiểu đúng nhu cầu trước khi xác nhận.",
 imageUrl: "/images/news/trao-doi-truoc-chuyen.webp",
 guide: {
 intro: "Một cuộc trao đổi hiệu quả không nhất thiết dài, nhưng cần đề cập đúng điều quan trọng. Bỏ qua lối vào, đặc điểm hàng hoặc việc bốc xếp có thể khiến hai bên hiểu khác nhau khi tới nhận. Bài viết gợi ý cách mô tả ngắn gọn và kiểm tra lại nhu cầu trước khi chủ hàng chọn xe trên TXE PRO.",
 takeaways: ["Mô tả bằng số lượng và đặc điểm thực tế.", "Nói rõ lịch, lối vào và người liên hệ.", "Đối chiếu điều kiện trước khi xác nhận."],
 sections: [
 { heading: "Bắt đầu từ thông tin hàng cần vận chuyển",
 paragraphs: ["Nêu loại hàng, số kiện và khối lượng dự kiến. Với đồ lớn, thêm kích thước và ảnh tổng thể. Nói rõ phần dễ vỡ, cần giữ khô, giữ lạnh hoặc giữ nguyên tư thế. Không dùng mô tả “hàng bình thường” nếu có yêu cầu riêng mà tài xế không thể biết chỉ từ nhóm phương tiện đang được chọn.",
 "Nếu chưa chắc thông số, nói rõ đó là ước tính và kiểm tra lại trước khi xác nhận. Với chuyến chở người, tập trung vào hành trình, điểm đón và thông tin được màn hình yêu cầu. Không bổ sung hàng hoặc công việc chưa trao đổi rồi mặc định phương tiện và lịch xe vẫn đáp ứng như ban đầu."],
 image: media("chuyen-do-noi-that.webp", "Nhóm hàng chuẩn bị cho việc vận chuyển", "Thông tin cụ thể giúp tài xế hình dung công việc trước khi tới nhận."),
 checklist: ["Loại hàng và số kiện.", "Khối lượng, kích thước hoặc phần chưa chắc.", "Điều kiện bảo vệ và xử lý riêng nếu có."] },
 { heading: "Làm rõ thời gian và phạm vi công việc",
 paragraphs: ["Cung cấp giờ nhận, giờ người nhận có mặt và điều kiện vào kho hoặc tòa nhà. Nói rõ hàng ở tầng nào, có thang hàng không và xe dừng gần được hay cần trung chuyển. Đây là các chi tiết ảnh hưởng phối hợp, dù địa chỉ đã đúng và quãng đường giữa hai đầu không thay đổi.",
 "Trao đổi ai bốc xếp, ai tháo lắp và có thiết bị hỗ trợ hay không. Đừng mặc định giá xe đã bao gồm mọi công việc ngoài vận chuyển nếu chưa thống nhất. Khi có yêu cầu mới, hỏi lại trước khi làm. Nếu thông tin giá hoặc điều kiện trên màn hình khác điều bạn hiểu, dừng lại để làm rõ thay vì xác nhận cho xong."],
 image: media("furniture.png", "Nội thất cần làm rõ cách di chuyển", "Phạm vi bốc xếp nên trao đổi trước, nhất là với đồ cồng kềnh."),
 example: "Chuyển tủ từ tầng cao: nói rõ tầng, thang máy, khả năng tháo rời và người hỗ trợ. Chỉ ghi “chuyển một tủ” chưa thể hiện đủ điều kiện thực hiện.",
 note: "Trao đổi cần phù hợp khả năng thực tế và thông tin đơn. Không tự suy ra các công việc chưa được xác nhận." },
 { heading: "Tóm tắt lại trước khi bấm xác nhận",
 paragraphs: ["Trước quyết định cuối, đối chiếu xe, lịch, hai địa chỉ và yêu cầu riêng. Nếu có nhiều tin nhắn, tóm tắt những điều đã thống nhất để tránh bỏ sót. Với đổi vị trí hoặc thông tin đơn, kiểm tra trạng thái thao tác trên ứng dụng thay vì chỉ xem một lời đồng ý chung trong cuộc trò chuyện.",
 "Giữ mã đơn và dùng kênh liên hệ của nền tảng khi có để tiện đối chiếu. Không gửi mật khẩu, OTP hoặc thông tin đăng nhập không cần cho chuyến. Nếu chưa có phản hồi cho điểm quan trọng, chờ làm rõ trước khi xác nhận. Điều này giúp bạn lựa chọn dựa trên nhu cầu thay vì chỉ nhìn mức giá đầu tiên."],
 checklist: ["Đối chiếu xe, giờ và địa chỉ.", "Tóm tắt yêu cầu riêng đã thống nhất.", "Không chia sẻ OTP hoặc mật khẩu."] }
 ],
 conclusion: "Trao đổi tốt là trao đổi đúng điều cần thiết. Chuẩn bị mô tả ngắn có số lượng, ảnh và lịch hẹn, rồi làm rõ phạm vi công việc trước khi chọn xe. Khi đã thống nhất, kiểm tra màn hình xác nhận của đúng đơn trên TXE PRO trước khi tiếp tục."
 }
},
{
 id: "chuan-bi-hang-de-vo", title: "Gửi hàng dễ vỡ: chuẩn bị đóng gói và bàn giao ra sao?",
 summary: "Các điểm cần kiểm tra với đồ kính, gốm và bề mặt dễ hỏng: phân loại, bảo vệ, ghi nhãn và trao đổi cách xếp.",
 imageUrl: "/images/news/dong-goi-de-vo.webp",
 guide: {
 intro: "Đồ kính, gốm hoặc sản phẩm dễ xước cần được mô tả và chuẩn bị trước khi lên xe. Nhãn “dễ vỡ” có ích nhưng không thay thế cách đóng gói phù hợp. Cẩm nang tập trung vào kiểm kê, bảo vệ và trao đổi khi tìm xe; yêu cầu chuyên biệt của mỗi sản phẩm vẫn cần theo hướng dẫn của đơn vị cung cấp.",
 takeaways: ["Tách nhóm dễ vỡ và ghi hiện trạng trước khi đóng.", "Chọn bao bì phù hợp, không chỉ dán nhãn.", "Trao đổi cách xếp và kiểm tra ở hai đầu."],
 sections: [
 { heading: "Phân loại đồ trước khi đóng gói",
 paragraphs: ["Kiểm kê đồ kính, gốm, màn hình hoặc bề mặt hoàn thiện dễ xước. Ghi số lượng và phần cần giữ nguyên tư thế. Nếu bao bì ban đầu còn dùng được, đối chiếu hướng dẫn trước khi thay thế. Những món có yêu cầu kỹ thuật riêng nên hỏi lại người cung cấp hoặc đơn vị có chuyên môn về cách chuẩn bị phù hợp.",
 "Chụp hiện trạng và các điểm đã có dấu vết cần lưu ý. Ảnh cần rõ, không che khuất bởi lớp bọc và gắn với đúng nhóm đồ. Điều này giúp hai bên dễ trao đổi khi bàn giao, nhưng không tự kết luận trách nhiệm nếu có tranh chấp. Chuẩn bị đầy đủ hữu ích hơn cố nhớ lại sau khi hàng đã được xếp lên xe."],
 image: media("electronics.png", "Thiết bị cần kiểm tra trước vận chuyển", "Phân loại và xem yêu cầu của từng sản phẩm trước khi đóng gói."),
 checklist: ["Phân loại và kiểm đếm nhóm dễ vỡ.", "Đọc hướng dẫn sản phẩm nếu có.", "Ghi nhận hiện trạng cần lưu ý."] },
 { heading: "Bảo vệ bề mặt và hạn chế xê dịch",
 paragraphs: ["Chọn vật liệu và cách đóng gói theo hình dạng, khối lượng và bề mặt. Các phần trong kiện cần được bố trí để tránh va trực tiếp khi di chuyển. Không dùng lớp phủ mỏng thay toàn bộ việc bảo vệ nếu sản phẩm cần kết cấu chắc hơn. Khi không chắc, hỏi đơn vị đóng gói có chuyên môn thay vì tự thử với hàng quan trọng.",
 "Ghi nhãn ngoài để người giao nhận biết kiện cần chú ý và chiều đặt nếu có yêu cầu. Nhãn nên dễ đọc nhưng không chứa thông tin cá nhân thừa. Xem lại đáy, nắp và điểm cầm nắm trước khi đưa kiện ra nơi nhận. Tránh xếp chồng khi chưa biết bao bì hoặc sản phẩm có chịu được cách đặt đó không."],
 image: media("chuyen-do-noi-that.webp", "Đồ đã bọc và sắp riêng trước khi lên xe", "Bao bì và cách xếp cần phù hợp với từng nhóm hàng thực tế."),
 example: "Bộ đồ gồm nhiều phần kính rời: phân biệt từng phần, bảo vệ phù hợp và nói rõ cách kiểm đếm với người nhận. Chỉ cho vào thùng rồi dán nhãn không thể thay thế những bước chuẩn bị này.",
 note: "Không có một cách bọc bảo đảm phù hợp cho mọi loại hàng. Ưu tiên hướng dẫn sản phẩm và đơn vị chuyên môn." },
 { heading: "Trao đổi và kiểm tra khi bàn giao",
 paragraphs: ["Khi tạo yêu cầu, nêu loại hàng dễ vỡ, số kiện, ảnh và điều kiện phải giữ trong chuyến. Hỏi khả năng bố trí xe phù hợp trước khi chọn. Nếu cần nâng hạ hoặc người hỗ trợ, trao đổi riêng từ trước; việc chọn nhóm phương tiện chưa tự xác nhận các công việc đó đã được chuẩn bị đầy đủ.",
 "Ở hai đầu, đối chiếu số kiện, nhãn và tình trạng bao bì. Khi có bất thường, ghi thông tin cụ thể và trao đổi bằng kênh phù hợp trước khi kết thúc bàn giao. Làm theo hành động của đơn trên TXE PRO, nhất là khi cần ảnh xác nhận. Không bấm hoàn tất chỉ vì xe đã tới gần địa điểm mà chưa kiểm tra hàng."],
 checklist: ["Mô tả rõ hàng dễ vỡ khi tìm xe.", "Thống nhất hỗ trợ bốc xếp nếu cần.", "Kiểm tra số kiện và bao bì lúc giao nhận."] }
 ],
 conclusion: "Hàng dễ vỡ cần chuẩn bị từ trước khi xe tới. Phân loại, đóng gói phù hợp và trao đổi rõ giúp hai bên biết điểm phải chú ý. Khi bàn giao, kiểm tra thực tế và ghi nhận thông tin của đúng đơn trên TXE PRO trước khi thực hiện bước xác nhận tiếp theo."
 }
},
{
 id: "quan-ly-lich-xe-trong", title: "Quản lý lịch xe trống khi có nhiều phương tiện và nhiều tin đăng",
 summary: "Tổ chức lịch nhận chuyến, nhận biết đúng phương tiện và kiểm tra tin tự động để thông tin đăng sát với khả năng thực tế.", category: "community",
 imageUrl: "/images/news/quan-ly-doi-xe.webp",
 guide: {
 intro: "Có nhiều xe hoặc nhiều tin cùng mở dễ dẫn tới chọn nhầm phương tiện hoặc quên cập nhật một khung giờ đã thay đổi. Tài xế cần phân biệt tin đăng với đơn đã nhận, đồng thời kiểm tra lịch trước mỗi quyết định. Bài viết gợi ý cách tổ chức thông tin trên TXE PRO theo từng xe và từng khoảng thời gian có thể thực hiện chuyến.",
 takeaways: ["Đối chiếu biển số thay vì chỉ nhìn loại xe.", "Tách lịch tin mở với lịch chuyến đã nhận.", "Rà lại ngày giờ tin tự động khi kế hoạch đổi."],
 sections: [
 { heading: "Gắn mỗi lịch với đúng phương tiện",
 paragraphs: ["Mở danh sách phương tiện để kiểm tra biển số, loại xe và thông tin đang dùng. Nếu nhiều xe cùng nhóm, dùng biển số đối chiếu trong mọi bước đăng và nhận chuyến. Chọn chiếc xe thực sự có thể thực hiện hành trình thay vì chọn một xe quen tay rồi dự định đổi lại sau khi đã có người đặt.",
 "Chuẩn bị lịch riêng cho từng xe, gồm lúc bận, lúc có thể nhận tiếp và khu vực dự kiến có mặt. Tính cả bốc dỡ và di chuyển từ chuyến trước, không chỉ giờ trả dự kiến. Nếu có người cùng quản lý, thống nhất cách báo lại khi đổi lịch để tránh mỗi người dựa trên một phiên bản khác nhau khi phản hồi chủ hàng."],
 image: media("dang-xe-trong.webp", "Tài xế xem thông tin và lịch nhận chuyến", "Đối chiếu đúng phương tiện trước khi đăng thêm một khung giờ."),
 checklist: ["Đúng biển số và loại xe.", "Có thời gian chuẩn bị giữa các chuyến.", "Người cùng quản lý được biết khi lịch đổi."] },
 { heading: "Phân biệt tin đang mở với đơn đã nhận",
 paragraphs: ["Tin xe trống thể hiện thông tin để chủ hàng tìm thấy, còn đơn đã nhận có lịch và công việc thực hiện riêng. Khi xem danh sách, đọc trạng thái thay vì nhớ vị trí thẻ. Với nhiều thông báo, kiểm tra mã đơn và phương tiện trước khi phản hồi để không nhầm hai nhu cầu có tên hàng hoặc tuyến gần giống nhau.",
 "Mở nhiều tin không đồng nghĩa mọi lịch đều tương thích. Trước khi đồng ý một chuyến, đối chiếu việc đã nhận và thời điểm xe có thể tới. Khi tin không còn phản ánh đúng tình hình, dùng thao tác đang hiển thị để điều chỉnh. Không để thông tin cũ tiếp tục gây nhầm cho người tìm dù bạn đã biết xe không thể đáp ứng."],
 image: media("chon-xe-phu-hop.webp", "Các phương tiện trên tuyến vận chuyển", "Mỗi xe cần lịch nhận chuyến phù hợp với khả năng thực tế."),
 example: "Hai xe cùng loại nhưng ở hai khu vực: kiểm tra biển số và nơi có thể nhận của từng xe. Một thông báo phù hợp với xe thứ nhất không có nghĩa xe thứ hai cũng tới kịp giờ.",
 note: "Đọc trạng thái hiện tại của tin hoặc đơn. Thông báo cũ có thể không phản ánh thay đổi mới nhất." },
 { heading: "Rà soát cấu hình và kết quả tin tự động",
 paragraphs: ["Với lịch tự động, mở lại cấu hình để kiểm tra ngày chọn, giờ mở và xe được gắn. Nếu lịch nhận đổi, cập nhật phần liên quan trước lần mở tiếp theo. Không chỉ dựa vào việc đã lưu từ trước, vì khả năng sử dụng xe có thể khác sau chuyến mới, kế hoạch bảo dưỡng hoặc một thay đổi trong ngày.",
 "Khi tới giờ dự kiến, kiểm tra danh sách và trạng thái tin. Nếu chưa thấy tin hoặc chủ hàng chưa có kết quả phù hợp, ghi phương tiện, lịch và yêu cầu để đối chiếu. Tìm thấy xe còn phụ thuộc loại xe, khu vực, tải trọng và các điều kiện khác; tránh kết luận chỉ từ một lần tìm không thấy ngay."],
 checklist: ["Kiểm tra ngày, giờ và xe của lịch.", "Cập nhật trước lần mở tiếp theo.", "Đối chiếu trạng thái và điều kiện tìm khi cần hỗ trợ."] }
 ],
 conclusion: "Quản lý nhiều tin bắt đầu từ lịch rõ cho từng xe. Giữ biển số, giờ và khu vực nhận chuyến chính xác, rồi đối chiếu trước mỗi lần xác nhận. Với tin tự động trên TXE PRO, định kỳ mở lại cấu hình và kiểm tra kết quả để tránh dùng lịch đã không còn phù hợp."
 }
},
{
 id: "kiem-tra-hang-khi-giao-nhan", title: "Checklist giao nhận hàng: kiểm đếm và xác nhận đúng đơn",
 summary: "Đối chiếu mã đơn, số kiện, bao bì, người liên hệ và ảnh xác nhận để việc bàn giao ở điểm nhận và trả rõ ràng hơn.",
 imageUrl: "/images/news/ban-giao-hang.webp",
 guide: {
 intro: "Giao nhận không chỉ là chuyển hàng từ xe xuống đất. Kiểm tra đúng đơn, đúng người và số kiện giúp phát hiện sớm chi tiết thiếu hoặc tình trạng cần làm rõ. Checklist này hỗ trợ chuẩn bị cuộc bàn giao trên TXE PRO, từ lúc tới nhận cho tới khi người nhận kiểm tra và thực hiện các bước xác nhận trên màn hình.",
 takeaways: ["Đối chiếu mã đơn và người liên hệ ở hai đầu.", "Ghi nhận tình trạng hàng hoặc bao bì cụ thể.", "Làm đúng yêu cầu ảnh và thao tác của từng chuyến."],
 sections: [
 { heading: "Đối chiếu thông tin trước khi đưa lên xe",
 paragraphs: ["Mở chi tiết đơn để kiểm tra xe, điểm nhận và hàng đã trao đổi. Đối chiếu người bàn giao với đầu mối thống nhất trước đó. Nếu có nhiều lô cùng địa điểm, dùng mã đơn hoặc dấu hiệu rõ ràng để tách nhóm. Không chỉ dựa vào việc tài xế đã đỗ trước kho mà bỏ qua kiểm tra đang nhận đúng hàng.",
 "Kiểm đếm số kiện cùng người giao, chú ý phần rời và phụ kiện. Quan sát bao bì rồi hỏi khi có dấu hiệu khác mô tả ban đầu. Nếu hàng thực tế đổi số lượng hoặc điều kiện chở, trao đổi trước khi tiếp tục. Không để thay đổi quan trọng chỉ được phát hiện sau khi xe đã rời điểm nhận và người giao không còn ở đó."],
 image: media("furniture.png", "Nhóm nội thất cần kiểm kê khi bàn giao", "Số lượng và phần rời nên được đối chiếu từ điểm nhận."),
 checklist: ["Đúng đơn, xe và đầu mối giao.", "Đủ kiện và phụ kiện.", "Khác biệt so với mô tả được trao đổi rõ."] },
 { heading: "Chuẩn bị kiểm tra ở điểm trả",
 paragraphs: ["Báo trước người nhận về thời gian dự kiến và nơi có thể giao. Nếu địa điểm nhiều bộ phận, làm rõ người phụ trách và cách liên hệ. Chỉ chia sẻ dữ liệu của họ trong phạm vi cần cho chuyến. Khi lịch nhận đổi, trao đổi sớm với tài xế để các bên chuẩn bị lại thay vì chỉ đến nơi mới gọi tìm người.",
 "Tại điểm trả, đối chiếu nhãn, số kiện và bao bì theo cách đã thống nhất. Nếu cần mở kiểm tra, thực hiện theo đặc điểm hàng và phạm vi công việc đã trao đổi. Khi có vấn đề, ghi cụ thể kiện nào, dấu hiệu gì, thời điểm quan sát. Mô tả rõ giúp các bên hiểu tình huống hơn những nhận xét chung chung chưa có đối chiếu."],
 image: media("electronics.png", "Thiết bị cần đối chiếu khi giao nhận", "Cách kiểm tra cần phù hợp sản phẩm và nội dung đã thống nhất."),
 example: "Lô nhiều phần rời: đối chiếu từng nhóm với danh sách từ điểm nhận. Chỉ nhìn tổng số thùng bên ngoài có thể bỏ qua bộ phụ kiện được đóng riêng đi cùng.",
 note: "Phân biệt thông tin quan sát thực tế với kết luận về nguyên nhân hoặc trách nhiệm khi có bất thường." },
 { heading: "Chụp ảnh và xác nhận theo yêu cầu của đơn",
 paragraphs: ["Nếu màn hình yêu cầu ảnh, chọn ảnh rõ cho thấy hàng tại điểm giao và tình trạng cần đối chiếu. Kiểm tra trước khi gửi, tránh lộ giấy tờ hoặc dữ liệu cá nhân không liên quan. Số ảnh và thao tác có thể khác theo phương tiện; làm theo hướng dẫn hiện tại thay vì dựa vào chuyến trước đã có quy trình khác.",
 "Trước khi bấm xác nhận, xem lại đúng đơn và việc giao nhận tới bước nào. Nếu cần phản hồi, dùng tùy chọn đang có và giữ mã đơn để trao đổi. Sau thao tác, quan sát trạng thái cập nhật; không mặc định một lần bấm đã thành công khi ứng dụng còn báo lỗi hoặc chưa phản hồi từ hệ thống."],
 checklist: ["Ảnh rõ và đúng nội dung nếu được yêu cầu.", "Đọc lại đơn trước khi xác nhận.", "Kiểm tra trạng thái sau khi hoàn tất thao tác."] }
 ],
 conclusion: "Buổi giao nhận rõ cần phối hợp giữa người giao, tài xế và người nhận. Danh sách, kiểm đếm và ghi nhận tình trạng giúp giảm nhầm lẫn. Khi thực hiện chuyến trên TXE PRO, làm theo yêu cầu hiện trên màn hình và kiểm tra trạng thái đúng đơn sau mỗi thao tác."
 }
}
];
export const extraEditorials: NewsArticle[] = drafts.map(draft => ({
 id: draft.id, title: draft.title, summary: draft.summary, imageUrl: draft.imageUrl,
 category: draft.category || "guide", publishedAt: null, editorial: true, originalLanguage: "vi",
 readingGuide: draft.guide,
 content: [draft.guide.intro, ...draft.guide.takeaways,
 ...draft.guide.sections.flatMap(section => ["## " + section.heading, ...section.paragraphs, ...(section.checklist || []), section.example, section.note]),
 draft.guide.conclusion].filter(Boolean).join("\n\n"),
}));
