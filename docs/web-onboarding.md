# Đồng bộ đăng tin và phương tiện trên website

Thay đổi cục bộ; chưa triển khai lên live và không chỉnh DB live.

## Luồng sử dụng

Trang đăng ký đã bỏ nhánh giả lập OTP/phiên thành công khi mất mạng, gửi lại OTP với `purpose: register`, lưu đủ access/refresh token và gắn thiết bị sau xác thực thật. Sau đăng ký tài xế sẽ tới quản lý phương tiện để tiếp tục KYC; đích đến hợp lệ được giữ qua đăng nhập → đăng ký.

- Chủ hàng: đăng nhập → `/chu-hang/form-tao-don` → tạo tin tìm xe → chọn đúng tin xe → xác nhận đặt xe → hệ thống giữ voucher/ký quỹ. Không chặn chủ hàng chưa eKYC.
- Tài xế: đăng nhập/chuyển vai trò → eKYC nếu chưa xác minh → `/tai-xe/phuong-tien` → đăng ký xe → `/tai-xe/dang-tin` → precheck quyền lợi → xác nhận đăng. Điều kiện cuối cùng do API quyết định.
- eKYC `/user/ekyc`: bắt buộc CCCD hai mặt và chân dung, đúng trạng thái verified/pending/rejected từ server. Có thể tiếp tục draft đã OCR và kiểm tra kết quả gửi trước khi gửi lại.
- Quản lý phương tiện: thêm, sửa thông tin, xóa qua API thuộc tài khoản. Không có trường kích thước, số khung/số máy hay nhập sửa biển số. Hàng hóa muốn chở bắt buộc theo nhóm xe; container không có tải trọng; xe máy chở người không có hàng hóa, tải trọng hoặc số chỗ.

## OCR và bảo vệ thao tác

Website dùng Tesseract.js trong worker trình duyệt với dữ liệu eng/vie cục bộ, không gọi dịch vụ OCR ngoài để đọc cà vẹt. Đây là trích xuất OCR, không phải xác thực pháp lý giấy tờ. Backend vẫn kiểm tra ảnh, định dạng, trùng xe và cấp token gắn tài khoản có hạn 30 phút, cùng cơ chế app. Loại xe và thông số khác cho nhập/sửa. Chưa đọc được biển số thì chụp lại, không đoán O/0, I/1 hoặc cho nhập thay OCR.

`npm install` tải các package; `npm run dev` và `npm run build` tự chạy `scripts/prepare-browser-ocr.mjs` để chuẩn bị `/public/ocr/`. Thư mục sinh được gitignore, không cần commit file WASM. Khi dùng lệnh `next` trực tiếp, chạy `node scripts/prepare-browser-ocr.mjs` trước. Runtime chỉ tải worker/WASM/dữ liệu từ website.

KYC giữ document refs và idempotency key trong bộ nhớ cho cùng lượt quét. Khi refresh trang, draft trên server có thể tiếp tục gửi mà không OCR lại; không lưu ảnh CCCD/token xác minh vào localStorage. Đổi bộ ảnh bắt đầu lượt mới. Không tự retry/fallback POST KYC sang backend khác.

Đăng ký xe dùng `registrationRequestId` của backend và cache ảnh đã upload trong cùng lần nhập. Gửi lại cùng payload sau lỗi không rõ kết quả trả lại cùng phương tiện; không sinh request ID mới cho cùng payload. Khóa sửa khi chưa rõ kết quả; mã đang nằm trong bộ nhớ trang, reload cần kiểm tra danh sách trước khi tạo lại.

Mã đơn mới có hậu tố 12 ký tự hex; dữ liệu cũ giữ nguyên. Chỉ retry lỗi unique index của `orderCode`, tối đa 5 lần, không retry lỗi mạng hay index khác.

## Kiểm tra

`npm run test:onboarding`, `npm run test:onboarding:backend`, `npm run test:posting:backend`, `npm run test:roles`, `npm run build`.

Test backend dùng MongoMemoryReplSet / txepro-test và MB/maps mock. Bộ OCR chạy thử trên ảnh chữ tổng hợp, không dùng giấy tờ thật. Cần QA trên ảnh cà vẹt thực tế được phép sử dụng, thiết bị di động và VNPT/MB staging trước khi tuyên bố đã kiểm thử các dịch vụ thật.

Backend phải triển khai cùng web: bộ kiểm tra `deviceOcr.source` cần chấp nhận `browser_tesseract` bên cạnh `mlkit`. Không cần khóa API OCR mới hay biến env mới. Các bước nhận/từ chối đơn, vận hành chuyến và lịch đăng tự động vẫn thuộc app trong phạm vi hiện tại.
