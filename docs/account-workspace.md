# Tài khoản website

`/user` dùng AccountWorkspace chung cho chủ hàng và tài xế. Trang chỉ đọc
`/auth/profile`, không dựng hồ sơ dựa trên dữ liệu đăng nhập cũ khi API lỗi.
Màn hình quản lý đơn duy nhất là `/don-cua-ban`; đã bỏ bảng đơn, thống kê cước
thành doanh thu ví, số đếm và chờ 350 ms của trang tài khoản cũ.

- Thông tin: tên, điện thoại, email, ngôn ngữ, ngày tham gia, mã giới thiệu;
  avatar được tải qua `/auth/profile/avatar`. Đổi ngôn ngữ lưu server rồi mới
  cập nhật LanguageContext. Màu xanh/navy, font tối đa 700, responsive.
- Đổi tên dùng name-otp/name-verify, không PATCH tên trực tiếp. Email có thể
  xác minh lại địa chỉ chưa được xác minh; challengeId và destination phải
  khớp. Không có thao tác xóa email giả: chỉ đổi sang địa chỉ mới đã xác minh.
- Điện thoại: xác minh số cũ, dùng verificationToken để gửi/kiểm tra OTP số
  mới, lưu cặp access/refresh token từ server trước khi đồng bộ header.
- Mật khẩu: OTP, mật khẩu hiện tại, mật khẩu mới và xác nhận; không lưu mật
  khẩu/OTP vào trình duyệt. Tất cả thay đổi cần thao tác chủ động; resend
  tối thiểu 60 giây và server tiếp tục kiểm soát giới hạn.
- Ví & quyền lợi chỉ gọi khi mở mục. Hiển thị availableBalance,
  guaranteeAvailableBalance, lockedBalance, promoAvailableBalance,
  promoPendingBalance, promoReleaseDays/promoNextReleaseAt từ backend.
  Thiếu dữ liệu không thay bằng 0. Nạp/rút và lịch sử ví tiếp tục dùng app;
  web không đặt nút thanh toán giả.
- Voucher lấy `/common/vouchers` theo vai trò, phân trang 10, số đếm dùng
  summary của server. Khi mở tab hoặc bấm Cập nhật sẽ đọc lại dữ liệu.
- OTP dùng dialog chung có khóa đóng khi chờ. Không tự replay yêu cầu thay
  đổi khi kết quả chưa xác định. Khôi phục bằng tải lại hồ sơ sau đóng dialog.
- Chuyển vai trò dùng RoleSwitchButton. Đăng xuất cố thu hồi refresh token
  theo thiết bị trước khi xóa phiên trình duyệt. Thay đổi tài khoản ở tab
  khác tải lại trang để không trộn dữ liệu.

Kiểm thử: `tests/account-profile.test.mjs`, `tests/account-role-switch.test.mjs`
và các backend `auth-name-update`, `auth-email-update`, `auth-phone-update`.
Tất cả integration dùng DB tạm, không gửi SMS/email thật và không sửa dữ liệu live.
Chưa QA giao diện bằng tài khoản thật hoặc xác minh OTP trên server live.
