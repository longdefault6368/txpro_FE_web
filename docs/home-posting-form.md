# Form nhanh trên trang chủ

- Vị trí ngay dưới banner; hai tab Chủ hàng và Tài xế, hỗ trợ phím trái/phải, Home/End.
- Dùng chung trường tìm địa chỉ/GPS và tọa độ với form đăng tin. Loại phương tiện lấy từ catalog backend, không hardcode.
- Chủ hàng: lộ trình, bộ chọn loại phương tiện có ảnh theo Flutter, tìm ngay hoặc đặt ngày giờ. Có thể chọn luôn cấp con, khoảng tải trọng xe tải và hàng hóa; tải ảnh và hoàn thiện các trường còn thiếu ở form đầy đủ.
- Tài xế: lộ trình, giờ bắt đầu/kết thúc, giá dự kiến. Chọn xe đã đăng ký và kiểm tra tải trọng/quyền lợi tại form đầy đủ sau đăng nhập.
- Chuyển tab giữ nguyên lộ trình và các thông tin riêng từng bên. Không tự chuyển vai trò tài khoản.
- Bấm Tiếp tục lưu vào sessionStorage của tab trình duyệt, riêng theo vai trò, thời hạn 1 giờ; chuyển tới form chuẩn có dấu ?from=home.
- Dấu ?from=home được giữ trong đường quay lại sau đăng nhập. Chỉ đọc nháp sau khi kiểm tra đúng vai trò và tải catalog/phương tiện xong.
- Không đọc nháp khi đang mở ?order=... hoặc truy cập form bình thường. Nháp dùng một lần; hết hạn/hỏng/giờ đã qua bị bỏ.
- Nháp chỉ có địa điểm, loại xe/cấp con, tải trọng, loại hàng, thời gian và giá dự kiến. Các giá trị danh mục được kiểm tra lại trước khi khôi phục. Không chứa userId, phương tiện sở hữu, token, xác nhận, voucher hoặc thông tin khóa tiền.
- Trang chủ không tạo đơn/tin, tải ảnh hay gọi API tài chính. Người dùng vẫn cần kiểm tra và bấm đăng/xác nhận trong luồng cũ. Server tiếp tục kiểm tra đăng nhập, KYC, quyền phương tiện, ký quỹ/voucher.
- Nếu chặn lưu trữ: báo lỗi và cho mở form đầy đủ; không tự chuyển mất dữ liệu âm thầm.
- Nếu catalog không tải được: có thử lại và cho tiếp tục chọn tại form đầy đủ. Địa điểm bắt buộc chọn kết quả có tọa độ, không nhận chuỗi nhập tự do.

Không thay đổi backend hay env; chưa deploy.

Kiểm tra: npm run test:home-posting, npm run test:landing, npm run test:news, npm run test:posting, npm run build.
Các kiểm thử sự kiện dùng React state/router/storage giả lập; không thay thế thử trực quan hoặc GPS trên thiết bị.
