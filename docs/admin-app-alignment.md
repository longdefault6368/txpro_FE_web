# Đồng bộ admin với backend và ứng dụng TXE PRO

Hoàn thiện ngày 12/10/2026. Phạm vi: website Next.js admin và các API admin liên quan. Không triển khai server, không chỉnh dữ liệu thật, không thay đổi flow hoặc quyền GPS/TTS của Flutter.

## 1. Đơn hàng, tranh chấp và tài chính

- Dùng chung cách đọc tiến trình đơn: tìm tài xế, chờ phản hồi, đi đến điểm nhận, đã đến điểm nhận, đi đến điểm trả, đã đến điểm trả, chờ Chủ hàng xác nhận, hoàn thành, hủy và tranh chấp.
- Đã đến điểm nhận/trả dựa trên cờ đến nơi backend đã lưu. Không suy diễn đã giao hàng hoặc Chủ hàng đã xác nhận chỉ vì đơn được hoàn thành sau xử lý sự cố.
- Hạn xác nhận lấy đúng shipperConfirmDeadlineAt. Thể hiện riêng trường hợp có báo cáo đang mở, tác vụ tự quyết toán đang tắt, hoặc đơn cũ không thuộc chính sách 24 giờ.
- Snapshot tài chính là nguồn hiển thị giá cước, khoản miễn voucher, ký quỹ, phí và VAT. Khoản giữ thực tế lấy từ ledger, không tự tính phí 5%, dựng mã giao dịch MB hoặc suy ra thanh toán từ trạng thái đơn.
- Bồi thường bổ sung tách khỏi hoàn quyền lợi hợp lệ. Hiển thị trạng thái đã ghi có/chờ duyệt, nguồn tiền, thời điểm ghi có, ngày đủ thời gian chuyển Ví khuyến mãi sang Ví chính và giao dịch chuyển thực tế.
- Hai bên chấp nhận trách nhiệm vẫn dùng workflow hiện hành: hoàn thành đơn, ghi có bồi thường ngay. Không yêu cầu cấp nguồn lại cho khoản đã trả. Số dư âm của sổ quỹ được giải thích là chi phí đã cam kết, không phải khoản người nhận còn phải chờ.
- Tranh chấp giữ bằng chứng hai bên, phản hồi chấp nhận/kháng cáo, sự cố liên quan và nhật ký. Trang đơn liên kết tới đúng hồ sơ/đơn để đối soát.
- Bỏ thao tác admin giả lập trạng thái, gán tài xế theo tên và giải ngân 95% vốn không đi qua workflow tài chính. API cũ trả 409 nếu gọi trực tiếp; không thay trạng thái hoặc tiền.
- Hủy bằng admin chỉ dành cho yêu cầu chưa chọn xe, chưa có snapshot/quỹ khóa/sự cố. Ghi trạng thái bằng compare-and-set để không ghi đè một lần chọn xe vừa xảy ra.
- API lỗi không còn báo thành công hoặc sửa dữ liệu cục bộ. Ghi chú chỉ được ghi nhận khi backend trả kết quả lưu.

## 2. Tin xe và nhiều chuyến

- Tách trạng thái tin khỏi trạng thái từng chuyến. Hiển thị liên kết đúng ID các đơn chờ/chạy/chờ đối soát/tranh chấp của tin.
- Tài xế đang chạy một chuyến không làm tin khác bị coi là bận. Không thêm cơ chế tạm dừng toàn bộ tài khoản.
- Tải trọng lấy khoảng min/max đã đăng; hai đầu bằng nhau hiển thị một số. Tin cũ dùng số tải trọng đã chọn. Khoảng sai được đánh dấu đối soát, không đoán đơn vị kg/tấn.
- Loại phương tiện dùng vehicleCapabilities hiện có: chỉ Ô tô có chỗ; chỉ nhóm được cấu hình có tải trọng/hàng hóa.
- Bảo đảm lấy tiền đang khóa và voucher thực sự giữ tại tin. Phân biệt khoản bảo đảm đã chuyển sang chuyến với khoản giữ tại tin.
- Hiển thị nguyên nhân tạm dừng, lượt hủy, nguồn lịch tự động, ngày/thứ/khung giờ/lần kích hoạt kế tiếp và nhật ký admin.
- Chỉ mở/tạm dừng/xóa khi backend cho phép. Tin đang liên kết chuyến không được đổi trực tiếp để né quyết toán; tin kết thúc không mở lại bằng khoản giữ quỹ cũ.
- Mở lại kiểm tra tài khoản/KYC/hạn chế, phương tiện, lịch và bảo đảm. Tái sử dụng lifecycle hiện hành, không khóa bảo đảm thứ hai. Tin cũ thiếu phí/VAT chỉ bổ sung phần thiếu.
- Lý do admin bắt buộc 10–1000 ký tự, lưu riêng, không ghi đè ghi chú tài xế. Revision cũ bị từ chối và UI tải lại.

## 3. Làm mới và bản đồ admin

- Chi tiết đơn, tin xe và danh sách đơn tải lại khi trở lại tab/trang; không tạo vòng polling liên tục.
- Chặn request cũ ghi đè request mới. Lỗi làm mới giữ dữ liệu đã tải và thông báo chưa cập nhật, không giả lập dữ liệu.
- Bản đồ admin tiếp tục dùng dịch vụ tracking sẵn có khi tải/làm mới. Giữ camera/zoom người dùng, không để DirectionsRenderer tự kéo camera lại. Có nút thu về toàn tuyến.
- Không thêm một hệ thống WebSocket/GPS riêng và không thay đổi tracking của ứng dụng trong đợt này.

## 4. Tin tức

- Skeleton danh sách, placeholder ảnh khi tải/lỗi, tải ảnh bất đồng bộ và xem trước bài theo đối tượng Chủ hàng/Tài xế.
- Bài bật xuất bản nhưng chưa đến giờ ghi “Đã lên lịch”, không ghi “Đang hiện”.
- Rich text xem trước trong iframe sandbox không chạy script. Preview không tự xuất bản, không gửi notification, không sửa nội dung.
- Chặn lưu/xóa/bật tắt trùng; bỏ qua response lọc/phân trang cũ. Giữ API tin tức và bộ lọc audience hiện hành.

## Kiểm tra

- Build production Next.js và TypeScript đã chạy thành công.
- 14 bài kiểm tra frontend về trạng thái, deadline, tải trọng, tài chính, bồi thường và quy tắc tranh chấp đã qua.
- 61 contract test backend về admin operations, admin incidents, lifecycle tin xe, tin tức, chính sách bồi thường và tự quyết toán đã qua trên MongoDB test riêng.
- Lint utility/component/hook mới, trang tin tức và trang tranh chấp đã qua. Một số trang admin cũ còn lỗi lint có trước đợt sửa, chủ yếu any và effect; build/typecheck không bị lỗi.
- Chưa kiểm thử thao tác trên trình duyệt/thiết bị thật trong phiên này; cần kiểm tra trực quan và Google Maps trên staging.

## Triển khai

1. Triển khai backend trước hoặc cùng website, vì admin mới dùng adminOperations, relatedOrders, funding, compensationClaims và escrowLocks.
2. adminControlEvents là trường bổ sung tương thích dữ liệu cũ; đợt sửa admin không yêu cầu migration mới.
3. Không cần biến môi trường mới. UI đọc cờ tự quyết toán hiện hành, không tự bật cờ. Giữ cấu hình replica set/transaction và các migration tài chính đã có.
4. Không seed/reset ví hoặc chạy lại migration tài chính chỉ để sửa giao diện.
5. Kiểm tra staging: các mốc đến nhận/trả, chờ xác nhận 24 giờ, sự cố đã chấp nhận, kháng cáo, tin có voucher, tin có tiền giữ, nhiều chuyến cùng tài xế, tạm dừng/mở lại/xóa và bài lên lịch.
