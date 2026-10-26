export type AccountProfile = {
 id?: string; _id?: string; name?: string; fullName?: string; phone?: string; email?: string; avatar?: string;
 role: string; language?: string; isPhoneVerified?: boolean; isEmailVerified?: boolean; isActive?: boolean;
 kycStatus?: string; referralCode?: string; createdAt?: string;
 accountRestriction?: { status?: string; reason?: string; restrictedUntil?: string; permanent?: boolean } | null;
};
export type AccountWallet = {
 mainBalance?: number; availableBalance?: number; lockedBalance?: number; guaranteeAvailableBalance?: number;
 promoBalance?: number; promoAvailableBalance?: number; promoPendingBalance?: number; promoReleaseDays?: number; promoNextReleaseAt?: string;
};
export const accountMoney = (value?: number | null) => typeof value === "number" && Number.isFinite(value) && value >= 0
 ? value.toLocaleString("vi-VN") + " đ" : "Chưa có dữ liệu";
export function accountDate(value?: string | null) {
 const date = value ? new Date(value) : null;
 return date && Number.isFinite(date.getTime()) ? date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa có dữ liệu";
}
export const accountKycLabel = (status?: string) => ({ verified: "Đã xác minh", pending: "Chờ duyệt", pending_review: "Đang xét duyệt", rejected: "Cần bổ sung hồ sơ", draft: "Chưa hoàn tất", missing_documents: "Thiếu giấy tờ" }[status || ""] || "Chưa có kết quả xác minh");
export type AccountAction = "name" | "email" | "phone" | "password";
export type AccountChallenge = { destination?: string; challengeId?: string; resendAfterSeconds?: number; verificationToken?: string; expiresAt?: string };
export function accountActionRequest(action: AccountAction, value: string, verificationToken?: string) {
 if (action === "name") {
  const name = value.trim().replace(/ +/g, " ");
  if (name.length < 2 || name.length > 100 || /[<>\x00-\x1f\x7f]/.test(name)) throw new Error("Họ tên cần từ 2 đến 100 ký tự hợp lệ.");
  return { path: "/auth/profile/name-otp", body: { name } };
 }
 if (action === "email") {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Vui lòng nhập email hợp lệ. Email chỉ thay đổi sau khi xác minh.");
  return { path: "/auth/profile/email-otp", body: { email } };
 }
 if (action === "phone") {
  if (verificationToken && !/^(?:0|\+?84)\d{9}$/.test(value.trim())) throw new Error("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
  return { path: "/auth/profile/phone-otp", body: verificationToken ? { step: "new", phone: value.trim(), verificationToken } : { step: "current" } };
 }
 return { path: "/auth/profile/password-otp", body: {} };
}
export function accountActionVerification(action: AccountAction, value: string, otp: string, challenge: AccountChallenge, passwords?: { currentPassword: string; newPassword: string; confirmPassword: string }) {
 if (!/^\d{6}$/.test(otp)) throw new Error("Vui lòng nhập mã OTP gồm 6 số.");
 if (action === "email") {
  if (!challenge.challengeId || !challenge.destination || challenge.destination.toLowerCase() !== value.trim().toLowerCase()) throw new Error("Phiên xác minh email không còn hợp lệ. Vui lòng gửi lại mã.");
  return { path: "/auth/profile/email-verify", body: { email: challenge.destination, challengeId: challenge.challengeId, otp } };
 }
 if (action === "name") return { path: "/auth/profile/name-verify", body: { name: value.trim().replace(/ +/g, " "), otp } };
 if (action === "phone") return { path: "/auth/profile/phone-verify", body: challenge.verificationToken ? { step: "new", phone: value.trim(), verificationToken: challenge.verificationToken, otp } : { step: "current", otp } };
 if (!passwords?.currentPassword || passwords.newPassword.length < 6 || passwords.newPassword.length > 128 || passwords.newPassword !== passwords.confirmPassword) throw new Error("Nhập mật khẩu hiện tại và xác nhận mật khẩu mới từ 6 đến 128 ký tự.");
 return { path: "/auth/profile/password-change", body: { otp, currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } };
}
