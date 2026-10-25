# Dữ liệu vận hành website và cấu hình admin

Thông tin liên hệ công khai lấy từ `GET /api/v1/contacts/company-info` của backend đang chọn. Admin chỉnh sửa tại **Admin → Cài đặt → Thông tin doanh nghiệp**; lưu bằng `PUT /api/v1/contacts/company-info`. Không cần sửa source hoặc build lại để đổi thông tin.

## Những trường có thể quản lý

- Tên doanh nghiệp, tên ngắn, mã số thuế.
- Hotline, số hỗ trợ; email chung, hỗ trợ và quyền riêng tư.
- Hai địa chỉ văn phòng và tên hiển thị tương ứng.
- Ngày/giờ làm việc, thông tin thời gian phản hồi hỗ trợ.
- Website chính thức, Facebook, Zalo.
- Link Google Play, App Store chính thức.

Giữ nguyên các khóa `addressHcm` và `addressHn` để tương thích dữ liệu cũ; giao diện dùng tên văn phòng do admin nhập, không bắt buộc địa chỉ thuộc hai thành phố đó. Để trống mục chưa có thông tin chính thức. Website ẩn mục đó hoặc đưa người dùng đến trang Liên hệ để nhận hướng dẫn tải app. Không thay bằng hotline, địa chỉ, giờ hay link giả.

Backend kiểm tra kiểu dữ liệu, độ dài, số điện thoại, email và HTTPS. Link tải ứng dụng phải trỏ đúng kho ứng dụng. Chỉ admin được lưu; API công khai chỉ trả các trường trong danh sách cho phép.

## Đồng bộ

Provider dùng một nguồn dữ liệu chung cho Footer, trang Liên hệ, Trợ giúp, các CTA và nút tải app. Sau khi admin lưu, tab hiện tại và các tab khác được thông báo tải lại. Các tab đang mở cũng kiểm tra lại khi lấy focus, khi hiện trở lại và mỗi 60 giây khi đang hiển thị. API không dùng cache. Khi lỗi, giữ lần tải thật gần nhất trong phiên, không tạo dữ liệu mẫu.

Mọi lệnh đọc, ghi và refresh token giữ nguyên backend được cấu hình bằng `NEXT_PUBLIC_API_BASE` (hoặc `NEXT_PUBLIC_API_URL`). Website không tự chuyển qua `NEXT_PUBLIC_API_FALLBACK` khi có lỗi. Đổi API public trong môi trường production cần build/restart frontend theo cách triển khai Next.js hiện tại.

## Những dữ liệu vận hành khác đã rà soát

- Trang phân tích admin lấy tổng quan và trạng thái từ `/admin/users/overview`, không dựng biểu đồ hoặc vị trí hoạt động giả.
- Danh sách đơn, thông báo admin và tracking không dùng danh sách mẫu khi API trống/lỗi.
- Tra cứu tracking đi qua backend đã chọn; yêu cầu đăng nhập và chỉ cho chủ hàng/tài xế liên quan hoặc admin xem. Không kết nối MongoDB riêng trong route Next.js.
- Luồng quên mật khẩu và cập nhật hồ sơ không báo thành công giả khi mất kết nối.
- Feed hoạt động công khai hiện không có nguồn dữ liệu được cho phép công khai: API trả danh sách rỗng và widget ẩn. Không đưa GPS/hồ sơ riêng tư ra trang chủ.
- Các thẻ cộng đồng minh họa trên homepage giữ nguyên theo yêu cầu trước đó; chúng chỉ mở đăng ký/đăng nhập, không là bản ghi hoạt động thật.
- Nội dung bài viết, ví dụ và nhãn giao diện là nội dung biên tập; các mốc nghiệp vụ như 3 km, 24 giờ, 60 ngày vẫn theo luồng nghiệp vụ, không bị đổi bởi cài đặt giờ hỗ trợ.

## Chatbot

Đã bỏ khóa và endpoint nhà cung cấp gắn cứng. Nếu sử dụng trợ lý AI, cấu hình riêng phía server Next.js: `CHAT_API_KEY`, `CHAT_API_BASE_URL`, `CHAT_MODEL`; không dùng tiền tố `NEXT_PUBLIC_` cho khóa. Thiếu cấu hình thì route trả 503 và hướng dẫn đến Liên hệ. Không gửi cấu hình doanh nghiệp sang nhà cung cấp AI; trợ lý hướng dẫn người dùng đến trang Liên hệ/Trợ giúp để lấy thông tin chính thức.

## Triển khai và xác minh

1. Deploy backend trước, có API company-info cập nhật và `GET /common/orders/by-code/:code/tracking`.
2. Deploy/build frontend trỏ về đúng backend.
3. Admin nhập/kiểm tra thông tin chính thức, đặc biệt các giá trị có thể đã được lưu từ trước. Không có migration ghi đè thông tin đang lưu.
4. Kiểm tra Footer, Liên hệ, Trợ giúp, nút tải app sau khi lưu và ở tab khác.

Kiểm thử tự động:
- Frontend: `node --test tests/company-info.test.mjs`.
- Backend: `node --test --test-concurrency=1 tests/website-data.contract.test.js` (MongoDB tạm).
- Frontend: `npm run build`.

Các kiểm thử không sửa database thật, không gửi SMS, không gọi MB và không gọi nhà cung cấp AI.
