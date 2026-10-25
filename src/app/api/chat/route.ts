import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_KEY = process.env.CHAT_API_KEY || "";
const BASE_URL = process.env.CHAT_API_BASE_URL || "";
const MODEL = process.env.CHAT_MODEL || "";

export async function POST(req: Request) {
  if (!API_KEY || !BASE_URL || !MODEL) return NextResponse.json({ error: "Trợ lý chưa được cấu hình. Vui lòng sử dụng trang Liên hệ." }, { status: 503 });
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length > 30 || messages.some(message => !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || message.content.length > 10000)) {
      return NextResponse.json({ error: 'Nội dung hội thoại chưa hợp lệ.' }, { status: 400 });
    }

    const input = [
      {
        role: "system",
        content: "Bạn là trợ lý TXEPRO. Trả lời ngắn gọn, lịch sự. Không tự đặt số điện thoại, địa chỉ, giờ hỗ trợ, phí hoặc thời hạn xử lý. Với thông tin chưa có, hướng dẫn người dùng đến trang Liên hệ hoặc Trợ giúp. Không khẳng định mọi chuyến đều miễn phí."
      },
      ...messages
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: input,
        temperature: 0.7,
        stream: true
      }),
    });

    if (!response.ok) {
      console.error("Chat provider returned status:", response.status);
      return NextResponse.json({ error: "Lỗi kết nối AI" }, { status: response.status });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder("utf-8");
        let done = false;
        let parserBuffer = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            parserBuffer += chunk;
            
            const lines = parserBuffer.split("\n");
            parserBuffer = lines.pop() || "";

            for (const line of lines) {
              const cleanedLine = line.trim();
              if (cleanedLine === "data: [DONE]") {
                continue;
              }
              if (cleanedLine.startsWith("data: ")) {
                try {
                  const jsonStr = cleanedLine.slice(6);
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  // ignore parse error
                }
              }
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("Chat API route error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
