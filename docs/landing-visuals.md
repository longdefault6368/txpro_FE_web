# Màu sắc và chuyển động trang chủ

- Giữ nguyên bố cục, nội dung, liên kết và luồng đăng tin.
- Banner dùng navy, xanh điện cho hành động chính, ngọc nhạt cho điểm nhấn. Các phần đọc nội dung vẫn dùng nền sáng.
- Hai thẻ đăng tìm xe/đăng xe trống nổi bật hơn thẻ tra cứu. Phần minh họa sản phẩm và điều khoản có nền đậm để tạo nhịp giữa các vùng sáng.
- Khối Bạn muốn làm gì hôm nay dùng HomeQuickActions riêng: hai thẻ chính xanh primary/navy có ảnh xe đồng bộ catalog, hai thẻ công cụ gọn ở dưới. Toàn bộ card là liên kết bàn phím dùng được, giữ đúng 4 đích cũ; không thêm API hoặc thao tác ghi. Chuyển một cột trên mobile, typography tối đa bold và giảm hiệu ứng theo prefers-reduced-motion.
- Banner có hiệu ứng xuất hiện một lần, kèm hai quỹ đạo chậm (42/58 giây), điểm sáng và ảnh xe nổi nhẹ 5 px. Có nút Hiệu ứng để tạm dừng/bật lại.
- Chuyển động nền chỉ chạy khi banner trong khung nhìn, tab đang hiển thị và không bật giảm chuyển động. Tự dừng khi cuộn qua, ẩn tab hoặc rời trang; trình duyệt thiếu API cần thiết giữ hình tĩnh.
- Phần nội dung xuất hiện một lần khi đi vào khung nhìn, thời lượng 520 ms, giãn tối đa 90 ms. Nút chính có vệt sáng ngắn khi hover; icon thẻ tác vụ, số thứ tự và mũi tên có phản hồi nhẹ.
- Không dùng scroll listener, thư viện animation mới, parallax hoặc thay đổi layout theo từng frame.
- Nội dung mặc định luôn hiển thị. Không có JavaScript hoặc thiếu Web Animations thì các nút và nội dung vẫn dùng được.
- Tôn trọng prefers-reduced-motion, kể cả thay đổi tùy chọn trong khi đang chạy hiệu ứng. Hủy observer/animation khi rời trang.
- Các phần tử trang trí không bắt sự kiện chuột. Chữ tối đa bold (700); hiệu ứng hover được giảm trên thiết bị cảm ứng.
- Phần tin tức chỉ đổi diện mạo bản xem trước trên trang chủ; trang đọc bài và dữ liệu không đổi.
- Khối Không chỉ tìm xe / Đồng hành cả chuyến đi dùng AppFeaturePreview: giao diện điện thoại dựng bằng HTML/CSS/SVG, thay đổi theo ba mục tìm xe, bản đồ và nhắn tin. Chưa có ảnh chụp màn hình app thật trong dự án; đây là bản xem trước sản phẩm, không ghi nhận chuyến đi, GPS hoặc tin nhắn thật. Không thêm nhãn demo/minh họa trên giao diện.
- Khối tải ứng dụng có CSS đầy đủ cho card, nút kho ứng dụng và điện thoại minh họa; thu về một cột trên mobile. Kiểm thử chặn class CSS bị tham chiếu nhưng chưa định nghĩa.

## Kiểm tra

npm run test:landing kiểm tra render, đường dẫn, font, vòng đời animation, tạm dừng khi tab ẩn/ngoài màn hình/giảm chuyển động bằng test doubles và tương phản tính toán của các nhóm chữ nền đậm. Đây không phải kiểm thử trực quan hoặc đo hiệu năng trên thiết bị.

Chạy thêm npm run test:news, npm run test:posting và npm run build. Không cần thêm biến môi trường, không có thay đổi backend.
