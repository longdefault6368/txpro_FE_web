# Xác minh tài xế và phương tiện trước khi đăng trên web

- Tài xế hoàn tất xác minh danh tính, đăng ký và cập nhật giấy tờ phương tiện trong ứng dụng TXE PRO.
- Website `/tai-xe/dang-tin` đọc `/auth/me`, rồi `/common/kyc-status`. Chỉ khi backend cho phép mới đọc danh sách xe. Thiếu trạng thái xác minh không được coi là đã xác minh.
- Chỉ xe `active` được chọn để đăng tin, theo điều kiện hiện có của backend. Không đặt thêm tiêu chí OCR riêng cho dữ liệu xe cũ.
- Chưa xác minh hoặc chưa có xe hoạt động: hiển thị hướng dẫn trên app và liên kết Google Play/App Store; không mở biểu mẫu đăng tin.
- `/tai-xe/phuong-tien` hiển thị danh sách từ cùng backend, hướng dẫn thêm/chỉnh sửa xe trên app; không gửi yêu cầu tạo/sửa/xóa xe trên web.
- `/user/ekyc` của vai trò tài xế hiển thị trạng thái và hướng dẫn trên app, không mở biểu mẫu tải giấy tờ. Luồng eKYC tùy chọn của chủ hàng giữ nguyên.
- Nếu không đọc được kết quả xác minh, hiển thị chưa kiểm tra được trạng thái và cho cập nhật lại. Không giữ nhãn xác minh thành công từ lần đọc cũ hoặc tự kết luận tài khoản chưa đăng nhập.
- Chủ hàng mở đường dẫn quản lý xe sẽ được chọn chuyển vai trò, không bị bắt xác minh tài xế hoặc tải app khi vẫn dùng vai trò chủ hàng. Quản trị viên vẫn quản lý và xét duyệt hồ sơ trong admin như trước.
- Khi quay lại tab hoặc bấm **Tôi đã hoàn tất, cập nhật trạng thái**, website kiểm tra lại backend. Không cần đăng xuất/đăng nhập lại. Tin từ form trang chủ chỉ được khôi phục sau khi đủ điều kiện, không tự đăng tin.
- Quy trình kiểm tra quyền lợi, yêu cầu đồng ý và tạo tin vẫn do backend quyết định. Nếu backend từ chối KYC khi đăng, website quay về hướng dẫn xác minh.

## Cấu hình và kiểm tra

Link tải app lấy từ `googlePlayUrl` và `appStoreUrl` trong cấu hình thông tin công ty tại admin. Link chưa được cấu hình hoặc không hợp lệ sẽ dẫn tới hỗ trợ tải app, không dẫn tới một ứng dụng khác.

Ứng dụng di động và website cần trỏ về cùng backend/môi trường dữ liệu để dùng chung kết quả xác minh.

```powershell
npm run test:driver-access
npm run test:onboarding
npm run test:posting
npm run test:posting:ui
npx tsc --noEmit
npm run build
```

Kiểm tra thực tế sau triển khai: dùng cùng tài khoản tài xế trên app và website, xác minh trên app rồi cập nhật trang web; thêm xe trên app rồi kiểm tra xe xuất hiện và đăng tin được. Đây là thay đổi giao diện website, không sửa API hoặc logic ứng dụng Flutter.
