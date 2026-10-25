# Tin tức website

- Trang chủ: mục Tin tức & cẩm nang, một bài lớn và ba bài nhỏ; header có link Tin tức.
- /tin-tuc: tìm theo tiêu đề/mô tả, lọc chuyên mục, phân trang tin từ API.
- /tin-tuc/[id]: nội dung đầy đủ, ảnh, mục lục cho cẩm nang, sao chép liên kết và bài liên quan.
- Bốn cẩm nang biên soạn trong src/lib/news-content.ts, hỗ trợ vi/en/zh và dùng ảnh local. Không tạo ngày đăng hoặc ưu đãi giả.
- Nội dung mở rộng nằm ở src/lib/news-editorial-details.ts: mở bài, ba điểm chính, ba phần nội dung có checklist/ví dụ/lưu ý và kết luận. Mỗi bài có hai ảnh trong bài khác ảnh bìa, có alt và chú thích ở cả ba ngôn ngữ.
- Bố cục ảnh xen trái/phải trên desktop, xếp một cột trên điện thoại. Mục lục trỏ tới từng phần, thời gian đọc tính trên toàn bộ nội dung mở rộng.
- Cấu trúc đọc giàu nội dung chỉ áp dụng cho cẩm nang trong mã nguồn; không sửa đè bài admin hoặc tự công khai nội dung mới trong database.
- Tin từ admin giữ nguyên ngôn ngữ biên soạn. Chỉ bài published=true, audience=all, đến ngày xuất bản mới được công khai.
- API mới: GET /api/v1/public/news?page=1&limit=12&category=guide&search=... và GET /api/v1/public/news/:id. List tối đa 24 bài/lần, không trả nội dung chi tiết.
- API /common/news và các API admin vẫn giữ cơ chế đăng nhập cũ.
- Nội dung HTML từ CMS được chuyển thành văn bản có đoạn trước khi hiển thị, không chèn HTML tùy ý vào trang.
- Ảnh CMS tải lỗi chuyển sang ảnh local; URL không phải HTTP(S)/đường dẫn ảnh hợp lệ bị loại.
- Nếu API lỗi: hiển thị cẩm nang, trang danh sách có thông báo và nút thử lại. Không biến lỗi mạng của trang chi tiết thành thông báo bài bị xóa.

## Triển khai

Cần triển khai và khởi động lại backend cùng website. Không thêm biến môi trường mới; website dùng NEXT_PUBLIC_API_BASE hiện có. Các bài cẩm nang nằm trong mã nguồn website, không được tự ghi vào database hay sửa bài của admin.

## Kiểm tra

Website: npm run test:news, npm run test:landing, npm run test:posting, npm run build.

Backend: node --test --test-concurrency=1 tests/public-news.contract.test.js tests/admin-news.contract.test.js (MongoDB tạm, không ghi dữ liệu thật).
