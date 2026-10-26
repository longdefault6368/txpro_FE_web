// Editorial examples only; these are not submitted or verified customer reviews.
export function getHomeReviewExamples(language = "vi") {
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  return [
    { id: "furniture", role: "shipper", context: c("Nội thất & đồ gia dụng", "Furniture & household goods", "家具与家居用品"),
      quote: c("Tôi thường chụp sẵn đồ cần chuyển rồi ghi rõ lối vào. Xem từng tin xe và trao đổi trước giúp tôi biết mình cần chuẩn bị gì cho buổi nhận hàng.", "I prepare cargo photos and access details first. Comparing vehicle listings and talking beforehand helps me know what to arrange for pickup.", "我会先拍好货物并说明入口。比较车辆信息、提前沟通后，取货准备就更清楚了。") },
    { id: "availability", role: "driver", context: c("Xe tải & lịch nhận chuyến", "Truck availability", "货车接单安排"),
      quote: c("Điều tôi quan tâm là đúng xe, đúng giờ có thể nhận. Khi thông tin hàng và lịch hẹn rõ ràng, tôi dễ đối chiếu với kế hoạch xe của mình hơn.", "The right vehicle and a workable pickup time matter to me. Clear cargo details and timing make it easier to compare a request with my schedule.", "我最关心车型和可接货时间。货物、时间说明清楚，就更容易核对自己的车辆安排。") },
    { id: "shop", role: "shipper", context: c("Cửa hàng & hàng tiêu dùng", "Retail deliveries", "店铺与日用品"),
      quote: c("Tôi thích kiểm tra lại điểm nhận, điểm trả và ghi chú ngay trong đơn. Những thông tin nhỏ như cổng kho hay giờ người nhận có mặt rất cần cho việc phối hợp.", "I like checking pickup, destination and notes together. Small details such as the warehouse gate and receiver availability help everyone coordinate.", "我会一起核对起终点和备注。仓库入口、收货人在场时间这些小细节，对配合很有帮助。") },
    { id: "tracking", role: "shipper", context: c("Theo dõi hành trình", "Following a journey", "查看行程"),
      quote: c("Khi chờ giao hàng, tôi xem cả trạng thái đơn lẫn thời gian cập nhật vị trí. Biết đang ở bước nào giúp tôi chủ động báo lại cho người nhận.", "While waiting for delivery, I check both the trip status and location timestamp. Knowing the current step helps me keep the receiver informed.", "等待送达时，我会同时看订单状态和位置更新时间。知道进行到哪一步，就能提前通知收货人。") },
    { id: "fleet", role: "driver", context: c("Quản lý nhiều phương tiện", "Managing several vehicles", "管理多辆车"),
      quote: c("Có nhiều xe thì biển số và lịch nhận phải thật rõ. Tôi luôn mở lại tin để kiểm tra phương tiện trước khi phản hồi một yêu cầu mới.", "With several vehicles, plate numbers and availability need to stay clear. I reopen a listing to check the vehicle before responding to a new request.", "有多辆车时，车牌和接单时间必须清楚。我会重新检查车辆信息，再回复新的需求。") },
    { id: "handover", role: "shipper", context: c("Chuẩn bị giao nhận", "Preparing a handover", "交接准备"),
      quote: c("Chuẩn bị danh sách kiện và ảnh từ trước giúp cuộc trao đổi gọn hơn. Tôi muốn các bước giao nhận rõ ràng để hai bên kiểm tra cùng một thông tin.", "Preparing a package list and photos makes the discussion simpler. Clear handover steps help both sides check the same details.", "提前准备件数清单和照片，沟通会更简洁。交接步骤清楚，双方就能核对同一份信息。") },
  ].map(item => ({ ...item, isExample: true as const }));
}
