# Bộ chọn phương tiện và hàng hóa trên web

Áp dụng chung cho form nhanh trên trang chủ và form đăng tin đầy đủ.

- CatalogPicker.tsx: bộ chọn có ảnh, dấu tick/viền xanh lá, hỗ trợ bàn phím, Escape và quay lại; hàng hóa có ảnh trên, tên dưới.
- catalog-presentation.ts: nhóm và ảnh theo VehicleSelectionCatalog / CargoChoice của Flutter; chỉ ô tô, xe tải và container có cấp con cho chủ hàng.
- Xe tải: dưới 1, 1–5, 5–10, 10–40 tấn; gửi xe tải và giữ nguyên khoảng trong weightLabel.
- Container: thường, lạnh, moóc sàn; xe lồng chở ô tô thuộc nhóm riêng.
- Danh mục lấy từ API, không tạo danh mục độc lập trên web. Các nhóm tổng hợp dùng giá trị backend đã hỗ trợ. Loại mới chưa có ảnh riêng dùng ảnh dự phòng và giữ nguyên giá trị API.
- Hàng hóa gửi đúng chuỗi gốc, không gửi nhãn đã dịch hoặc tên ảnh.
- Form tài xế chỉ chọn ID phương tiện hoạt động thuộc tài khoản đã đăng nhập. Không thay phương tiện thực bằng nhóm hiển thị; hàng hóa nhận chở vẫn lấy từ hồ sơ xe.
- Bản nháp trang chủ giữ loại xe, cấp con, tải trọng, hàng hóa trong 1 giờ. Khi khôi phục phải kiểm tra lại danh mục và vai trò; không tự đăng hoặc tự xác nhận quyền lợi.

Ảnh lấy từ FE/txpro_FE/assets/images/{vehicle,cargo}_picker_*.png. Chạy node scripts/sync-flutter-catalog.mjs để tạo WebP cho web; không chỉnh ảnh gốc Flutter.

Kiểm tra: npm run test:catalog, npm run test:home-posting, npm run test:posting, npm run build. Trong monorepo có thể chạy npm run test:posting:backend; bộ test này dùng MongoMemoryReplSet, không dùng database local/live.

Không thay đổi cơ chế voucher, ký quỹ hoặc thu phí. Chưa triển khai lên server.
