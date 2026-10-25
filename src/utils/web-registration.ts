export function createRegistrationClient(base: string, send: typeof fetch = fetch) {
  return async function request<T>(path: '/auth/register-otp' | '/auth/verify-otp' | '/auth/resend-otp', payload: unknown): Promise<T> {
    let response: Response;
    try { response = await send(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(25000) }); }
    catch { throw new Error('Chưa xác định được kết quả. Kiểm tra kết nối; nếu đã xác thực, hãy thử đăng nhập. Hệ thống chưa tự xác nhận thành công.'); }
    const body = await response.json().catch(() => null);
    if (!response.ok || !body || body.success === false) throw new Error(body?.message || 'Chưa thực hiện được yêu cầu. Vui lòng thử lại sau.');
    return body.data as T;
  };
}
type RegistrationResult = { user?: { id?: string; _id?: string; name?: string; fullName?: string; role?: string }; tokens?: { accessToken?: string; refreshToken?: string } };
export function commitRegistrationSession(storage: Storage, result: RegistrationResult, expectedSession: string | null) {
  if (storage.getItem('txpro_user_session') !== expectedSession) throw new Error('Tài khoản đang dùng đã thay đổi. Vui lòng đăng nhập lại.');
  const user = result?.user, tokens = result?.tokens;
  if (!user || !['tai-xe', 'chu-hang'].includes(user.role || '') || !(user.id || user._id) || !tokens?.accessToken || !tokens?.refreshToken) throw new Error('Tài khoản đã xác thực nhưng chưa đủ thông tin phiên đăng nhập. Vui lòng đăng nhập để tiếp tục.');
  try {
    storage.setItem('txpro_token', tokens.accessToken); storage.setItem('txpro_refresh_token', tokens.refreshToken);
    storage.setItem('txpro_user_session', JSON.stringify({ id: user.id || user._id, name: user.fullName || user.name || 'TXE PRO', role: user.role === 'tai-xe' ? 'Tài Xế' : 'Chủ Hàng', rawRole: user.role, sessionStartedAt: new Date().toISOString() }));
  } catch {
    for (const key of ['txpro_token', 'txpro_refresh_token', 'txpro_user_session']) { try { storage.removeItem(key); } catch { /* Storage unavailable. */ } }
    throw new Error('Không lưu được phiên đăng nhập. Vui lòng đăng nhập lại.');
  }
  return user.role === 'tai-xe' ? '/tai-xe/phuong-tien' : '/chu-hang/form-tao-don';
}
