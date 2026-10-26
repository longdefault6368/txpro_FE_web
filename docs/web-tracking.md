# Tracking website: public và tài khoản

- /tracking: giao diện tra cứu, timeline, thẻ phương tiện và bản đồ responsive. /route-tracking cũ chuyển tới cùng trang, giữ mã đơn để không tồn tại hai luồng/icon khác nhau.
- Khách có mã đơn xem được bản đồ lộ trình, địa chỉ và tọa độ nhận/trả, loại phương tiện, loại hàng hóa, giá chuyến, quãng đường, thời gian dự kiến và các mốc trạng thái đã ghi nhận mà không cần đăng nhập.
- API public: GET /api/v1/public/tracking/:code. Chỉ truy vấn chính xác mã, loại đơn đã xóa, rate limit 60 lần/15 phút/IP, Cache-Control no-store. Không trả ID nội bộ, tài khoản, GPS trực tiếp của tài xế, biển số, thông tin liên hệ, phương thức thanh toán hoặc nội dung sự cố/hủy. Bản đồ public dùng tuyến đường giao nhận; không hiển thị marker GPS tài xế.
- Private: GET /api/v1/common/orders/by-code/:code/tracking vẫn yêu cầu đăng nhập và quyền của chủ hàng/tài xế liên quan hoặc admin.
- Next /api/tracking dùng private khi có bearer. Khi private trả 404 do không có quyền/không tìm thấy, tra cứu lại đúng bản public mà không gửi token. Không chuyển sang backend khác khi lỗi.
- Khách đăng nhập từ CTA sẽ quay lại đúng mã đơn nhờ đường dẫn next đã được kiểm tra.
- Icon: VehicleIcon và marker cùng dùng vehicleImage dựa trên bộ ảnh catalog chung. Rule xe máy, ô tô/số chỗ lấy từ vehicleCapabilities; không tự vẽ một bộ xe khác.
- Maps dùng NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (khóa trình duyệt). Đã chuyển giá trị đang dùng tại local từ source vào .env.local. Khi deploy, khai báo khóa trình duyệt trong môi trường frontend rồi build; cấu hình hạn chế domain/API phù hợp trong dự án Maps. Không dùng khóa server bí mật trên trình duyệt.
- Không vẽ đường thẳng giả khi chưa tải route. Ưu tiên polyline đã lưu; nếu chưa có, tải đường đi khi điểm đầu/cuối đổi. Marker GPS cập nhật độc lập.
- Bản private đang hoạt động refresh nền 30 giây khi tab hiển thị; ngừng khi đơn hoàn thành/hủy/từ chối. Nút Cập nhật tải lại thủ công. Thời gian GPS hiển thị phút/giờ/ngày, không tạo thời gian giả.
- Cần deploy backend có publicTracking.routes.js trước khi triển khai frontend. Không công khai GPS hoặc thông tin người dùng bằng cờ phía frontend.
- Test: backend tests/website-data.contract.test.js (database tạm), frontend tests/tracking-design.test.mjs.
