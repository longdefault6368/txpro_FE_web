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

Cần API tin tức công khai hiện có trên backend và triển khai lại website. Website dùng NEXT_PUBLIC_API_BASE hiện có. Các bài cẩm nang nằm trong mã nguồn website, không tự ghi vào database hay sửa bài của admin.

## Nội dung, hình ảnh và SEO

- Có 12 bài cẩm nang: bốn bài gốc tại src/lib/news-editorial-vi.ts và tám bài mới tại src/lib/news-extra-editorials.ts. Giữ nguyên URL bài cũ; tám bài mới biên soạn tiếng Việt, có thông báo ngôn ngữ gốc khi đọc từ giao diện English/中文.
- Mỗi cẩm nang có ảnh bìa riêng: 12 file WebP 1400×788, khoảng 66–190 KB, tạo bằng imagegen cho nội dung biên tập tại public/images/news. Đây không phải ảnh hồ sơ người dùng hoặc chuyến xe thực tế. Kiểm thử so sánh cả URL lẫn hash nội dung file để tránh lặp ảnh. Ảnh đầu trang ưu tiên tải; ảnh khác tải khi cần.
- /tin-tuc tải trang đầu từ server; HTML đầu tiên chứa liên kết bài và tiêu đề, kể cả khi CMS lỗi. Tìm kiếm, lọc và phân trang vẫn hoạt động phía trình duyệt.
- Trang danh sách dùng ba cột trên desktop, hai cột trên tablet và một cột trên điện thoại. Mỗi trang tối đa 9 bài; khi chỉ có 12 cẩm nang thì trang đầu 9 bài, trang hai 3 bài. Mỗi bài có ảnh, mô tả, mục lục và liên kết liên quan.
- Phân trang chung cho bài admin và cẩm nang: bài admin xuất hiện trước, sau đó tới cẩm nang; số trang tính trên tổng hai nguồn. Liên kết trang sau có URL riêng, giữ bộ lọc/tìm kiếm và render đúng nội dung từ server, không dồn cẩm nang vào trang đầu.
- Metadata gồm title, description, canonical, Open Graph và Twitter. JSON-LD Article, BreadcrumbList, CollectionPage/ItemList được serialize an toàn; không bịa ngày xuất bản hoặc ngày cập nhật.
- Tên miền chính thức lấy từ SITE_URL hoặc NEXT_PUBLIC_SITE_URL nếu đã cấu hình; nếu chưa có thì đọc websiteUrl do admin cấu hình tại Cài đặt → Thông tin doanh nghiệp. Giá trị phải là URL HTTP(S) đầy đủ. Không suy ra canonical từ Host header, tên miền backend hoặc localhost.
- Nếu chưa có tên miền chính thức, canonical/ảnh chia sẻ có URL tuyệt đối chưa được xuất và sitemap sẽ rỗng. Cấu hình websiteUrl trong admin để hoàn tất phần này, hoặc đặt SITE_URL phía server Next.js rồi khởi động lại.
- /sitemap.xml gồm các trang công khai, cẩm nang và tin public từ API (đọc lần lượt các trang, 24 bài/lần, không vượt giới hạn 50.000 URL). /robots.txt khai báo sitemap khi có tên miền và loại các đường dẫn quản trị/tài khoản riêng tư khỏi crawl. Robots không thay thế kiểm tra quyền của API.
- Sau deploy, kiểm tra URL chính thức, robots.txt, sitemap.xml và đăng ký sitemap trong công cụ quản lý tìm kiếm của chủ website. Thay đổi kỹ thuật không bảo đảm thứ hạng tìm kiếm.

## Kiểm tra

Website: npm run test:news, npm run test:landing, npm run test:posting, npm run build.

Backend: node --test --test-concurrency=1 tests/public-news.contract.test.js tests/admin-news.contract.test.js (MongoDB tạm, không ghi dữ liệu thật).
