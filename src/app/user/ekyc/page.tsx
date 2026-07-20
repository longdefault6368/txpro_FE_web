"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  FileCheck2,
  IdCard,
  ImagePlus,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { API_BASE, API_BASE_URL, fetchWithAuth } from "@/utils/api";

type UserRole = "tai-xe" | "chu-hang" | "admin";
type KycDocumentType = "cccdFront" | "cccdBack" | "portrait";

interface ProfileData {
  role?: string;
  kycStatus?: string;
  fullName?: string;
  name?: string;
}

interface KycIdentity {
  fullName?: string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  issuePlace?: string | null;
  nationality?: string | null;
}

interface KycSubmission {
  id: string;
  status?: string;
  verificationEligibility?: string;
  identity?: KycIdentity;
  documents?: Partial<Record<KycDocumentType, { previewUrl?: string; originalName?: string; mimeType?: string }>>;
  ocr?: {
    status?: string;
    overallConfidence?: number;
    providerErrorCode?: string | null;
    providerErrorMessage?: string | null;
  };
  review?: {
    rejectionReason?: string | null;
    reviewedAt?: string | null;
  };
}

type FileState = Partial<Record<KycDocumentType, File>>;
type PreviewState = Partial<Record<KycDocumentType, string>>;

const roleLabels: Record<string, string> = {
  "tai-xe": "Tài xế",
  driver: "Tài xế",
  "chu-hang": "Chủ hàng",
  shipper: "Chủ hàng",
  admin: "Quản trị viên",
};

const kycLabels: Record<string, string> = {
  draft: "Chưa hoàn tất",
  submitted: "Đã gửi",
  auto_verified: "Tự động xác minh",
  manual_review: "Chờ duyệt thủ công",
  pending_review: "Đang xét duyệt",
  verified: "Đã xác minh",
  rejected: "Bị từ chối",
  missing_documents: "Thiếu giấy tờ",
  not_started: "Chưa bắt đầu",
};

const normalizeRole = (role?: string): UserRole => {
  if (role === "driver") return "tai-xe";
  if (role === "shipper" || role === "customer") return "chu-hang";
  if (role === "admin") return "admin";
  return role === "tai-xe" ? "tai-xe" : "chu-hang";
};

const extractPayload = async <T,>(response: Response): Promise<T | null> => {
  const json = await response.json().catch(() => null);
  return (json?.data ?? json) as T | null;
};

const readErrorMessage = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => null);
  const detail = json?.errors?.[0]?.message || json?.message || json?.error;
  return detail ? String(detail) : fallback;
};

const normalizePreviewUrl = (url?: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const genderLabel = (value?: string | null) => {
  if (value === "male") return "Nam";
  if (value === "female") return "Nữ";
  if (value === "other") return "Khác";
  return value || "Chưa có";
};

const formatConfidence = (value?: number) => {
  if (!Number.isFinite(Number(value))) return "Chưa có";
  return `${Math.round(Number(value) * 100)}%`;
};

export default function UserEkycPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<KycSubmission | null>(null);
  const [latestPreviews, setLatestPreviews] = useState<PreviewState>({});
  const [files, setFiles] = useState<FileState>({});
  const [previews, setPreviews] = useState<PreviewState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizedRole = normalizeRole(profile?.role);
  const isVerified = profile?.kycStatus === "verified" || latestSubmission?.verificationEligibility === "verified";

  const displayName = profile?.fullName || profile?.name || "Người dùng TXEPRO";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [profileRes, submissionRes] = await Promise.all([
          fetchWithAuth(`${API_BASE}/auth/profile`),
          fetchWithAuth(`${API_BASE}/kyc/submissions/latest`).catch(() => null),
        ]);

        if (!profileRes.ok) {
          throw new Error(await readErrorMessage(profileRes, "Không thể tải hồ sơ người dùng."));
        }

        const profilePayload = await extractPayload<{ user?: ProfileData; profile?: ProfileData }>(profileRes);
        const user = profilePayload?.user || profilePayload?.profile || (profilePayload as ProfileData | null);
        setProfile(user || null);

        if (submissionRes?.ok) {
          const submissionPayload = await extractPayload<{ submission?: KycSubmission }>(submissionRes);
          const submission = submissionPayload?.submission || null;
          setLatestSubmission(submission);
          if (submission) await loadDocumentPreviews(submission);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu eKYC.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadDocumentPreviews = async (submission: KycSubmission) => {
    const next: PreviewState = {};
    await Promise.all(
      (["cccdFront", "cccdBack", "portrait"] as KycDocumentType[]).map(async (type) => {
        const previewUrl = normalizePreviewUrl(submission.documents?.[type]?.previewUrl);
        if (!previewUrl) return;
        const response = await fetchWithAuth(previewUrl).catch(() => null);
        if (!response?.ok) return;
        const blob = await response.blob();
        next[type] = URL.createObjectURL(blob);
      }),
    );
    setLatestPreviews(next);
  };

  const handleFileChange = (type: KycDocumentType) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFiles((current) => ({ ...current, [type]: file }));
    setPreviews((current) => {
      if (current[type]) URL.revokeObjectURL(current[type]!);
      return { ...current, [type]: URL.createObjectURL(file) };
    });
    setError("");
    setSuccess("");
  };

  const resetFiles = () => {
    Object.values(previews).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setFiles({});
    setPreviews({});
    setSuccess("");
    setError("");
  };

  const validateFiles = () => {
    if (!files.cccdFront || !files.cccdBack) {
      return "Vui lòng tải đủ mặt trước và mặt sau CCCD.";
    }

    const invalid = Object.values(files).find((file) => file && !file.type.startsWith("image/"));
    if (invalid) return "Giấy tờ cần là file ảnh.";

    const tooLarge = Object.values(files).find((file) => file && file.size > 8 * 1024 * 1024);
    if (tooLarge) return "Mỗi ảnh tối đa 8MB.";

    return "";
  };

  const submitKyc = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateFiles();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (normalizedRole === "admin") {
      setError("Tài khoản admin không cần thực hiện eKYC.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("cccdFront", files.cccdFront!);
      formData.append("cccdBack", files.cccdBack!);
      if (files.portrait) formData.append("portrait", files.portrait);

      const uploadRes = await fetchWithAuth(`${API_BASE}/kyc/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error(await readErrorMessage(uploadRes, "Không thể tải giấy tờ lên máy chủ."));
      }
      const uploadPayload = await extractPayload<{ documents?: Record<string, unknown> }>(uploadRes);
      const documents = uploadPayload?.documents;
      if (!documents) throw new Error("Máy chủ không trả về thông tin giấy tờ đã tải lên.");

      const extractRes = await fetchWithAuth(`${API_BASE}/kyc/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: normalizedRole, documents }),
      });
      if (!extractRes.ok) {
        throw new Error(await readErrorMessage(extractRes, "VNPT không thể đọc thông tin giấy tờ."));
      }
      const extractedPayload = await extractPayload<{
        submission?: { id?: string; status?: string };
        identity?: KycIdentity;
        ocr?: KycSubmission["ocr"];
      }>(extractRes);
      const submissionId = extractedPayload?.submission?.id;
      const identity = extractedPayload?.identity;
      if (!submissionId || !identity) {
        throw new Error("Không thể đọc kết quả OCR từ VNPT.");
      }
      if (extractedPayload?.ocr?.status === "failed") {
        throw new Error(extractedPayload.ocr.providerErrorMessage || extractedPayload.ocr.providerErrorCode || "Ảnh đầu vào không hợp lệ.");
      }

      const submitRes = await fetchWithAuth(`${API_BASE}/kyc/submissions/${submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity }),
      });
      if (!submitRes.ok) {
        throw new Error(await readErrorMessage(submitRes, "Không thể gửi hồ sơ KYC."));
      }

      const submitPayload = await extractPayload<{ submission?: KycSubmission }>(submitRes);
      const submission = submitPayload?.submission || null;
      setLatestSubmission(submission);
      if (submission) await loadDocumentPreviews(submission);
      setProfile((current) => current ? { ...current, kycStatus: submission?.verificationEligibility === "verified" ? "verified" : "pending_review" } : current);
      resetFiles();
      setSuccess("Hồ sơ eKYC đã được gửi. Hệ thống sẽ tự xác minh hoặc chuyển admin duyệt nếu cần.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể gửi hồ sơ eKYC.";
      setError(
        /image|ocr|cccd|document|idg-/i.test(message)
          ? `${message}\nVui lòng chụp lại CCCD rõ nét, đủ 4 góc, không lóa sáng và không bị mất mép.`
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const identityRows = useMemo(() => {
    const identity = latestSubmission?.identity;
    return [
      ["Họ và tên", identity?.fullName],
      ["Số CCCD", identity?.idNumber],
      ["Ngày sinh", identity?.dateOfBirth],
      ["Giới tính", genderLabel(identity?.gender)],
      ["Địa chỉ", identity?.permanentAddress || identity?.currentAddress],
      ["Ngày cấp", identity?.issueDate],
      ["Ngày hết hạn", identity?.expiryDate],
      ["Nơi cấp", identity?.issuePlace],
    ].filter(([, value]) => value && value !== "Chưa có");
  }, [latestSubmission]);

  const statusLabel = kycLabels[latestSubmission?.verificationEligibility || latestSubmission?.status || profile?.kycStatus || "not_started"] || "Chưa bắt đầu";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link href="/user?tab=profile" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Quay lại hồ sơ
          </Link>

          <section className="mt-6 border-b border-slate-200 pb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  <ShieldCheck className="h-4 w-4 text-primary-600" />
                  {roleLabels[normalizedRole] || "Người dùng"} · {displayName}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Xác minh giấy tờ VNPT eKYC</h1>
                <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                  Tải ảnh CCCD mặt trước, mặt sau và ảnh chân dung. Web sẽ gọi cùng flow với mobile: upload giấy tờ, OCR qua VNPT, sau đó gửi hồ sơ xét duyệt.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold ${isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {isVerified ? <BadgeCheck className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
                {statusLabel}
              </div>
            </div>
          </section>

          {loading ? (
            <div className="mt-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải hồ sơ eKYC...
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {isVerified ? (
                <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-950">Tài khoản đã xác minh</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    Hồ sơ eKYC của bạn đã được xác minh thành công. Bạn không cần gửi lại giấy tờ, phần bên phải là thông tin đã được lưu từ hồ sơ mới nhất.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/user?tab=profile")}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
                  >
                    Về hồ sơ
                  </button>
                </section>
              ) : (
                <form onSubmit={submitKyc} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">Giấy tờ cần xác minh</h2>
                      <p className="mt-1 text-sm text-slate-500">Ảnh rõ nét, đủ 4 góc, không bị lóa hoặc mất mép.</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetFiles}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <RefreshCcw className="h-4 w-4" /> Làm lại
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <UploadTile
                      type="cccdFront"
                      title="Mặt trước CCCD"
                      required
                      file={files.cccdFront}
                      preview={previews.cccdFront}
                      icon={<IdCard className="h-5 w-5" />}
                      onChange={handleFileChange("cccdFront")}
                    />
                    <UploadTile
                      type="cccdBack"
                      title="Mặt sau CCCD"
                      required
                      file={files.cccdBack}
                      preview={previews.cccdBack}
                      icon={<FileCheck2 className="h-5 w-5" />}
                      onChange={handleFileChange("cccdBack")}
                    />
                    <div className="sm:col-span-2">
                      <UploadTile
                        type="portrait"
                        title="Ảnh chân dung"
                        file={files.portrait}
                        preview={previews.portrait}
                        icon={<UserRound className="h-5 w-5" />}
                        onChange={handleFileChange("portrait")}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-5 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                      <AlertCircle className="mr-2 inline h-4 w-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                      <Check className="mr-2 inline h-4 w-4" />
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || normalizedRole === "admin"}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {submitting ? "Đang gửi hồ sơ..." : "Xác minh giấy tờ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/user?tab=profile")}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Về hồ sơ
                  </button>
                </form>
              )}

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">Hồ sơ mới nhất</h2>
                  <div className="mt-4 grid gap-3 text-sm">
                    <InfoLine label="Trạng thái" value={statusLabel} />
                    <InfoLine label="Độ tin cậy OCR" value={formatConfidence(latestSubmission?.ocr?.overallConfidence)} />
                    <InfoLine label="Lý do từ chối" value={latestSubmission?.review?.rejectionReason || "Không có"} />
                  </div>

                  {identityRows.length > 0 ? (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <h3 className="text-sm font-bold text-slate-950">Thông tin OCR</h3>
                      <div className="mt-3 grid gap-3">
                        {identityRows.map(([label, value]) => (
                          <InfoLine key={String(label)} label={String(label)} value={String(value)} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">Chưa có dữ liệu OCR để hiển thị.</p>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">Ảnh đã gửi</h2>
                  <div className="mt-4 grid gap-3">
                    <PreviewCard title="Mặt trước CCCD" preview={latestPreviews.cccdFront} />
                    <PreviewCard title="Mặt sau CCCD" preview={latestPreviews.cccdBack} />
                    <PreviewCard title="Chân dung" preview={latestPreviews.portrait} />
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function UploadTile({
  type,
  title,
  required,
  file,
  preview,
  icon,
  onChange,
}: {
  type: KycDocumentType;
  title: string;
  required?: boolean;
  file?: File;
  preview?: string;
  icon: React.ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-primary-500 hover:bg-primary-50/40">
      <input
        type="file"
        accept="image/*"
        capture={type === "portrait" ? "user" : "environment"}
        className="sr-only"
        onChange={onChange}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary-600 ring-1 ring-slate-200">{icon}</span>
          {title}
          {required && <span className="text-red-500">*</span>}
        </div>
        <Camera className="h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-4 flex min-h-44 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={title} className="h-full max-h-64 w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImagePlus className="h-9 w-9" />
            <span className="text-xs font-bold">Chọn hoặc chụp ảnh</span>
          </div>
        )}
      </div>
      <p className="mt-3 truncate text-xs font-semibold text-slate-500">{file?.name || "JPG, PNG, tối đa 8MB"}</p>
    </label>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">{value || "Chưa có"}</p>
    </div>
  );
}

function PreviewCard({ title, preview }: { title: string; preview?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <div className="mt-2 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-white">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={title} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs font-semibold text-slate-400">Chưa có ảnh</span>
        )}
      </div>
    </div>
  );
}
