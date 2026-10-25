# Chuyển vai trò trên website

- Menu tài khoản (desktop/mobile) → **Chuyển vai trò**; trang cá nhân có nút tương tự.
- Khi truy cập form đăng xe/tìm xe bằng vai trò khác, có nút chuyển đúng vai trò, không tự chuyển.
- Popup đọc /auth/me, hiển thị vai trò đang dùng và vai trò muốn chuyển. Hủy/đóng không gọi API thay đổi.
- Xác nhận đọc lại hồ sơ, kiểm tra cùng tài khoản rồi POST /auth/switch-role với tai-xe hoặc chu-hang.
- Dùng transport cùng backend, không fallback/retry lệnh ghi khi mất mạng. Chỉ 401 trước xác thực mới được refresh token và thử lại.
- Kiểm tra role, ID và hai token trong response trước khi cập nhật txpro_token, txpro_refresh_token, txpro_user_session. Không đổi role chỉ bằng localStorage.
- Tải lại trang cá nhân khi chuyển từ menu/tài khoản; quay lại đúng form khi chuyển từ form sai vai trò. Các tab khác trên cùng origin nhận commit marker rồi tải lại trang cá nhân, tránh giữ dữ liệu vai trò cũ.
- Trong lúc xử lý: khóa nút, không cho đóng popup/Escape và chặn gửi trùng trong cùng tab.
- Nếu kết quả không xác định hoặc response thiếu dữ liệu: hướng dẫn đăng nhập lại, không tự POST thêm. Khi bộ nhớ trình duyệt lỗi sau server success: xóa phiên không đầy đủ, yêu cầu đăng nhập lại.
- Nếu tài khoản khác đã đăng nhập ở tab bên cạnh trong lúc xử lý lỗi, giữ nguyên phiên mới và tải lại trang cá nhân; không xóa token của tài khoản mới.
- Admin/khách không có nút chuyển. Backend giữ nguyên thẩm quyền KYC, tài khoản bị khóa và quyền lợi/voucher. Không thêm API cấp quyền, bỏ qua KYC hoặc chuyển tiền ở frontend.
- Dữ liệu form chưa gửi có thể cần nhập lại; popup báo trước. Không tự hủy đơn/tin đang có.

## Kiểm tra

- npm run test:roles: test coordinator, response, storage, race/logout, chống lặp, popup và điểm tích hợp (không kết nối server).
- npm run test:roles:backend: test contract thật trên MongoDB tạm của test helper, không dùng DB local/live.
- npm run build.
- Kiểm tra thủ công sau khi triển khai: desktop/mobile; chuyển hai chiều; form sai vai trò; hủy popup; mất mạng; tab thứ hai; KYC driver chưa xác minh. Chưa thay thế kiểm thử giao diện trên thiết bị thật.

Không cần biến môi trường mới. Deploy frontend cùng backend có /api/v1/auth/switch-role (đã có trong code hiện tại).
