import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_KEY = "sk-sp-D.IDDM.oDxW.MEYCIQDhPtvvznvTTwQCcGvDBMFiox0JyQ21xmT642lyscggOwIhAOw03L0/wOehMvWyLIrcdJ/XK395O1WEhlpjEj4gGAiI";
const BASE_URL = "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";
const MODEL = "deepseek-v4-flash";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const input = [
      {
        role: "system",
        content: "Bạn là trợ lý AI thông minh của hệ thống vận tải thông minh TXEPRO. Hãy hỗ trợ trả lời các thắc mắc của chủ hàng và tài xế về việc tìm xe rỗng, đăng chuyến xe rỗng, gửi hàng, và các tính năng công nghệ (như OTP xác thực, Live GPS tracking, Radar quét, Vòng xoay giá thương lượng) của ứng dụng TXEPRO. Trả lời bằng tiếng Việt lịch sự, thân thiện, ngắn gọn và hữu ích. Hãy nêu bật tính năng miễn phí 0đ và 0% chiết khấu của TXEPRO để thu hút người dùng."
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
      const errText = await response.text();
      console.error("Alibaba API error:", errText);
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
