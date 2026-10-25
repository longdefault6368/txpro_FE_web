export const orderStatusLabel = (status: string) => ({
  searching_driver: "Đang tìm xe", waiting_driver: "Đang tìm xe", waiting_driver_acceptance: "Chờ tài xế xác nhận",
  pending: "Chờ xác nhận", accepted: "Tài xế đã nhận đơn", driver_accepted: "Tài xế đã nhận đơn",
  heading_to_pickup: "Đang đến điểm nhận", driver_arrived_pickup: "Đã tới điểm nhận",
  in_progress: "Đang thực hiện", rejected: "Đã từ chối", expired: "Đã hết hạn", draft: "Bản nháp",
  arrived_pickup: "Đã tới điểm nhận", picked_up: "Đã bắt đầu chuyến", in_transit: "Đang đến điểm trả",
  arrived_dropoff: "Đã tới điểm trả", driver_arrived_dropoff: "Đã tới điểm trả",
  delivered: "Chờ xác nhận hoàn thành", completed: "Hoàn thành", cancelled: "Đã hủy",
  incident_reported: "Đang chờ phản hồi sự cố", incident: "Đang giải quyết sự cố", disputed: "Đang giải quyết sự cố",
  active: "Đang mở", paused: "Tạm dừng", scheduled: "Đã lên lịch", full: "Đã đủ chuyến",
}[status] || "Đang cập nhật");
