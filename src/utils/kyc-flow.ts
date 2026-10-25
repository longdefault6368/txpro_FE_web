export type KycFileKey = 'cccdFront' | 'cccdBack' | 'portrait';
export type KycFiles = Partial<Record<KycFileKey, File>>;
export type KycIdentity = Record<string, string | null>;
export type KycSubmission = { id: string; status: string; verificationEligibility: string; identity?: KycIdentity; documents?: Partial<Record<KycFileKey, { previewUrl?: string }>>; review?: { rejectionReason?: string }; ocr?: { status?: string; providerErrorMessage?: string } };
type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
export function validateKycFiles(files: KycFiles) {
  if (!files.cccdFront || !files.cccdBack || !files.portrait) throw new Error('Cần đủ mặt trước, mặt sau CCCD và ảnh chân dung.');
  if (Object.values(files).some(file => !['image/jpeg', 'image/png'].includes(file.type) || file.size <= 0 || file.size > 8 * 1024 * 1024)) throw new Error('Chọn ảnh JPG hoặc PNG, tối đa 8 MB mỗi ảnh.');
}
export function createKycFlow(request: Request, key: string) {
  let documents: unknown = null;
  let extraction: { submission: { id: string }; identity: KycIdentity; ocr?: { status?: string; providerErrorMessage?: string } } | null = null;
  let busy = false;
  return {
    async run(files: KycFiles, role: 'tai-xe' | 'chu-hang', draft?: KycSubmission | null): Promise<KycSubmission> {
      if (busy) throw new Error('Hồ sơ đang được xử lý.');
      busy = true;
      try {
        if (!extraction && draft?.status === 'draft' && draft.identity) extraction = { submission: { id: draft.id }, identity: draft.identity };
        if (!extraction) {
          validateKycFiles(files);
          if (!documents) {
            const body = new FormData();
            for (const field of ['cccdFront', 'cccdBack', 'portrait'] as const) body.append(field, files[field]!);
            const uploaded = await request<{ documents: unknown }>('/kyc/upload', { method: 'POST', body });
            if (!uploaded?.documents) throw new Error('Máy chủ chưa trả đủ giấy tờ đã tải.');
            documents = uploaded.documents;
          }
          extraction = await request('/kyc/extract', { method: 'POST', body: JSON.stringify({ role, documents, idempotencyKey: key }) });
        }
        if (!extraction?.submission?.id || !extraction.identity) throw new Error('Chưa nhận đủ kết quả xác minh. Hãy kiểm tra lại hồ sơ.');
        if (extraction.ocr?.status === 'failed') throw new Error(extraction.ocr.providerErrorMessage || 'Không đọc được giấy tờ. Vui lòng chụp lại ảnh rõ nét.');
        const id = extraction.submission.id;
        if (!/^[a-f0-9]{24}$/i.test(id)) throw new Error('Mã hồ sơ không hợp lệ.');
        // Recover a prior successful submit before issuing another mutation.
        const existing = await request<{ submission: KycSubmission }>('/kyc/submissions/' + id);
        if (existing?.submission?.status && existing.submission.status !== 'draft') return existing.submission;
        const result = await request<{ submission: KycSubmission }>('/kyc/submissions/' + id + '/submit', { method: 'POST', body: JSON.stringify({ identity: extraction.identity }) });
        if (!result?.submission?.id || !result.submission.verificationEligibility) throw new Error('Chưa nhận đủ trạng thái hồ sơ. Kiểm tra lại trước khi gửi tiếp.');
        return result.submission;
      } finally { busy = false; }
    },
  };
}
