import type { NewsReadingGuide } from "./news-content";
type ArticleCopy = { title: string; summary: string; guide: NewsReadingGuide };
const picture = (name: string, alt: string, caption: string) => ({ source: "/images/news/" + name, alt, caption });
export const vietnameseNews: Record<string, ArticleCopy> = {
  "chon-xe-phu-hop": {
    title: "Cách chọn xe chở hàng phù hợp: tải trọng, loại xe và lộ trình",
    summary: "Tìm xe tải, xe van hay container? Xem cách kiểm tra tải trọng, đặc điểm hàng và đường vào để chọn phương tiện phù hợp trên TXE PRO.",
    guide: {
      intro: "Bạn cần chuyển vài kiện hàng, một bộ nội thất hay cả lô hàng của cửa hàng? Chọn xe phù hợp bắt đầu từ việc mô tả đúng nhu cầu. Khối lượng, thể tích, cách bảo quản và đường vào điểm nhận đều ảnh hưởng đến phương tiện cần tìm. Cẩm nang này giúp bạn chuẩn bị thông tin rõ ràng trước khi tìm xe trên TXE PRO, để cuộc trao đổi với tài xế đi thẳng vào những điều cần thiết.",
      takeaways: ["Cân nhắc cả khối lượng và độ cồng kềnh, không chỉ nhìn số tấn.", "Kiểm tra đường vào, điểm đỗ và giờ nhận hàng ở cả hai đầu.", "Đối chiếu đúng phương tiện, giá và yêu cầu riêng trước khi đặt xe."],
      sections: [
        { heading: "Chọn loại xe theo đặc điểm hàng hóa",
          paragraphs: ["Hãy lập danh sách những món cần vận chuyển, số kiện và khối lượng dự kiến. Với đồ lớn, ghi thêm kích thước để trao đổi với tài xế. Một bộ sofa có thể không nặng nhưng chiếm nhiều diện tích; một lô vật liệu nhỏ gọn lại có thể có khối lượng lớn. Hai nhu cầu này cần được xem xét khác nhau, dù cùng đi trên một tuyến đường.",
          "Xe tải và xe van có cách tiếp cận điểm nhận khác nhau; hàng cần kiểm soát nhiệt độ phải được trao đổi riêng khi tìm xe đông lạnh. Nếu cần container hoặc phương tiện chuyên dụng, mô tả cách bốc xếp và điều kiện tại kho. Danh mục trên ứng dụng giúp bạn chọn nhóm phương tiện, còn yêu cầu cụ thể cần được xác nhận với tài xế trước chuyến."],
          image: picture("dang-xe-trong.webp", "Tài xế bên phương tiện tại khu vực đỗ xe", "Bắt đầu từ nhu cầu thực tế và trao đổi thông tin phương tiện với tài xế."),
          checklist: ["Loại hàng, số kiện và khối lượng dự kiến.", "Đồ dễ vỡ, cần giữ lạnh hoặc cần thiết bị hỗ trợ.", "Ảnh hàng rõ ràng, không để lộ thông tin cá nhân không cần thiết."] },
        { heading: "Kiểm tra tải trọng cùng điều kiện nhận và trả",
          paragraphs: ["Khoảng tải trọng là một phần của việc tìm xe, nhưng không thay thế việc kiểm tra sức chở thực tế. Sau khi thấy phương tiện phù hợp, hãy đối chiếu mô tả xe và trao đổi về hàng cần chở. Không nên hiểu kết quả gợi ý là cam kết mọi món hàng đều vừa xe hoặc mọi tuyến đường đều có thể đi qua.",
          "Chọn đúng điểm ghim trên bản đồ, kiểm tra địa chỉ và bổ sung cổng vào, tầng nhận hàng hoặc vị trí dừng. Với xe lớn, chủ động nói rõ đường hẹp, giới hạn chiều cao hay việc phải trung chuyển. Giờ hẹn cũng cần tính đến lịch mở cửa của kho và thời gian bốc xếp, thay vì chỉ dựa vào thời điểm xe dự kiến xuất phát."],
          image: picture("furniture.png", "Nội thất được chuẩn bị trước khi chuyển lên xe", "Hàng nhẹ nhưng cồng kềnh vẫn cần không gian và cách xếp phù hợp."),
          example: "Bạn chuyển một tủ và nhiều thùng hàng: hãy gửi ảnh tổng thể, kích thước tủ, số thùng và thông tin lối vào. Những chi tiết này hữu ích hơn mô tả chung là “một ít đồ”.",
          note: "Kích thước dùng để trao đổi cách xếp hàng. Không tự suy ra tải trọng cho phép từ kích thước thùng xe." },
        { heading: "Tìm xe trên TXE PRO và kiểm tra trước khi xác nhận",
          paragraphs: ["Tại Tìm xe ngay, chọn ngày giờ, điểm nhận, điểm trả, nhóm phương tiện và thông tin hàng hóa được yêu cầu trên màn hình. Viết ghi chú ngắn nhưng có ích: hàng cần giữ khô, thời gian kho nhận hoặc vị trí cổng vào. Khi xem danh sách, so sánh từng tin xe theo đúng lịch, phương tiện và giá đề xuất.",
          "Trước khi xác nhận và đặt xe, đọc điều kiện đang hiển thị, kiểm tra lại tuyến đường và các yêu cầu đã trao đổi. Sau khi kết nối, theo dõi trạng thái đơn và liên hệ tài xế qua các tùy chọn có sẵn. Nếu cần thay đổi địa chỉ, sử dụng đúng luồng đổi vị trí và kiểm tra phản hồi; đừng chỉ gửi một địa chỉ mới rồi mặc định lộ trình đã cập nhật."],
          checklist: ["Đúng ngày giờ, điểm nhận và điểm trả.", "Đúng xe, đặc điểm hàng và phạm vi công việc đã trao đổi.", "Đọc thông tin giá và điều kiện trước khi xác nhận."] }
      ],
      conclusion: "Chuẩn bị tốt giúp việc tìm xe rõ ràng ngay từ đầu. Hãy bắt đầu bằng danh sách hàng, ảnh chụp và hai địa chỉ chính xác, sau đó chọn phương tiện theo nhu cầu thực tế. Bạn có thể mở Tìm xe ngay trên TXE PRO để tạo yêu cầu và đối chiếu thông tin xe trước khi quyết định."
    }
  },
  "dang-xe-trong-hieu-qua": {
    title: "Cách đăng xe trống trên TXE PRO để chủ hàng dễ tìm đúng xe",
    summary: "Hướng dẫn tài xế chuẩn bị tuyến đường, thời gian, phạm vi hoạt động và tải trọng cho một tin xe trống rõ ràng, dễ đối chiếu với nhu cầu chủ hàng.",
    guide: {
      intro: "Một tin xe trống hiệu quả cần trả lời được ba câu hỏi: xe nào đang sẵn sàng, có thể nhận ở đâu và vào lúc nào? Chủ hàng có cơ sở lựa chọn khi thông tin đăng phản ánh đúng lịch xe và khả năng vận chuyển. Dưới đây là cách chuẩn bị tin đăng trên TXE PRO, cùng những chi tiết tài xế nên kiểm tra trước khi mở tin hoặc thiết lập lịch tự động.",
      takeaways: ["Dùng đúng phương tiện đã thêm và thông tin đang còn chính xác.", "Chọn khung giờ, phạm vi và tải trọng theo khả năng thực tế.", "Kiểm tra trạng thái tin sau khi đăng, nhất là tin có lịch tự động."],
      sections: [
        { heading: "Chuẩn bị phương tiện và thông tin có thể nhận chở",
          paragraphs: ["Trước khi đăng, mở phần quản lý phương tiện và đối chiếu biển số, loại xe cùng các thông tin cần thiết. Chọn đúng chiếc xe sẽ thực hiện chuyến, đặc biệt khi tài khoản có nhiều phương tiện. Giấy tờ và ảnh xe rõ ràng giúp hồ sơ dễ được kiểm tra; thông tin chưa chính xác nên được xử lý trước khi dùng để đăng tin.",
          "Với nhóm xe chở hàng, chọn loại hàng muốn chở và khoảng tải trọng phù hợp với phương tiện. Không mở rộng khoảng nhận chỉ để xuất hiện trong nhiều kết quả. Hàng cần giữ lạnh, thiết bị hỗ trợ hay điều kiện bốc xếp đặc biệt cần được mô tả và trao đổi riêng. Tin đăng rõ ràng giúp hai bên biết sớm chuyến nào thực sự phù hợp."],
          image: picture("chuan-bi-hanh-trinh.webp", "Tài xế rà soát phương tiện tại khu vực đỗ xe", "Kiểm tra phương tiện và lịch xe khi đang dừng tại nơi an toàn."),
          checklist: ["Đúng xe và biển số dùng cho chuyến.", "Loại hàng và tải trọng nhận chở phù hợp.", "Ảnh và hồ sơ phương tiện còn rõ ràng, đầy đủ."] },
        { heading: "Thiết lập tuyến đường, phạm vi và giờ xe trống",
          paragraphs: ["Chọn vị trí xe có thể nhận chuyến và phạm vi hoạt động thực tế. Một phạm vi quá rộng có thể kéo theo nhu cầu ở xa mà bạn không kịp tiếp cận. Với tin có điểm đến hoặc tuyến dự kiến, kiểm tra hai đầu và thời gian để tránh nhầm giữa lịch chiều đi và chiều về. Ghi chú nên ngắn, tập trung vào điều kiện mà chủ hàng cần biết.",
          "Nếu đăng tin tự động, rà lại từng ngày đã chọn, giờ mở tin và khoảng thời gian còn có thể nhận chuyến. Lịch tạo tin không đồng nghĩa tin luôn sẵn sàng ở mọi giờ trong ngày. Chủ hàng còn cần khớp các điều kiện khác như loại xe, tải trọng, khu vực và thời gian. Sau khi lưu lịch, mở lại để kiểm tra các lựa chọn đã được giữ đúng."],
          image: picture("roadside.png", "Xe trên hành trình vận chuyển", "Lịch xe và phạm vi hoạt động cần phản ánh đúng khả năng nhận chuyến."),
          example: "Xe trống sau khi trả hàng buổi chiều: hãy đặt giờ có thể nhận chuyến tiếp theo, thay vì giờ bạn vẫn đang bốc dỡ. Nếu lịch thay đổi, cập nhật tin để chủ hàng đối chiếu đúng.",
          note: "Đăng nhiều tin không thay thế việc chủ động kiểm tra khả năng đáp ứng thời gian của từng chuyến." },
        { heading: "Kiểm tra tin sau đăng và phản hồi khi xe được chọn",
          paragraphs: ["Trước khi bấm đăng, xem lại giá, lịch và thông tin phương tiện. Nếu hệ thống yêu cầu điều kiện tài khoản hoặc quyền lợi để đăng tin, đọc thông báo đang hiển thị và hoàn tất theo hướng dẫn. Không mặc định một tin đã mở thành công chỉ vì đã nhập xong biểu mẫu; hãy kiểm tra kết quả và danh sách của tài khoản.",
          "Khi có lời mời hoặc thông báo xe được chọn, đọc kỹ đơn, ảnh hàng nếu có, tuyến đường và thời gian trước khi phản hồi. Trạng thái hiển thị trong danh sách giúp bạn phân biệt tin còn mở với đơn đang thực hiện. Khi thay đổi lịch cá nhân, chủ động điều chỉnh hoặc tạm dừng đúng tin để tránh giữ thông tin không còn phù hợp trên hệ thống."],
          checklist: ["Kiểm tra kết quả đăng và trạng thái tin.", "Đối chiếu lịch thực tế trước khi nhận chuyến.", "Cập nhật tin khi lịch xe hoặc điều kiện nhận thay đổi."] }
      ],
      conclusion: "Một tin rõ ràng tạo nền tảng cho cuộc trao đổi đúng nhu cầu, nhưng không bảo đảm luôn có đơn phù hợp. Tài xế nên giữ hồ sơ phương tiện, lịch xe và phạm vi nhận chuyến chính xác, rồi kiểm tra thông tin đơn trước khi xác nhận. Bạn có thể bắt đầu từ mục Đăng xe trống trên TXE PRO."
    }
  },
  "chuan-bi-do-noi-that": {
    title: "Chuyển đồ nội thất: cách đóng gói và chọn xe trước ngày chuyển",
    summary: "Chuẩn bị sofa, tủ, bàn ghế và đồ điện tử trước khi chuyển: kiểm kê, bảo vệ bề mặt, kiểm tra lối đi và trao đổi rõ việc bốc xếp với tài xế.",
    guide: {
      intro: "Chuyển nội thất dễ phát sinh việc ngoài dự tính khi chỉ đến ngày chuyển mới kiểm tra tủ có qua cửa hay xe có dừng trước nhà được không. Một danh sách đồ, ảnh chụp và vài số đo cơ bản giúp bạn chuẩn bị chủ động hơn. Bài viết này tập trung vào những bước thực tế trước khi tìm xe, để bạn trao đổi rõ phương tiện và cách giao nhận với tài xế.",
      takeaways: ["Kiểm kê đồ lớn, đồ dễ vỡ và những món cần tháo rời.", "Bảo vệ bề mặt, giữ phụ kiện riêng và ghi nhận tình trạng ban đầu.", "Thống nhất lối tiếp cận và phạm vi bốc xếp trước ngày chuyển."],
      sections: [
        { heading: "Kiểm kê nội thất trước khi chọn phương tiện",
          paragraphs: ["Chia đồ thành nhóm: sofa và ghế, tủ và kệ, bàn, đồ điện tử, thùng đồ nhỏ. Ghi lại món nào có thể tháo rời và món nào cần giữ nguyên. Với tủ cao, mặt bàn dài hoặc sofa lớn, đo các kích thước chính để kiểm tra lối di chuyển. Chụp ảnh tổng thể giúp người nhận thông tin hình dung được khối lượng công việc.",
          "Khi tìm xe, mô tả cả số lượng đồ và độ cồng kềnh. Đừng chỉ ước lượng bằng số thùng nếu còn nhiều nội thất rời. Với thiết bị điện, tham khảo hướng dẫn đóng gói và vận chuyển của nhà sản xuất; yêu cầu kỹ thuật đặc biệt cần được trao đổi trước. Khả năng chở còn phụ thuộc việc bảo vệ, chằng giữ và cách xếp, không chỉ khoảng trống nhìn thấy."],
          image: picture("furniture.png", "Đồ nội thất cần được kiểm kê và chuẩn bị trước khi chuyển", "Kiểm kê và đóng gói trước khi xe tới giúp buổi giao nhận chủ động hơn."),
          checklist: ["Danh sách đồ và ảnh tổng thể.", "Kích thước những món lớn, khó tháo rời.", "Thiết bị cần cách vận chuyển riêng."] },
        { heading: "Đóng gói theo bề mặt và giữ phụ kiện có tổ chức",
          paragraphs: ["Làm sạch và giữ bề mặt khô trước khi bọc đồ. Dùng vật liệu bảo vệ phù hợp cho góc cạnh, kính và các bề mặt dễ xước; không quấn hoặc dán trực tiếp lên lớp hoàn thiện nếu có thể gây hư hại. Đồ nhỏ nên chia thành các thùng vừa sức di chuyển, ghi nhãn khu vực nhận và đánh dấu nhóm dễ vỡ.",
          "Cho ốc vít, bản lề và phụ kiện tháo rời vào túi riêng, gắn với món đồ tương ứng. Chụp ảnh cách lắp hoặc điểm nối trước khi tháo nếu cần. Với đồ có giá trị hoặc tình trạng đặc biệt, ghi nhận hiện trạng để hai bên cùng kiểm tra lúc giao nhận. Không gửi giấy tờ, mật khẩu hay dữ liệu cá nhân trong ảnh dùng để mô tả hàng."],
          image: picture("electronics.png", "Thiết bị điện tử cần được chuẩn bị trước khi vận chuyển", "Mỗi nhóm đồ cần cách bảo vệ và hướng dẫn vận chuyển phù hợp."),
          example: "Chuyển một bàn tháo chân: bọc mặt bàn riêng, bảo vệ các góc, cho vít vào túi có nhãn và giữ cùng bộ chân. Khi đến nơi, bạn dễ kiểm đếm đủ bộ trước khi lắp lại.",
          note: "Đồ điện hoặc thiết bị nặng cần người có chuyên môn nếu phải tháo lắp. Tránh tự xử lý khi chưa hiểu yêu cầu của thiết bị." },
        { heading: "Thống nhất đường vào, giờ hẹn và công việc giao nhận",
          paragraphs: ["Kiểm tra chiều rộng cửa, cầu thang, hành lang và thang máy ở cả hai địa chỉ. Nếu ở chung cư hoặc tòa nhà, hỏi trước khung giờ được chuyển đồ và khu vực xe có thể dừng. Gửi vị trí ghim chính xác, bổ sung cổng vào hoặc điểm tập kết để tài xế không phải tìm lại khi đã đến nơi.",
          "Trao đổi rõ ai phụ trách bốc xếp, ai tháo lắp, có cần thiết bị hỗ trợ hoặc trung chuyển hay không. Giá xe hiển thị không tự xác nhận mọi công việc phát sinh đã được thống nhất. Trước khi đặt, đối chiếu nội dung trao đổi và điều kiện trên màn hình. Khi giao nhận, dành thời gian kiểm đếm số kiện và quan sát tình trạng đồ trước khi xác nhận theo luồng của đơn."],
          checklist: ["Lối vào và vị trí xe dừng ở hai đầu.", "Khung giờ được phép chuyển đồ.", "Phạm vi bốc xếp, tháo lắp và cách kiểm đếm đã trao đổi."] }
      ],
      conclusion: "Buổi chuyển đồ thuận tiện hơn khi danh sách, cách đóng gói và điều kiện giao nhận đã rõ từ trước. Hãy hoàn tất những bước này rồi tìm phương tiện phù hợp trên TXE PRO. Ảnh hàng và ghi chú cụ thể sẽ giúp bạn trao đổi với tài xế hiệu quả hơn trước ngày chuyển."
    }
  },
  "san-sang-truoc-chuyen-di": {
    title: "Tài xế cần chuẩn bị gì trước chuyến đi? Checklist dễ áp dụng",
    summary: "Cùng kiểm tra lịch trình, phương tiện, điện thoại và thông tin giao nhận trước khi chạy; biết cách trao đổi khi đổi vị trí hoặc phát sinh sự cố.",
    guide: {
      intro: "Trước một chuyến mới, vài phút rà lại thông tin có thể giúp tài xế nhận ra những chi tiết chưa thống nhất: điểm vào kho, người liên hệ hay giờ được giao nhận. Checklist dưới đây kết hợp việc kiểm tra thông tin trên TXE PRO với khâu chuẩn bị phương tiện và thiết bị. Hãy thực hiện khi xe đang dừng ở nơi an toàn, trước khi bắt đầu di chuyển.",
      takeaways: ["Kiểm tra đơn, lịch và địa chỉ đã được hai bên thống nhất.", "Chuẩn bị phương tiện theo hướng dẫn sử dụng và lịch bảo dưỡng.", "Hiểu trạng thái đơn, cập nhật vị trí và kênh hỗ trợ trước khi cần dùng."],
      sections: [
        { heading: "Rà lại đơn và các điểm đón, nhận, trả",
          paragraphs: ["Mở chi tiết đơn, đối chiếu đúng phương tiện, điểm nhận, điểm trả và thời gian đã nhận. Với chuyến chở hàng, xem ảnh nếu có và đọc ghi chú về đặc điểm hàng, cách tiếp cận hoặc bốc xếp. Với chuyến chở người, làm rõ điểm đón và những thông tin cần thiết cho việc gặp nhau. Đừng chờ đến khi tới điểm hẹn mới hỏi các chi tiết còn thiếu.",
          "Nếu chủ hàng gửi yêu cầu đổi vị trí, đọc cả địa chỉ mới và trạng thái phản hồi trên ứng dụng. Vị trí đề xuất và lộ trình đã được xác nhận không phải lúc nào cũng là một. Khi cần trao đổi thêm, dùng kênh liên hệ có sẵn và kiểm tra lại lộ trình sau khi xử lý yêu cầu. Không tự suy ra một thay đổi đã có hiệu lực chỉ từ nội dung tin nhắn."],
          image: picture("dang-xe-trong.webp", "Tài xế xem thông tin chuyến khi xe đang đỗ", "Rà soát lịch trình tại nơi đỗ an toàn trước khi xuất phát."),
          checklist: ["Đúng đơn và đúng phương tiện.", "Ngày giờ, điểm nhận và điểm trả rõ ràng.", "Yêu cầu đổi vị trí đã có trạng thái phản hồi cụ thể."] },
        { heading: "Kiểm tra xe và chuẩn bị điện thoại cho hành trình",
          paragraphs: ["Kiểm tra phương tiện theo hướng dẫn của nhà sản xuất và lịch bảo dưỡng áp dụng cho xe. Nếu có dấu hiệu bất thường, nhờ đơn vị có chuyên môn đánh giá trước khi vận hành. Với hàng cần điều kiện bảo quản hoặc thiết bị hỗ trợ, xác nhận phương tiện có thể đáp ứng trước khi tới nhận. Checklist trong bài không thay thế quy trình kỹ thuật của từng loại xe.",
          "Chuẩn bị pin, kết nối mạng, âm lượng thông báo và quyền vị trí cần thiết. GPS phụ thuộc tín hiệu, thiết bị và môi trường; một điểm hiển thị trên bản đồ không tự chứng minh đơn đã chuyển trạng thái. Khi ứng dụng yêu cầu kiểm tra vị trí, dừng xe an toàn rồi thực hiện. Tránh vừa điều khiển xe vừa đọc thông báo, trả lời tin nhắn hoặc đổi thiết lập."],
          image: picture("vehicle-check.png", "Các chi tiết cần quan sát khi chuẩn bị phương tiện", "Tuân theo hướng dẫn sử dụng và lịch bảo dưỡng của phương tiện."),
          example: "Trước giờ nhận hàng, bạn kiểm tra thấy ứng dụng chưa được cấp quyền vị trí: hãy xử lý khi đang đỗ, mở lại màn hình theo dõi và kiểm tra trạng thái cập nhật trước khi khởi hành.",
          note: "Ứng dụng hỗ trợ thông tin chuyến; tài xế vẫn cần chủ động đánh giá điều kiện đường đi và vận hành an toàn." },
        { heading: "Theo dõi trạng thái và trao đổi khi kế hoạch thay đổi",
          paragraphs: ["Đọc trạng thái và hành động được hiển thị ở từng bước. Khi đến điểm nhận hoặc điểm trả, thực hiện đúng nút xác nhận của đơn; không coi việc đã ở gần điểm ghim là đã hoàn tất thao tác. Nếu loại phương tiện yêu cầu ảnh giao nhận, chuẩn bị ảnh rõ ràng theo hướng dẫn trên màn hình trước khi gửi xác nhận.",
          "Khi dự kiến đến muộn hoặc phát sinh vấn đề, liên hệ bên còn lại sớm và cung cấp thông tin cụ thể. Nếu sử dụng báo cáo sự cố, đọc nội dung xác nhận và trạng thái xử lý thay vì tự mặc định kết quả. Lưu mã đơn để tra cứu và dùng kênh hỗ trợ chính thức được hiển thị trong ứng dụng hoặc trang Liên hệ của TXE PRO; không dùng số điện thoại truyền miệng chưa được đối chiếu."],
          checklist: ["Thực hiện đúng hành động tại từng trạng thái.", "Chuẩn bị ảnh khi màn hình yêu cầu.", "Trao đổi sớm, giữ thông tin đơn và dùng kênh hỗ trợ chính thức."] }
      ],
      conclusion: "Checklist hữu ích nhất khi được áp dụng đều đặn và phù hợp với phương tiện của bạn. Trước chuyến tiếp theo, hãy rà lại đơn, lịch, xe và điện thoại tại nơi đỗ an toàn. Trong hành trình, theo dõi trạng thái trên TXE PRO và chủ động trao đổi khi có điều gì thay đổi."
    }
  }
};
