# Danh sách đơn tổng hợp trên web

`/don-cua-ban` mặc định mở Tất cả. Mỗi thẻ gọn gồm mã đơn/biển số, trạng thái,
hai địa chỉ một dòng, loại xe, thời gian thao tác, giá và hành động. Địa chỉ đầy
đủ và ghi chú vẫn có trong Xem thông tin; nút Tìm xe/Theo dõi dùng cùng quy tắc
ở mọi tab. Tin xe không được tạo link tracking giả. Thiếu giá không hiện 0 đ.

- Chủ hàng: `/chu-hang/orders?paginated=true`, backend hiện tại ưu tiên đơn
  đang thực hiện và sắp xếp theo thời điểm thao tác của đơn.
- Tài xế: endpoint mới `/tai-xe/orders/all?paginated=true`. Backend tổng hợp
  đơn cá nhân và tin xe bằng `$unionWith`, sort trước khi phân trang/facet.
  Ưu tiên đơn accepted/in_progress và sự cố đang chờ chủ hàng phản hồi.
  Các hàng khác dùng thời gian nghiệp vụ, không dùng ngày xe khởi hành tương
  lai hoặc cập nhật nền để đẩy lên đầu. Lượt ghép tài xế đã hủy giữ snapshot
  riêng, không biến thành chuyến mới được gán cho tài xế khác.
- Loại tin đã xóa/ẩn và tin gắn với đơn đang thực hiện/chờ phản hồi được loại
  khỏi phần tin, tránh lặp. Nhu cầu chưa gán tài xế không xuất hiện như đơn
  cá nhân. Các tab riêng tiếp tục dùng endpoint hiện tại.
- Phân trang 20; số tổng lấy pagination.total từ server, không đếm số hàng
  đang tải. Thay tab trở lại trang 1; mỗi response chỉ cập nhật khi còn thuộc
  lượt đọc hiện tại. Không gọi lại POST/khớp/giữ quỹ từ danh sách.

Cần triển khai backend có route mới trước khi cập nhật website. Không ghép
trang đầu của nhiều endpoint phía trình duyệt để giả thành danh sách đầy đủ.

Kiểm tra: `tests/order-list.test.mjs`, `tests/auth-orders-design.test.mjs` và
backend `tests/web-orders-all.contract.test.js`, dùng DB tạm.
