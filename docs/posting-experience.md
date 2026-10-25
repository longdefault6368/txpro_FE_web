# Giao diện đăng xe trống và tìm xe

Hai trang web dùng chung PostingWorkspace cho logic và PostingForm cho phần hiển thị. Không thay API, cấu hình môi trường hoặc cơ chế tiền/voucher.

## Đồng bộ với Flutter

- Chủ hàng: ngày/giờ trước, lộ trình, phương tiện và hàng hóa, ghi chú/ảnh. Chọn ngay bây giờ không hiện thêm ô giờ.
- Tài xế: lộ trình và bán kính, thời gian, xe đăng ký và tải trọng, ghi chú, giá cước.
- Bộ chọn phương tiện/hàng hóa dùng cùng cách chia nhóm và ảnh Flutter.
- Ngày/giờ là ô bấm mở popup, dùng chung class trigger cao tối thiểu 66px với phương tiện. Áp dụng cả form nhanh trang chủ và hai trang đầy đủ. Chỉ xác nhận mới lưu lựa chọn; hủy giữ nguyên, chủ hàng có tùy chọn Ngay bây giờ.
- Bộ chọn giữ thời gian local của trình duyệt; payload cũ vẫn chuyển sang ISO. Kiểm tra ngày hợp lệ, đặt trước trong tương lai và giờ kết thúc sau giờ bắt đầu.
- Bán kính mặc định 30 km; tải trọng nguyên không vượt giới hạn phương tiện, không cho chọn xe của người khác.
- Một nút submit duy nhất. Desktop dùng cột tóm tắt, mobile cố định nút phía dưới với safe-area và khoảng chừa nội dung.
- Ảnh hàng hóa tối đa 3, có ảnh xem trước, xem lớn và nút xóa. Các URL blob được thu hồi khi bỏ ảnh, đổi loại xe hoặc rời trang.

## Trạng thái và thao tác

- Skeleton bao phủ cả form và tóm tắt khi tải.
- Có trạng thái đăng nhập, sai vai trò, lỗi tải và đăng thành công.
- Kết quả tìm xe có card minh họa, biển số, giá và thao tác đúng postId.
- Chi phí chỉ xuất hiện khi backend trả quote; thiếu tiền dùng đúng missingAmount để mở luồng QR cũ.
- Đăng xe vẫn precheck, kiểm tra đồng ý và quyền phương tiện; không tự tính phí hoặc giả thanh toán thành công.
- Chặn thao tác khi đang đăng/tải ảnh hoặc kết quả mutation chưa xác định.
- Có chọn địa chỉ bằng phím lên/xuống, Enter, Escape và nhãn trợ năng. Giữ nguyên API tìm kiếm/GPS.
- Font đậm tối đa 700; hiệu ứng giảm theo prefers-reduced-motion.

## Kiểm tra cục bộ

    npm run test:posting:ui
    npm run test:home-posting
    npm run test:catalog
    npm run test:posting
    npm run test:posting:backend
    npm run build

Test UI dùng state/API giả lập, không gửi yêu cầu hoặc thao tác số dư thật.
Test backend dùng MongoMemoryReplSet tách biệt và mock nhà cung cấp.
Chưa deploy. Cần kiểm tra trực quan desktop/mobile và GPS trên thiết bị trước khi phát hành.
