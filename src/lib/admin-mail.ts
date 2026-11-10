export type MailAudience = "customer" | "applicant";

export type MailPurpose = { id: string; label: string };

export const CUSTOMER_PURPOSES: MailPurpose[] = [
  { id: "reply", label: "Phản hồi liên hệ" },
  { id: "received", label: "Xác nhận đã nhận yêu cầu" },
  { id: "processing", label: "Đang xử lý yêu cầu" },
  { id: "done", label: "Đã xử lý xong" },
  { id: "intro", label: "Giới thiệu dịch vụ" },
  { id: "offer", label: "Thông báo ưu đãi" },
  { id: "manual", label: "Nhập tiêu đề riêng" },
];

export const APPLICANT_PURPOSES: MailPurpose[] = [
  { id: "received", label: "Xác nhận đã nhận hồ sơ" },
  { id: "interview", label: "Mời phỏng vấn" },
  { id: "accepted", label: "Thông báo trúng tuyển" },
  { id: "rejected", label: "Từ chối hồ sơ" },
  { id: "unsuitable", label: "Hồ sơ chưa phù hợp" },
  { id: "manual", label: "Nhập tiêu đề riêng" },
];

const roleName = (role?: string) => (role || "").replace(/^Tuyển dụng:\s*/, "").trim();

const customerLetter = (name: string, paragraphs: string[]) => [
  `Kính gửi anh/chị ${name},`,
  ...paragraphs,
  "Trân trọng,\nBộ phận Chăm sóc khách hàng\nTXE PRO",
].join("\n\n");

const applicantLetter = (name: string, paragraphs: string[]) => [
  `Kính gửi anh/chị ${name},`,
  ...paragraphs,
  "Trân trọng,\nBộ phận Tuyển dụng\nTXE PRO",
].join("\n\n");

export function customerMail(purposeId: string, name: string, topic: string) {
  const person = name.trim() || "{{name}}";
  const about = (topic.trim() || "yêu cầu của anh/chị").slice(0, 120);
  if (purposeId === "received") {
    return {
      subject: "TXE PRO đã nhận yêu cầu của anh/chị",
      body: customerLetter(person, [
        `TXE PRO xác nhận đã nhận yêu cầu liên quan đến "${about}".`,
        "Đội ngũ phụ trách sẽ xem xét và phản hồi trong thời gian sớm nhất. Anh/chị không cần gửi lại thông tin này.",
      ]),
    };
  }
  if (purposeId === "processing") {
    return {
      subject: "TXE PRO đang xử lý yêu cầu của anh/chị",
      body: customerLetter(person, [
        `Yêu cầu "${about}" đang được TXE PRO xử lý.`,
        "Chúng tôi sẽ gửi kết quả qua email này ngay khi có thông tin chính thức. Nếu cần bổ sung, anh/chị vui lòng trả lời trực tiếp thư.",
      ]),
    };
  }
  if (purposeId === "done") {
    return {
      subject: "TXE PRO đã xử lý yêu cầu của anh/chị",
      body: customerLetter(person, [
        `TXE PRO đã xử lý xong yêu cầu "${about}".`,
        "Nếu kết quả chưa đúng với nhu cầu hoặc anh/chị cần hỗ trợ thêm, vui lòng trả lời email này. Chúng tôi sẵn sàng tiếp tục kiểm tra.",
      ]),
    };
  }
  if (purposeId === "intro") {
    return {
      subject: "TXE PRO giới thiệu dịch vụ vận tải",
      body: customerLetter(person, [
        "TXE PRO là nền tảng đang vận hành, kết nối chủ hàng và tài xế để đăng tin, nhận chuyến và theo dõi hành trình.",
        "Anh/chị có thể tìm xe, đăng xe trống, ghép chuyến và theo dõi đơn ngay trên ứng dụng. Nếu cần được hướng dẫn, hãy trả lời email này.",
      ]),
    };
  }
  if (purposeId === "offer") {
    return {
      subject: "TXE PRO thông báo chương trình ưu đãi",
      body: customerLetter(person, [
        "TXE PRO gửi anh/chị thông tin chương trình ưu đãi dành cho khách hàng đang sử dụng nền tảng.",
        "Chi tiết chương trình được trình bày bên dưới. Anh/chị trả lời email này nếu cần được tư vấn thêm.",
      ]),
    };
  }
  if (purposeId === "manual") {
    return { subject: "", body: customerLetter(person, ["Nội dung gửi anh/chị được trình bày tại đây."]) };
  }
  return {
    subject: `TXE PRO phản hồi: ${about}`,
    body: customerLetter(person, [
      `Cảm ơn anh/chị đã liên hệ TXE PRO về nội dung "${about}".`,
      "Chúng tôi đã ghi nhận và xin phản hồi như sau. Anh/chị có thể trả lời trực tiếp email này nếu cần bổ sung thông tin.",
    ]),
  };
}

export function applicantMail(purposeId: string, name: string, role?: string) {
  const person = name.trim() || "{{name}}";
  const job = roleName(role) ? `vị trí ${roleName(role)}` : "vị trí đang tuyển";
  if (purposeId === "interview") {
    return {
      subject: `TXE PRO mời phỏng vấn ${job}`,
      body: applicantLetter(person, [
        `TXE PRO trân trọng mời anh/chị tham gia buổi phỏng vấn cho ${job}.`,
        "Anh/chị vui lòng phản hồi email này để thống nhất thời gian phù hợp. Thông tin chi tiết sẽ được gửi sau khi có xác nhận.",
      ]),
    };
  }
  if (purposeId === "accepted") {
    return {
      subject: `TXE PRO thông báo trúng tuyển ${job}`,
      body: applicantLetter(person, [
        `TXE PRO trân trọng thông báo anh/chị đã được nhận cho ${job}.`,
        "Chúng tôi sẽ liên hệ trong thời gian sớm nhất để thống nhất các bước tiếp theo. Cảm ơn anh/chị đã tin tưởng TXE PRO.",
      ]),
    };
  }
  if (purposeId === "rejected") {
    return {
      subject: `TXE PRO thông báo kết quả hồ sơ ${job}`,
      body: applicantLetter(person, [
        `Cảm ơn anh/chị đã dành thời gian ứng tuyển ${job} tại TXE PRO.`,
        "Sau khi xem xét, chúng tôi chưa thể tiếp tục với hồ sơ này ở thời điểm hiện tại. TXE PRO ghi nhận sự quan tâm của anh/chị và mong có cơ hội phù hợp hơn trong tương lai.",
      ]),
    };
  }
  if (purposeId === "unsuitable") {
    return {
      subject: `TXE PRO thông báo hồ sơ chưa phù hợp ${job}`,
      body: applicantLetter(person, [
        `Cảm ơn anh/chị đã gửi hồ sơ ứng tuyển ${job}.`,
        "Sau quá trình xem xét, hồ sơ hiện chưa đáp ứng đủ yêu cầu của vị trí. Chúng tôi sẽ lưu thông tin và liên hệ khi có cơ hội phù hợp hơn.",
      ]),
    };
  }
  if (purposeId === "manual") {
    return { subject: "", body: applicantLetter(person, ["Nội dung gửi anh/chị được trình bày tại đây."]) };
  }
  return {
    subject: `TXE PRO đã nhận hồ sơ ${job}`,
    body: applicantLetter(person, [
      `TXE PRO xác nhận đã nhận hồ sơ ứng tuyển ${job}.`,
      "Chúng tôi cảm ơn anh/chị đã quan tâm đến cơ hội làm việc tại TXE PRO. Hồ sơ sẽ được xem xét cẩn thận và kết quả sẽ được gửi qua email này.",
    ]),
  };
}

export function defaultApplicantPurpose(status: string) {
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "rejected";
  if (status === "unsuitable" || status === "spam") return "unsuitable";
  return "received";
}
