# Đăng tin trên website TXE PRO

Thay đổi trong checkout local, chưa deploy website/backend lên live.
Web dùng API hiện có, không có DB đơn hàng riêng và không sửa cơ chế phí.

## Các trang

- `/dang-tin`: chọn tác vụ chủ hàng hoặc tài xế.
- `/chu-hang/form-tao-don`: thay form mô phỏng bằng đăng tìm xe thật.
- `/tai-xe/dang-tin`: đăng xe trống từ phương tiện đã đăng ký.
- `/tai-xe/phuong-tien`: thêm, sửa, xóa và OCR cà vẹt trên web; KYC bắt buộc cho tài xế. Xem `web-onboarding.md`.
- `/don-cua-ban`: danh sách phân trang theo vai trò/trạng thái, không có dữ liệu giả.
- Trang chủ thêm 4 lối tắt và ảnh 6 nhóm phương tiện dùng lại từ Flutter.

Header desktop/mobile có liên kết, tài khoản và Đăng tin. Đăng nhập nhận
`next` giới hạn route nội bộ. Kiểm tra vai trò bằng `/auth/me` và backend
tiếp tục kiểm tra quyền khi ghi; không tự đổi vai trò hay xác minh KYC.

## Luồng

Chủ hàng chọn địa chỉ có tọa độ/GPS, loại xe từ catalog, thời gian, một loại
hàng hóa khi phù hợp, tối đa 3 ảnh và ghi chú tùy chọn. POST tạo tin chỉ báo
thành công khi có orderId thật. ID giữ trong URL để refresh không tạo lại đơn.
Danh sách matches gắn đúng từng postId; xác nhận chọn xe mới giữ quyền lợi.
Không thêm công thức giá/ngân sách giả vào payload.

Đồng bộ payload với Flutter: ô tô/xe máy gửi cargoType là Hành khách; ô tô
gửi seats, không gửi số chỗ như vehicleTypeChild. Xe tải dùng weightLabel
đầy đủ và weight là đầu khoảng, không gửi khoảng tấn như loại thùng xe.
Container giữ vehicleTypeChild của nhóm đã chọn. Khớp lệnh dùng cùng API
orders/:id/matches và select-driver, bao gồm tin tự động do backend cung cấp.

Trước mỗi lần xác nhận, web đọc lại trạng thái đơn và danh sách matches,
đối chiếu đồng thời postId/driverId, thời hạn và giá. Tin không còn phù hợp
không được gửi đặt xe; đổi giá hoặc cảnh báo lượt ghép cũ phải xem lại và
đồng ý mới. Sau nạp QR cũng chạy lại bước này. Backend tiếp tục quyết định
quyền lợi trong giao dịch chọn tài xế, không dùng báo giá cũ trên trình duyệt.
Thông báo voucher hoặc số tiền ký quỹ lấy từ financialSummary của kết quả
chọn tài xế; khi thiếu dữ liệu chỉ thông báo đã gửi yêu cầu.

Danh sách cập nhật định kỳ 15 giây và khi quay lại tab trình duyệt, không
chồng các lượt đọc. Đơn đang chờ tài xế/đã nhận không tiếp tục cho chọn xe.
Đây là polling, không phải push realtime. Chưa có trung tâm nhận đơn web.

Tài xế chọn xe sở hữu đang active, cửa sổ thời gian, giá, khoảng tải trọng
nguyên không vượt floor tải trọng xe; ô tô/xe máy/container không gửi tải trọng.
Bán kính mặc định 30 km, thay đổi 3–300 km. Gọi precheck-wallet, xem phí/VAT/
voucher từ server, người dùng đồng ý rồi đăng. Xe máy miễn phí do server quyết định.

Thiếu tiền lấy missingAmount server trả về. QR qua `/common/wallet/topup`,
dùng nguyên số tiền/tài khoản/nội dung phản hồi; theo dõi đúng transactionId
trong `/common/wallet/transactions`. Chỉ success mới là nhận tiền. Sau đó người
dùng xác nhận lại, backend kiểm tra điều kiện mới nhất. Không tự cộng số dư.

Không tự retry/failover POST khi timeout/mất mạng/HTTP 500. Khóa thao tác khi
kết quả chưa xác định và yêu cầu kiểm tra Tin/đơn. Create-order/create-post
chưa có idempotency key cho mọi trường hợp nên không chống trùng tuyệt đối
sau refresh hoặc ở nhiều tab. Không tuyên bố đạt mức bảo đảm đó.

## Môi trường

Localhost website không có nghĩa DB test. `.env.local` đang trỏ API 5000;
backend này có thể dùng chung DB live. Form hiển thị API đang dùng.
Để thử trên demo DB tách biệt, chạy backend demo trước rồi tại FE/txpro_landing:

```powershell
$env:NEXT_PUBLIC_API_BASE = "http://localhost:5001"
npm run dev
```

Biến phiên ưu tiên hơn .env.local. Đảm bảo CORS backend cho phép origin website.
Sau khi dừng dev, `Remove-Item Env:NEXT_PUBLIC_API_BASE` để bỏ override phiên.
Không sửa secret hay cấu hình server live trong lượt này.

## Test

```powershell
npm run test:posting
npm run test:posting:backend
npm run build
```

Test backend tùy chọn cần checkout BE và dependencies trong monorepo.
Dùng MongoMemoryReplSet/txepro-test, mock maps/MB, không gọi production.
Kiểm tra payload, tọa độ, tải trọng, phân trang, phân quyền, matching theo
postId, precheck/đăng xe máy, chọn xe và QR pending chưa cộng tiền.

## Giới hạn bàn giao

Web mới xem tin/đơn và tìm xe tiếp cho đơn chưa chọn tài xế.
Chưa thay thế nhận/từ chối đơn của TX, bắt đầu/kết thúc chuyến, tracking GPS
nền, sự cố, đổi vị trí, thiết lập lịch tự động lặp hoặc trung tâm thông báo web.
Những thao tác đó tiếp tục dùng app; không gắn nút giả báo thành công.
Form/tin/đơn mới ưu tiên tiếng Việt; header/trang chủ giữ VI/EN/ZH.
Ảnh phương tiện là minh họa, không phải ảnh của tài xế ứng tuyển.
Chưa QA trực quan trình duyệt hoặc chuyển khoản MB thật: cần staging trước live.
