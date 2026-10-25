import { NextResponse } from 'next/server';
import { API_BASE } from '@/config/env';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code')?.trim().toUpperCase() || '';
  if (!/^ORD-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code) || code.length > 100) return NextResponse.json({ error: 'Mã đơn không hợp lệ.' }, { status: 400 });
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'Vui lòng đăng nhập để xem đơn thuộc tài khoản của bạn.' }, { status: 401 });
  try {
    const response = await fetch(API_BASE + '/common/orders/by-code/' + encodeURIComponent(code) + '/tracking', { headers: { Authorization: authorization }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.data) return NextResponse.json({ error: body?.message || 'Không tải được dữ liệu đơn từ hệ thống.' }, { status: response.ok ? 502 : response.status });
    return NextResponse.json(body.data, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Chưa kết nối được hệ thống. Vui lòng thử lại.' }, { status: 502 }); }
}
