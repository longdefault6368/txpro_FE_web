export type CommunityDemoRole = 'chu-hang' | 'tai-xe';
export type CommunityCardProfile = {
  id: string; role: CommunityDemoRole; displayName: string; region: string; destination: string;
  introduction: string; specialty: string; demo: true; image: string;
};
/** Fictional display data only: no API, database, ratings, online status or real identities. */
export function getCommunityExamples(role: CommunityDemoRole, language: string): CommunityCardProfile[] {
  const c = (vi: string, en: string, zh: string) => language === 'en' ? en : language === 'zh' ? zh : vi;
  const entries = role === 'chu-hang' ? [
    ['Nội thất An Gia', 'TP. Hồ Chí Minh', 'Đồng Nai', 'cargo_picker_furniture', c('Nội thất & đồ gia dụng', 'Furniture & home goods', '家具与家居用品'), c('Chuyển bàn ghế, tủ và đồ gia dụng. Ưu tiên xe thùng kín, hỗ trợ sắp xếp lịch nhận hàng.', 'Furniture and household transport with a covered truck and flexible pickup planning.', '运输家具及家居用品，优先选择厢式货车并协商取货时间。')],
    ['Nông sản Xanh', 'Lâm Đồng', 'TP. Hồ Chí Minh', 'cargo_picker_produce', c('Rau củ & trái cây', 'Vegetables & fruit', '蔬菜与水果'), c('Kết nối xe vận chuyển nông sản từ vùng trồng đến điểm phân phối, trao đổi rõ điều kiện bảo quản.', 'Produce transport from growing areas to distribution points, with storage needs agreed in advance.', '连接产地与分销点，提前沟通农产品保鲜条件。')],
    ['Thương mại Minh An', 'Hà Nội', 'Hải Phòng', 'cargo_picker_general', c('Hàng tiêu dùng đóng kiện', 'Packaged consumer goods', '包装消费品'), c('Vận chuyển hàng tiêu dùng đóng thùng, phù hợp xe tải trên tuyến liên tỉnh.', 'Boxed consumer goods suited to interprovincial truck transport.', '适合跨省货车运输的成箱消费品。')],
    ['Vật liệu Thành Phát', 'Đà Nẵng', 'Quảng Ngãi', 'cargo_picker_construction', c('Vật liệu xây dựng', 'Building materials', '建筑材料'), c('Tìm phương tiện phù hợp cho vật liệu đóng kiện, chủ động thống nhất tải trọng và giờ giao nhận.', 'Transport for packaged building supplies, with capacity and delivery times agreed ahead.', '运输成包建材，提前确认载重及收发货时间。')],
    ['Điện máy Gia Hưng', 'TP. Hồ Chí Minh', 'Cần Thơ', 'cargo_picker_electronics', c('Điện tử & điện lạnh', 'Electronics & appliances', '电子与家电'), c('Vận chuyển thiết bị điện máy có bao bì, ưu tiên thao tác cẩn thận và phương tiện phù hợp.', 'Careful transport for packaged electronics and appliances using a suitable vehicle.', '使用合适车辆细心运输带包装的电子设备及家电。')],
    ['Xưởng gỗ Tân Phú', 'Hà Nội', 'Bắc Ninh', 'cargo_picker_furniture', c('Sản phẩm gỗ & nội thất', 'Wood products & furniture', '木制品与家具'), c('Kết nối xe chở sản phẩm gỗ hoàn thiện từ xưởng đến điểm giao, kiểm tra kích thước trước khi đặt.', 'Finished wood products from workshop to destination, with dimensions checked before booking.', '将成品木制品从工坊运往交货点，预订前核实尺寸。')],
  ] : [
    ['Nguyễn Minh Anh', 'TP. Hồ Chí Minh', 'Đồng Nai', 'vehicle_picker_truck', c('Xe tải · 2–5 tấn', 'Truck · 2–5 tonnes', '货车 · 2–5吨'), c('Giới thiệu tuyến xe chở hàng gia dụng, nội thất và hàng tiêu dùng. Trao đổi lộ trình trước khi nhận chuyến.', 'Household, furniture and consumer goods transport, with routes agreed before each trip.', '运输家居用品、家具及消费品，接单前沟通路线。')],
    ['Trần Quốc Huy', 'Đà Nẵng', 'Quảng Ngãi', 'vehicle_picker_refrigerated', c('Xe đông lạnh · 5–10 tấn', 'Refrigerated · 5–10 tonnes', '冷藏车 · 5–10吨'), c('Phương tiện dành cho hàng cần bảo quản nhiệt độ. Thống nhất yêu cầu hàng hóa và thời gian nhận trả.', 'Temperature-sensitive goods transport, with cargo requirements and timing agreed ahead.', '运输需温控保存的货物，提前沟通要求及收发时间。')],
    ['Lê Hoàng Nam', 'Hà Nội', 'Ninh Bình', 'vehicle_picker_suv', c('Ô tô · 7 chỗ', 'Car · 7 seats', '汽车 · 7座'), c('Giới thiệu các chuyến đi cá nhân, gia đình và nhóm nhỏ. Chủ động trao đổi điểm đón và lịch trình.', 'Personal, family and small-group journeys, with pickup and itineraries agreed together.', '个人、家庭及小团体出行，可协商接送点和行程。')],
    ['Phạm Tuấn Kiệt', 'Hải Phòng', 'Hà Nội', 'vehicle_picker_container', c('Container · Đầu kéo', 'Container · Tractor unit', '集装箱 · 牵引车'), c('Giới thiệu phương tiện vận chuyển đường dài. Kiểm tra loại hàng, tuyến đường và lịch nhận trước chuyến.', 'Long-distance transport with cargo, route and pickup schedule reviewed before departure.', '长途运输服务，出发前核实货物、路线及取货安排。')],
    ['Võ Đức Long', 'TP. Hồ Chí Minh', 'Cần Thơ', 'vehicle_picker_van', c('Xe van · 1–2 tấn', 'Van · 1–2 tonnes', '厢式货车 · 1–2吨'), c('Phù hợp hàng đóng thùng và nhu cầu giao nhận gọn nhẹ. Trao đổi trước về khối lượng và điểm dừng.', 'Boxed goods and compact deliveries, with weight and stops agreed in advance.', '适合成箱货物及轻便配送，提前沟通重量与停靠点。')],
    ['Đặng Thanh Tùng', 'Đồng Nai', 'TP. Hồ Chí Minh', 'vehicle_picker_crane', c('Xe cẩu tự hành', 'Truck-mounted crane', '随车起重机'), c('Giới thiệu phương tiện cho thiết bị và hàng cần nâng hạ. Khảo sát điều kiện tiếp cận trước khi chốt lịch.', 'Equipment transport and lifting needs, with access conditions reviewed before scheduling.', '设备运输及吊装需求，预约前确认现场通行条件。')],
  ];
  return entries.map(([displayName, region, destination, asset, specialty, introduction], index) => ({
    id: 'demo-' + role + '-' + index, role, displayName, region, destination, specialty, introduction,
    demo: true, image: '/images/catalog/' + asset + '.webp',
  }));
}
