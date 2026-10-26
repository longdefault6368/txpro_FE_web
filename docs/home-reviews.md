# Carousel nhận xét trang chủ

- Đã bỏ section “Hai vai trò. Một kết nối tốt hơn.”; các form tìm xe/đăng xe và nút thao tác nhanh vẫn được giữ.
- Điểm neo /#for-you chuyển tới phần Cẩm nang sử dụng để link Hướng dẫn trên header vẫn hoạt động.
- ReviewsCarousel nằm sau tin tức và trước mục tải app. Hiển thị 3 thẻ trên desktop, 2 trên tablet, 1 kèm một phần thẻ kế tiếp trên điện thoại.
- Sáu nhận xét do biên tập viết theo yêu cầu, có nhãn “Nội dung tham khảo”, không gán tên người thật và không xuất dữ liệu AggregateRating. Nội dung tại src/lib/home-review-examples.ts có vi/en/zh.
- Carousel dùng scroll-snap, vuốt, nút trước/sau, dots và phím mũi tên/Home/End. Không tự cuộn bằng timer; hỗ trợ prefers-reduced-motion.
- HeroShowcase gọi useAmbientMotion với enabled=true; đã bỏ nút/chữ Hiệu ứng. Hook vẫn dừng khi banner ra ngoài viewport, tab ẩn hoặc hệ điều hành yêu cầu giảm chuyển động.
- Test: tests/home-reviews.test.mjs, tests/ambient-motion.test.mjs, tests/landing-presentation.test.mjs.
