# Quản trị đối tác

Trang: `/admin/affiliates`.

- **Tổng quan:** số đối tác, thành viên, người đủ điều kiện, tổng thưởng, số dư và yêu cầu thanh toán đang chờ. Thống kê toàn chương trình, không cộng từ trang danh sách đang mở.
- **Đối tác:** tìm theo tên/số điện thoại/email/mã giới thiệu, lọc hoạt động hoặc tạm ngưng, phân trang độc lập. Cột Thành viên hiển thị tổng người giới thiệu và người đủ điều kiện.
- **Chi tiết đối tác:** bấm tên, dòng hoặc biểu tượng mắt; xem số thành viên theo vai trò đăng ký, số đủ điều kiện, số dư/thưởng/thanh toán, biểu đồ đăng ký sáu tháng theo giờ Việt Nam, mốc theo chính sách đã đồng ý. Thành viên, lịch sử thưởng, thanh toán có các tab và phân trang riêng.
- **Thanh toán:** lọc chờ/đã thanh toán/từ chối; giữ quy trình đối soát cũ, không tự chuyển tiền. Lỗi xử lý được hiển thị ngay trong hộp thoại.
- **Chính sách:** bản nháp giữ khi đổi tab; việc lưu vẫn cần phiên bản mới, không sửa quyền lợi đã chấp nhận của đối tác cũ.

API backend bổ sung, đều nằm sau middleware admin accountant/operations/super_admin:

```text
GET /api/v1/admin/affiliates/overview
GET /api/v1/admin/affiliates/partners?page=1&limit=20&q=&status=
GET /api/v1/admin/affiliates/partners/:id
GET /api/v1/admin/affiliates/partners/:id/referrals?page=1&limit=20
GET /api/v1/admin/affiliates/partners/:id/rewards?page=1&limit=20
GET /api/v1/admin/affiliates/partners/:id/payouts?page=1&limit=20
GET /api/v1/admin/affiliates/payouts?page=1&status=
```

Đọc thống kê không chạy đối soát, không tự thêm thưởng, không đổi số dư. `Cache-Control: no-store, private`; API chỉ chọn các trường hồ sơ cần thiết, không trả mật khẩu/KYC. Operations xem và đối soát thưởng; accountant/super_admin được duyệt thanh toán; chỉ super_admin đổi chính sách hoặc trạng thái đối tác. Backend vẫn kiểm tra quyền độc lập với UI.

Frontend bỏ qua phản hồi cũ khi đổi tab, bộ lọc hoặc đối tác trong lúc request đang chạy. Backend local cần nạp source mới; môi trường live cần deploy backend trước hoặc cùng lúc frontend. Không thay mã Flutter hoặc luồng tài khoản của ứng dụng.

Kiểm tra: `tests/affiliate-admin.contract.test.js` và `tests/affiliate.contract.test.js` trên backend (19 đạt); `tests/affiliate.test.mjs` trên website (14 đạt); TypeScript/lint và Next production build đạt. Browser kiểm tra desktop 1440px/mobile 390px bằng API giả lập cách ly: menu, phân trang độc lập, chi tiết, giữ bản nháp, dialog lỗi và quyền operations. Ảnh/log local nằm tại `build/affiliate-admin/`, không phải dữ liệu mẫu hiển thị cho người dùng thật.
