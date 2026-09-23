"use client";

import React, { useRef, useState, useTransition } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  Link as LinkIcon,
  Minus,
  Eye,
  Edit3,
  Columns,
  Smartphone,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Copy,
  Check,
  Tag,
  AlertCircle,
  FileText,
} from "lucide-react";

interface NewsContentEditorProps {
  value: string;
  onChange: (val: string) => void;
  summary?: string;
  category?: string;
  title?: string;
  imageUrl?: string;
  audience?: string;
}

const TEMPLATES = [
  {
    name: "Mẫu Thông báo Ưu đãi & Thưởng",
    content: `<h3>CHƯƠNG TRÌNH ƯU ĐÃI ĐẶC BIỆT</h3>
<p>TXEPRO trân trọng gửi tới quý đối tác chương trình ưu đãi áp dụng trên toàn quốc:</p>

<h4>1. Quyền lợi ưu đãi</h4>
<ul>
  <li>Miễn 100% phí kết nối cuốc xe trong 30 ngày đầu tiên kích hoạt tài khoản.</li>
  <li>Thưởng tiền mặt trực tiếp vào ví sau khi hoàn thành các mốc:</li>
  <li>Mốc 1: Hoàn thành 5 chuyến nhận thưởng <strong>100.000đ</strong></li>
  <li>Mốc 2: Hoàn thành 15 chuyến nhận thưởng <strong>250.000đ</strong></li>
  <li>Mốc 3: Hoàn thành 30 chuyến nhận thưởng <strong>500.000đ</strong></li>
</ul>

<div class="card-highlight">
  <strong>Ưu đãi đặc biệt:</strong> Đối tác hoàn thành từ 30 chuyến trở lên trong tháng được ưu tiên gắn huy hiệu Tài xế PRO và nhận đơn hàng độc quyền.
</div>

<h4>2. Điều kiện tham gia</h4>
<ol>
  <li>Tài khoản đã hoàn tất xác thực thông tin (KYC) hợp lệ.</li>
  <li>Tỷ lệ nhận chuyến đạt tối thiểu 85% và tỷ lệ hoàn thành cuốc từ 90% trở lên.</li>
  <li>Không phát sinh vi phạm quy tắc ứng xử và an toàn vận tải.</li>
</ol>

<hr />
<p>Tổng đài hỗ trợ đối tác 24/7: <strong>1900 xxxx</strong> hoặc gửi yêu cầu tại mục Hỗ trợ trên ứng dụng.</p>`,
  },
  {
    name: "Mẫu Cẩm nang Hướng dẫn Vận hành",
    content: `<h3>HƯỚNG DẪN QUY TRÌNH GIAO NHẬN VẬN TẢI</h3>
<p>Để tối ưu hiệu suất và đảm bảo an toàn tuyệt đối cho từng kiện hàng, quý đối tác vui lòng thực hiện theo quy trình 4 bước chuẩn hóa sau:</p>

<h4>Bước 1: Tiếp nhận và xác nhận thông tin đơn hàng</h4>
<p>Kiểm tra kỹ thông tin chủng loại hàng hóa, tải trọng, quy cách đóng gói và địa chỉ giao nhận. Chủ động liên hệ trước với người gửi và người nhận ít nhất 20 phút trước khi đến.</p>

<h4>Bước 2: Kiểm tra hiện trạng và lập biên bản đối soát</h4>
<ul>
  <li>Chụp ảnh ngoại quan kiện hàng trước khi bốc xếp lên thùng xe.</li>
  <li>Kiểm tra niêm phong tem kẹp chì (nếu có) để xác nhận tình trạng nguyên vẹn.</li>
</ul>

<div class="card-note">
  <strong>Lưu ý quan trọng:</strong> Luôn lưu giữ ảnh chụp biên bản bàn giao có chữ ký xác nhận của bên nhận để hệ thống giải ngân tiền cước tự động qua Ví Escrow.
</div>

<h4>Bước 3: Vận chuyển an toàn và cập nhật lộ trình</h4>
<p>Duy trì kết nối mạng và bật định vị GPS trong suốt chuyến đi. Trường hợp phát sinh sự cố giao thông hoặc thời tiết xấu, cập nhật trạng thái ngay trên app để chủ hàng theo dõi.</p>

<h4>Bước 4: Nghiệm thu và giải ngân cuốc xe</h4>
<p>Bàn giao hàng tận nơi, đối soát số lượng và hoàn tất đơn hàng trên ứng dụng để nhận tiền cước về ví tức thì.</p>`,
  },
  {
    name: "Mẫu Hướng dẫn Chủ hàng Đặt xe tiết kiệm",
    content: `<h3>GIẢI PHÁP VẬN TẢI TIẾT KIỆM CHI PHÍ</h3>
<p>TXEPRO kết nối mạng lưới hàng nghìn xe tải rỗng chiều về, mang đến giải pháp vận chuyển tối ưu chi phí cho cá nhân và doanh nghiệp:</p>

<h4>3 Phương pháp tối ưu cước phí vận chuyển:</h4>
<ul>
  <li><strong>Chọn đơn ghép tiện chuyến:</strong> Tiết kiệm từ 20% đến 30% cước phí đối với các kiện hàng linh hoạt thời gian.</li>
  <li><strong>Đặt xe trước từ 2 đến 4 tiếng:</strong> Tạo điều kiện cho các tài xế tiện chuyến nhận đơn với mức cước tốt nhất.</li>
  <li><strong>Khai báo chính xác tải trọng:</strong> Tránh phát sinh chi phí đổi xe hoặc phạt quá tải.</li>
</ul>

<div class="card-highlight">
  <strong>Cam kết bảo vệ quyền lợi Chủ hàng:</strong>
  <ul>
    <li>Bảo hiểm hàng hóa toàn diện trong suốt hành trình.</li>
    <li>Tiền cước được bảo chứng an toàn qua Ví Ký quỹ Escrow, chỉ thanh toán khi hàng đã đến nơi.</li>
    <li>Xuất hóa đơn VAT điện tử hợp lệ phục vụ quyết toán thuế doanh nghiệp.</li>
  </ul>
</div>

<hr />
<p>Liên hệ bộ phận khách hàng doanh nghiệp qua hotline <strong>1900 xxxx</strong> để nhận bảng báo giá chiết khấu theo tháng.</p>`,
  },
];

export function NewsContentEditor({
  value,
  onChange,
  summary,
  category = "Tin tức",
  title = "Tiêu đề bài viết",
  imageUrl = "",
  audience = "all",
}: NewsContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  // Undo / Redo history
  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef<number>(0);

  const pushHistory = (newVal: string) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(newVal);
    if (nextHistory.length > 50) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      onChange(historyRef.current[historyIndexRef.current]);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      onChange(historyRef.current[historyIndexRef.current]);
    }
  };

  // Helper to wrap or insert HTML tag at selection
  const insertTag = (openTag: string, closeTag: string, defaultContent: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const next = `${value}\n${openTag}${defaultContent}${closeTag}`;
      onChange(next);
      pushHistory(next);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultContent;
    const replacement = `${openTag}${selected}${closeTag}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);

    onChange(nextVal);
    pushHistory(nextVal);

    startTransition(() => {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openTag.length,
          start + openTag.length + selected.length
        );
      }, 0);
    });
  };

  // Apply template
  const applyTemplate = (content: string) => {
    if (value.trim() && !window.confirm("Áp dụng mẫu này sẽ thay thế nội dung hiện tại. Tiếp tục?")) {
      return;
    }
    onChange(content);
    pushHistory(content);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Metrics
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  // Render HTML safely for preview
  const renderHtmlContent = (html: string) => {
    if (!html.trim()) {
      return (
        <div className="text-slate-400 italic text-sm text-center py-10">
          Chưa có nội dung bài viết. Hãy dùng thanh công cụ phía trên để chèn các thẻ tiêu đề, đoạn văn, danh sách hoặc chọn mẫu bài viết có sẵn.
        </div>
      );
    }

    return (
      <div
        className="news-content-preview text-slate-800 text-sm leading-relaxed space-y-3"
        dangerouslySetInnerHTML={{ __html: sanitizeAndEnhanceHtml(html) }}
      />
    );
  };

  // Sanitize and apply clean modern styles to tags
  const sanitizeAndEnhanceHtml = (raw: string): string => {
    // If text still has legacy markdown ##, convert to clean h3/h4
    let clean = raw
      .replace(/^###\s+(.+)$/gm, "<h4>$1</h4>")
      .replace(/^##\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/^#\s+(.+)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/•\s+(.+)$/gm, "<li>$1</li>");

    return clean;
  };

  return (
    <div
      className={`border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-4 z-50 shadow-2xl border-slate-300"
          : "relative w-full"
      }`}
    >
      {/* Top Toolbar */}
      <div className="border-b border-slate-200 bg-slate-50/90 px-3 py-2 rounded-t-2xl flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Left: Tag Actions */}
        <div className="flex flex-wrap items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 mr-2 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                viewMode === "edit"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Chế độ soạn thảo thẻ"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                viewMode === "preview"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Xem trước hiển thị"
            >
              <Eye className="w-3.5 h-3.5" />
              Xem trước
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                viewMode === "split"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Chia đôi màn hình"
            >
              <Columns className="w-3.5 h-3.5" />
              Chia đôi
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Heading Tags */}
          <button
            type="button"
            onClick={() => insertTag("<h3>", "</h3>", "Tiêu đề chính")}
            className="px-2 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ tiêu đề 3 (<h3>)"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => insertTag("<h4>", "</h4>", "Tiêu đề phụ")}
            className="px-2 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ tiêu đề 4 (<h4>)"
          >
            H4
          </button>
          <button
            type="button"
            onClick={() => insertTag("<p>", "</p>", "Nội dung đoạn văn")}
            className="px-2 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ đoạn văn (<p>)"
          >
            &lt;p&gt;
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Text Formatting Tags */}
          <button
            type="button"
            onClick={() => insertTag("<strong>", "</strong>", "chữ in đậm")}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors font-bold"
            title="Thẻ in đậm (<strong>)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag("<em>", "</em>", "chữ in nghiêng")}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ in nghiêng (<em>)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag("<del>", "</del>", "chữ gạch ngang")}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ gạch ngang (<del>)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* List Tags */}
          <button
            type="button"
            onClick={() =>
              insertTag("<ul>\n  <li>", "</li>\n  <li>Mục tiếp theo</li>\n</ul>", "Mục danh sách")
            }
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ danh sách chấm (<ul><li>)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertTag("<ol>\n  <li>", "</li>\n  <li>Bước tiếp theo</li>\n</ol>", "Bước 1")
            }
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ danh sách số (<ol><li>)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Semantic Container Cards */}
          <button
            type="button"
            onClick={() =>
              insertTag(
                '<div class="card-note">\n  <strong>Lưu ý:</strong> ',
                "\n</div>",
                "Nhập nội dung lưu ý quan trọng tại đây."
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
            title="Chèn thẻ Khung Lưu ý"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Thẻ Lưu ý
          </button>
          <button
            type="button"
            onClick={() =>
              insertTag(
                '<div class="card-highlight">\n  <strong>Ưu đãi:</strong> ',
                "\n</div>",
                "Nhập nội dung ưu đãi nổi bật tại đây."
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            title="Chèn thẻ Khung Ưu đãi"
          >
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            Thẻ Ưu đãi
          </button>
          <button
            type="button"
            onClick={() => insertTag("<blockquote>", "</blockquote>", "Trích dẫn")}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ trích dẫn (<blockquote>)"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Divider & Link */}
          <button
            type="button"
            onClick={() => insertTag("\n<hr />\n", "")}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ đường phân cách (<hr />)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<a href="https://txepro.vn" target="_blank">', "</a>", "Liên kết")}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Thẻ liên kết (<a>)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right side: Templates & Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Template Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Mẫu thẻ bài viết
            </button>
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 hidden group-hover:block transition-all">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chọn mẫu cấu trúc thẻ
              </div>
              {TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tmpl.content)}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                >
                  <span className="truncate">{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Hoàn tác (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Làm lại (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Copy content */}
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title="Sao chép toàn bộ"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-colors"
            title={isFullscreen ? "Thu nhỏ lại" : "Mở rộng toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className={`flex-1 overflow-hidden min-h-[340px] ${isFullscreen ? "h-[calc(100vh-120px)]" : "h-[420px]"}`}>
        {/* Mode 1: Edit only */}
        {viewMode === "edit" && (
          <div className="h-full relative flex flex-col">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                pushHistory(e.target.value);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                  e.preventDefault();
                  insertTag("<strong>", "</strong>", "chữ in đậm");
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                  e.preventDefault();
                  insertTag("<em>", "</em>", "chữ in nghiêng");
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                  if (e.shiftKey) {
                    e.preventDefault();
                    handleRedo();
                  } else {
                    e.preventDefault();
                    handleUndo();
                  }
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  insertTag("  ", "");
                }
              }}
              placeholder="Nhập nội dung chi tiết bài viết với các thẻ HTML: <h3>, <p>, <strong>, <ul>, <li>, <div class='card-note'>..."
              className="w-full h-full p-4 text-sm font-mono leading-relaxed text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-0 bg-transparent"
            />
          </div>
        )}

        {/* Mode 2: Preview only */}
        {viewMode === "preview" && (
          <div className="h-full overflow-y-auto p-4 md:p-6 bg-slate-50/50">
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              {/* Mobile app preview header */}
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  Mô phỏng hiển thị trên Ứng dụng TXEPRO
                </div>
                <span className="text-[10px] text-slate-400">Mobile Dialog</span>
              </div>

              {/* Banner image simulation */}
              {imageUrl ? (
                <div className="w-full h-44 bg-slate-100 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute left-3 bottom-3 bg-primary-600/95 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {category}
                  </div>
                </div>
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-primary-600 to-indigo-700 p-4 flex flex-col justify-end text-white">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 w-fit px-2 py-0.5 rounded-full">
                    {category}
                  </span>
                </div>
              )}

              {/* Article Content inside Mobile card */}
              <div className="p-5">
                <h2 className="text-lg font-black text-slate-900 leading-snug">
                  {title || "Tiêu đề bài viết"}
                </h2>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>Hôm nay</span>
                  <span>•</span>
                  <span>Đối tượng: {audience === "all" ? "Tất cả" : audience === "driver" ? "Tài xế" : "Chủ hàng"}</span>
                </div>

                {/* Summary Highlight */}
                {summary && (
                  <div className="mt-3.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold leading-relaxed">
                    {summary}
                  </div>
                )}

                {/* Rendered Body */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {renderHtmlContent(value)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode 3: Split View */}
        {viewMode === "split" && (
          <div className="h-full flex divide-x divide-slate-200">
            {/* Left: Input */}
            <div className="w-1/2 h-full flex flex-col">
              <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Edit3 className="w-3 h-3" />
                Mã Thẻ Soạn thảo
              </div>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  pushHistory(e.target.value);
                }}
                placeholder="Nhập nội dung với các thẻ HTML..."
                className="flex-1 w-full p-3.5 text-sm font-mono leading-relaxed text-slate-800 resize-none focus:outline-none bg-transparent"
              />
            </div>

            {/* Right: Preview */}
            <div className="w-1/2 h-full flex flex-col bg-slate-50/40">
              <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-primary-600" />
                Hiển thị Trực tiếp
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {summary && (
                  <div className="mb-3.5 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-950 text-xs font-semibold">
                    {summary}
                  </div>
                )}
                {renderHtmlContent(value)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-2 rounded-b-2xl flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">{wordCount} từ</span>
          <span>•</span>
          <span className={`${charCount > 7800 ? "text-red-600 font-bold" : ""}`}>
            {charCount.toLocaleString()} / 8,000 ký tự
          </span>
          <span>•</span>
          <span>Thời gian đọc: ~{readTimeMin} phút</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Hỗ trợ thẻ: &lt;h3&gt;, &lt;h4&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;div class=&quot;card-note&quot;&gt;</span>
        </div>
      </div>
    </div>
  );
}
