# Giao diện tài khoản và danh sách đơn

- Login/Register dùng chung AuthShell, AuthField và Auth.module.css: hai cột desktop, form ưu tiên trên mobile, nhãn rõ ràng, hiện/ẩn mật khẩu, autofill và OTP bàn phím số.
- Giữ endpoint đăng nhập, xác minh thiết bị, đăng ký OTP, gửi lại mã và hoàn tất phiên đăng ký. Giữ đường dẫn next đã được kiểm tra bằng safePostingReturn.
- Đăng ký vẫn yêu cầu họ tên, số điện thoại, mật khẩu tối thiểu 6 ký tự; email không bắt buộc, vai trò chọn rõ ràng.
- OrdersWorkspace giữ các endpoint theo vai trò và từng tab. Giao diện mới có thẻ lộ trình, trạng thái, ngày giờ Asia/Ho_Chi_Minh, giá null hiển thị “Chưa có giá”, skeleton toàn danh sách, trạng thái khách/rỗng/lỗi và phân trang.
- Chủ hàng đang tìm xe tiếp tục mở đúng form theo ID đơn. Theo dõi dùng mã đơn thực tế; API vẫn kiểm tra quyền.
- Không dựng số tổng từ số bản ghi của một trang. Không thêm dữ liệu demo vào danh sách tài khoản.
- Test giao diện: tests/auth-orders-design.test.mjs. Kiểm tra luồng: tests/onboarding.test.mjs, tests/account-role-switch.test.mjs, tests/web-posting.test.mjs.
