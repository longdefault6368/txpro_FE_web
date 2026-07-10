import { NextResponse } from "next/server";

const API_KEY = "sk-sp-D.IDDM.oDxW.MEYCIQDhPtvvznvTTwQCcGvDBMFiox0JyQ21xmT642lyscggOwIhAOw03L0/wOehMvWyLIrcdJ/XK395O1WEhlpjEj4gGAiI";
// Use the dedicated Responses Base URL for agent tools
const BASE_URL = "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";
const MODEL = "qwen3.6-plus";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Map system instructions and standard chat messages to the input array expected by /responses
    const input = [
      {
        role: "system",
        content: "Bạn là trợ lý AI thông minh của hệ thống vận tải thông minh TXEPRO. Hãy hỗ trợ trả lời các thắc mắc của chủ hàng và tài xế về việc tìm xe rỗng, đăng chuyến xe rỗng, gửi hàng, và các tính năng công nghệ (như OTP xác thực, Live GPS tracking, Radar quét, Vòng xoay giá thương lượng) của ứng dụng TXEPRO. Vì bạn được tích hợp tính năng Tìm Kiếm Web Thời Gian Thực (Web Search), hãy cung cấp thông tin chính xác, cập nhật mới nhất về các thông tin thời sự vận tải nếu được hỏi. Trả lời bằng tiếng Việt lịch sự, thân thiện, ngắn gọn và hữu ích. Hãy nêu bật tính năng miễn phí 0đ và 0% chiết khấu của TXEPRO để thu hút người dùng."
      },
      ...messages
    ];

    // Call the MaaS Responses API to utilize built-in Web Search natively
    const response = await fetch(`${BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: input,
        tools: [
          { type: "web_search" }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Alibaba Responses API error response:", errText);
      return NextResponse.json({ reply: "Xin lỗi, hiện tại hệ thống tìm kiếm thông tin đang bận. Quý khách vui lòng thử lại sau!" }, { status: response.status });
    }

    const data = await response.json();
    
    // Safely extract the final text output from the Responses API schema
    const messageOutput = data.output?.find((o: any) => o.type === "message");
    const textContent = messageOutput?.content?.find((c: any) => c.type === "output_text");
    const reply = textContent?.text || "Xin lỗi, hiện tại tôi không tìm thấy kết quả. Vui lòng gửi lại câu hỏi!";
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Search Chat API route error:", error);
    return NextResponse.json({ reply: "Đã xảy ra lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền!" }, { status: 500 });
  }
}
