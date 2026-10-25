# Hồ sơ cộng đồng trên trang chủ

## Chế độ hiện tại: slide demo, không lấy dữ liệu thật

- Theo yêu cầu mới, trang chủ chỉ dùng 12 hồ sơ hư cấu (6 chủ hàng, 6 tài xế) từ src/lib/community-examples.ts. Không gọi API cộng đồng, không đọc tài khoản, không phụ thuộc backend và hiển thị ngay từ lần render đầu.
- Thẻ có tên hư cấu, ảnh phương tiện/hàng hóa, tuyến đường và nhu cầu giới thiệu. Theo yêu cầu giao diện, không hiển thị nhãn Demo/Hồ sơ mẫu/Minh họa; popup xác thực vẫn ghi rõ đây là nội dung giới thiệu, không phải tài khoản hay tin xe thật đang mở. Không tạo đánh giá, trạng thái online hoặc số liệu giao dịch giả.
- Slide hiển thị 3 thẻ trên desktop, 2 trên tablet và 1 thẻ kèm một phần thẻ kế tiếp trên mobile; vuốt, nút trước/sau và dots. Không tự chạy, giảm chuyển động theo thiết lập hệ thống.
- Thiết kế đồng bộ với trang chủ: khung tiêu đề navy, điểm nhấn ngọc nhạt, tab/nút primary #136dec, card trắng trên nền xanh rất nhạt. Các nhãn, avatar, tuyến đường và popup xác thực cùng tông; chữ tối đa bold. Có kiểm thử tương phản tính toán, không thay thế kiểm tra trực quan trên thiết bị.
- Bấm bất kỳ vị trí nào trên card mở popup lựa chọn Đăng nhập hoặc Tạo tài khoản. Đăng nhập giữ next về form tìm xe/đăng xe phù hợp, không truyền ID demo hoặc tự chọn người dùng hư cấu.
- Trang cá nhân không còn hiển thị tùy chọn công khai hồ sơ. API và thành phần cũ bên dưới được giữ lại để tránh xóa dữ liệu đã lưu, nhưng không được trang chủ sử dụng.
- Không cần đổi env hoặc cập nhật backend cho chế độ demo. npm run test:landing kiểm thử nội dung, thao tác slide và các đường dẫn xác thực; npm run build kiểm tra production.

## Tham chiếu cơ chế hồ sơ thật trước đây (không còn dùng trên trang chủ)

- Hai tab Chủ hàng / Tài xế hiển thị tối đa 6 hồ sơ thật mỗi nhóm, do người dùng tự đồng ý công khai. Không tạo tài khoản, không seed hồ sơ giả, không lấy danh sách quản trị hoặc dữ liệu KYC.
- Trang cá nhân → Giới thiệu trên trang chủ: mặc định ẩn. Tự nhập tên hiển thị riêng, tỉnh/thành phố và lời giới thiệu; đánh dấu đồng ý công khai cho khách chưa đăng nhập rồi lưu. Bỏ đánh dấu và lưu để rút đồng ý.
- Chỉ xuất ID công khai ngẫu nhiên, vai trò, tên hiển thị, khu vực và lời giới thiệu. Không xuất ID tài khoản, avatar riêng tư, điện thoại, email, địa chỉ KYC, GPS, biển số, số dư hay giấy tờ. Avatar chữ cái và ảnh xe/hàng là minh họa, không khẳng định phương tiện người dùng sở hữu.
- API chặn liên kết, email, chuỗi số điện thoại và HTML trong nội dung nhập. Người dùng vẫn phải tự bảo đảm nội dung muốn công khai; đây không phải cơ chế kiểm duyệt nội dung hoàn chỉnh.
- Không có nhãn đã xác minh/đang online, giá hoặc cam kết xe đang trống. Xem giới thiệu mở popup; nút tìm xe/đăng xe đi vào form chuẩn, không đặt xe hay chọn đối tác tự động.
- Chỉ tài khoản đang hoạt động, chưa xóa và có vai trò khớp với vai trò đã đồng ý mới được liệt kê. Đổi vai trò không tự công khai hồ sơ ở nhóm mới; cần đồng ý lại cho nhóm mới. Hồ sơ ở vai trò cũ có thể hiện lại khi quay về vai trò đã đồng ý.
- GET /api/v1/public/community?role=chu-hang|tai-xe&limit=6: public whitelist, no-store. GET/PUT /api/v1/community/profile: xác thực và chỉ cập nhật hồ sơ của chính mình. PUT bật yêu cầu consentVersion=community-v1; tắt không tạo bản ghi mới.
- Dữ liệu đồng ý lưu riêng trong PublicCommunityProfile, không sửa tên pháp lý hoặc quyền tài khoản. Rút đồng ý có hiệu lực từ lần đọc kế tiếp; tab trang chủ đọc lại khi được mở trở lại. Không thể thu hồi bản sao mà khách đã lưu bên ngoài website.
- Có skeleton toàn khu vực và lỗi kèm Thử lại. Theo yêu cầu bổ sung demo, mỗi nhóm có 3 hồ sơ mẫu chỉ ở frontend, với nhãn Hồ sơ mẫu trên card và thông báo rõ trong popup. Hồ sơ thật ưu tiên trước; tổng tối đa 6 card. API trống/lỗi vẫn có mẫu để tham khảo nhưng lỗi tải hồ sơ thật không bị che giấu. Không polling định kỳ và không tạo tài khoản demo trong DB.

## Triển khai và kiểm tra

Deploy cả backend và landing, khởi động lại backend. Không cần biến môi trường mới hoặc bật công khai hàng loạt. MongoDB tạo collection khi người dùng tự lưu đồng ý đầu tiên. Bản local này không sửa hồ sơ người dùng thật.

- Lỗi 404 /public/community nghĩa là backend đang chạy chưa có API mới, không có nghĩa là chưa có người đồng ý. Khởi động lại/deploy đúng backend trước; không truy vấn bảng Users hay bật công khai hàng loạt để thay thế.
- Local dùng NEXT_PUBLIC_API_BASE khớp PORT của tiến trình backend. Website hiện dùng 5001; backend local 5001 đã được khởi động lại với code mới (PORT của tiến trình được ưu tiên hơn PORT trong .env). Sau đổi biến NEXT_PUBLIC cần khởi động lại dev server; bản production phải build lại. Không tự fallback sang server khác khi API lỗi.
- API trả 200 với items rỗng được hiển thị là chưa có hồ sơ công khai, khác với lỗi tải dữ liệu. Người dùng tự bật Giới thiệu trên trang chủ ở trang cá nhân; không tự sinh hồ sơ thật.

### Chạy lại backend local sau khi tắt máy

Tại BE/txepro-backend/server, chạy PowerShell (chỉ một tiến trình trên cổng 5001):

```powershell
$env:PORT = '5001'
npm run dev
```

Giữ website NEXT_PUBLIC_API_BASE=http://localhost:5001. Nếu cổng đã được dùng, kiểm tra /api/v1/public/community?role=chu-hang&limit=6 trước; không mở thêm tiến trình hoặc tự chuyển qua backend khác. Nodemon giúp nạp source mới, tránh giữ phiên bản API cũ sau chỉnh sửa.

- Website: npm run test:landing, npm run build.
- Backend: node --test --test-concurrency=1 tests/public-community.test.js (MongoDB bộ nhớ tạm).
- Kiểm tra thủ công sau deploy: đồng ý, xem hai tab, xem popup, đổi vai trò, rút đồng ý, tắt/xóa tài khoản. Kiểm thử tự động chưa thay thế kiểm tra trực quan trên desktop/mobile.
