"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Minus,
  Eye,
  Code2,
  Smartphone,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Tag,
  AlertCircle,
  FileText,
  ImagePlus,
  Pilcrow,
} from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/utils/api";
import { getServerMediaUrl, normalizePersistedImagePath } from "@/utils/media";

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
  <li>Mốc 1: Hoàn thành 5 chuyến nhận thưởng <strong>100.000đ</strong></li>
  <li>Mốc 2: Hoàn thành 15 chuyến nhận thưởng <strong>250.000đ</strong></li>
  <li>Mốc 3: Hoàn thành 30 chuyến nhận thưởng <strong>500.000đ</strong></li>
</ul>
<div class="card-highlight"><strong>Ưu đãi đặc biệt:</strong> Đối tác hoàn thành từ 30 chuyến trở lên trong tháng được ưu tiên gắn huy hiệu Tài xế PRO và nhận đơn hàng độc quyền.</div>
<h4>2. Điều kiện tham gia</h4>
<ol>
  <li>Tài khoản đã hoàn tất xác thực thông tin (KYC) hợp lệ.</li>
  <li>Tỷ lệ nhận chuyến đạt tối thiểu 85% và tỷ lệ hoàn thành cuốc từ 90% trở lên.</li>
  <li>Không phát sinh vi phạm quy tắc ứng xử và an toàn vận tải.</li>
</ol>
<hr>
<p>Xem thông tin liên hệ hiện hành trên website hoặc gửi yêu cầu tại mục Hỗ trợ trên ứng dụng.</p>`,
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
<div class="card-note"><strong>Lưu ý quan trọng:</strong> Luôn lưu giữ ảnh chụp biên bản bàn giao có chữ ký xác nhận của bên nhận để hệ thống giải ngân tiền cước tự động qua Ví Escrow.</div>
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
<div class="card-highlight"><strong>Cam kết bảo vệ quyền lợi Chủ hàng:</strong><br>Bảo hiểm hàng hóa toàn diện trong suốt hành trình.<br>Tiền cước được bảo chứng an toàn qua Ví Ký quỹ Escrow, chỉ thanh toán khi hàng đã đến nơi.<br>Xuất hóa đơn VAT điện tử hợp lệ phục vụ quyết toán thuế doanh nghiệp.</div>
<hr>
<p>Liên hệ bộ phận khách hàng doanh nghiệp qua trang Liên hệ để trao đổi nhu cầu.</p>`,
  },
];

const BLOCK_TAGS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "hr", "img"]);

function escapeText(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string) {
  return escapeText(text).replace(/"/g, "&quot;");
}

function plainText(node: Node) {
  return (node.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function inlineHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeText((node.textContent || "").replace(/\u00a0/g, " "));
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "script" || tag === "style" || tag === "iframe") return "";
  if (tag === "br") return "<br>";
  const inner = Array.from(el.childNodes).map(inlineHtml).join("");
  if (!inner.trim()) return "";
  if (tag === "strong" || tag === "b") return `<strong>${inner}</strong>`;
  if (tag === "em" || tag === "i") return `<em>${inner}</em>`;
  if (tag === "del" || tag === "s" || tag === "strike") return `<del>${inner}</del>`;
  if (tag === "a") {
    const href = el.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href)) return inner;
    return `<a href="${escapeAttr(href)}" target="_blank">${inner}</a>`;
  }
  return inner;
}

function cardClass(el: HTMLElement) {
  const value = el.getAttribute("class") || "";
  if (value.split(/\s+/).includes("card-note")) return "card-note";
  if (value.split(/\s+/).includes("card-highlight")) return "card-highlight";
  return "";
}

function cardInner(el: HTMLElement) {
  const parts: string[] = [];
  const pushBreak = () => {
    if (parts.length && !parts[parts.length - 1].endsWith("<br>")) parts.push("<br>");
  };
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as HTMLElement).tagName.toLowerCase();
      if (tag === "div" || tag === "p") {
        pushBreak();
        const inner = inlineHtml(child).trim();
        if (inner) parts.push(inner);
        return;
      }
    }
    const inner = inlineHtml(child);
    if (inner) parts.push(inner);
  });
  return parts.join("").replace(/(<br>)+$/g, "");
}

function imageHtml(el: HTMLElement) {
  const stored = el.dataset.path || normalizePersistedImagePath(el.getAttribute("src") || "");
  if (!stored || stored.startsWith("blob:") || stored.startsWith("data:")) return "";
  return `<img src="${escapeAttr(stored)}">`;
}

function listHtml(el: HTMLElement, ordered: boolean) {
  const items = Array.from(el.children)
    .filter((child) => child.tagName.toLowerCase() === "li")
    .map((child) => inlineHtml(child).trim())
    .filter(Boolean)
    .map((item) => `  <li>${item}</li>`);
  if (!items.length) return "";
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>\n${items.join("\n")}\n</${tag}>`;
}

function blockHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = plainText(node);
    return text ? `<p>${escapeText(text)}</p>` : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "script" || tag === "style" || tag === "iframe") return "";
  if (tag === "img") return imageHtml(el);
  if (tag === "hr") return "<hr>";
  const card = cardClass(el);
  if (card) {
    const inner = cardInner(el).trim();
    return inner ? `<div class="${card}">${inner}</div>` : "";
  }
  if (tag === "ul" || tag === "ol") return listHtml(el, tag === "ol");
  if (tag === "h1" || tag === "h2") {
    const text = plainText(el);
    return text ? `<h2>${escapeText(text)}</h2>` : "";
  }
  if (tag === "h3") {
    const text = plainText(el);
    return text ? `<h3>${escapeText(text)}</h3>` : "";
  }
  if (tag === "h4" || tag === "h5" || tag === "h6") {
    const text = plainText(el);
    return text ? `<h4>${escapeText(text)}</h4>` : "";
  }
  if (tag === "blockquote") {
    const inner = inlineHtml(el).trim();
    return inner ? `<blockquote>${inner}</blockquote>` : "";
  }
  if (tag === "div" || tag === "section" || tag === "article") {
    const nested = Array.from(el.childNodes).some((child) => (
      child.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((child as HTMLElement).tagName.toLowerCase())
    ));
    if (nested) return Array.from(el.childNodes).map(blockHtml).filter(Boolean).join("\n");
  }
  const inner = inlineHtml(el).replace(/^(?:<br>|\s)+$/g, "").trim();
  return inner ? `<p>${inner}</p>` : "";
}

export function serializeNewsHtml(root: ParentNode) {
  return Array.from(root.childNodes).map(blockHtml).filter(Boolean).join("\n");
}

function toEditorHtml(stored: string) {
  return stored.replace(/<img\b([^>]*?)src=(["'])(.*?)\2([^>]*)>/gi, (_match, before, _quote, src, after) => {
    const path = normalizePersistedImagePath(src);
    const display = getServerMediaUrl(path) || path;
    return `<img${before}src="${escapeAttr(display)}" data-path="${escapeAttr(path)}"${after.replace(/\sdata-path=(["']).*?\1/i, "")}>`;
  });
}

function legacyToHtml(raw: string) {
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw
    .replace(/^###\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^##\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (/^<h[234]>/.test(part) ? part : `<p>${part.replace(/\n/g, "<br>")}</p>`))
    .join("\n");
}

export function NewsContentEditor({
  value,
  onChange,
  summary,
  category = "Tin tức",
  title = "Tiêu đề bài viết",
  imageUrl = "",
  audience = "all",
}: NewsContentEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef<string | null>(null);
  const skipResetRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "preview" | "source">("visual");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || viewMode !== "visual") return;
    if (skipResetRef.current && loadedRef.current === value) {
      skipResetRef.current = false;
      return;
    }
    editor.innerHTML = toEditorHtml(legacyToHtml(value || ""));
    loadedRef.current = value;
    markEmpty(editor);
  }, [value, viewMode]);

  const publish = (next: string, keepCaret = false) => {
    loadedRef.current = next;
    skipResetRef.current = keepCaret;
    onChange(next);
  };

  const emitVisual = () => {
    const editor = editorRef.current;
    if (!editor) return;
    markEmpty(editor);
    publish(serializeNewsHtml(editor), true);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command: string, argument?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!editor.innerHTML.trim()) editor.innerHTML = "<p><br></p>";
    focusEditor();
    document.execCommand(command, false, argument);
    emitVisual();
  };

  const pasteHtml = (html: string) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    emitVisual();
  };

  const insertHtml = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    focusEditor();
    const selection = window.getSelection();
    let node: Node | null = selection?.anchorNode || null;
    while (node && node.parentNode !== editor) node = node.parentNode;
    const holder = document.createElement("div");
    holder.innerHTML = html;
    const fragment = document.createDocumentFragment();
    while (holder.firstChild) fragment.appendChild(holder.firstChild);
    if (node?.parentNode === editor) editor.insertBefore(fragment, node.nextSibling);
    else editor.appendChild(fragment);
    emitVisual();
  };

  const applyTemplate = (content: string) => {
    if (value.trim() && !window.confirm("Áp dụng mẫu này sẽ thay thế nội dung hiện tại. Tiếp tục?")) return;
    publish(content);
  };

  const addLink = () => {
    const href = window.prompt("Dán địa chỉ liên kết (https://...)", "https://txepro.vn");
    if (!href || !/^https?:\/\//i.test(href.trim())) return;
    runCommand("createLink", href.trim());
  };

  const addImageUrl = () => {
    const src = window.prompt("Dán địa chỉ ảnh", "https://");
    if (!src?.trim()) return;
    const path = normalizePersistedImagePath(src.trim());
    const display = getServerMediaUrl(path) || path;
    insertHtml(`<img src="${escapeAttr(display)}" data-path="${escapeAttr(path)}" alt="">`);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setNotice("Chỉ nhận ảnh PNG, JPG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("Ảnh phải nhỏ hơn 5MB.");
      return;
    }
    setUploading(true);
    setNotice("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetchWithAuth(`${API_BASE}/admin/news/upload`, { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Tải ảnh thất bại.");
      const url = json.data?.url || json.url;
      if (!url) throw new Error("Không nhận được đường dẫn ảnh.");
      const path = normalizePersistedImagePath(url);
      const display = getServerMediaUrl(path) || path;
      insertHtml(`<img src="${escapeAttr(display)}" data-path="${escapeAttr(path)}" alt="">`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    if (!html && !text) return;
    event.preventDefault();
    const holder = document.createElement("div");
    holder.innerHTML = html || text.split(/\n{2,}/).map((part) => `<p>${escapeText(part).replace(/\n/g, "<br>")}</p>`).join("");
    pasteHtml(serializeNewsHtml(holder) || `<p>${escapeText(text)}</p>`);
  };

  const charCount = value.length;
  const wordCount = value.replace(/<[^>]+>/g, " ").trim() ? value.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className={`border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col ${isFullscreen ? "fixed inset-4 z-[60] shadow-2xl border-slate-300" : "relative w-full"}`}>
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 rounded-t-2xl flex flex-wrap items-center gap-1.5">
        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 mr-1">
          <ModeButton active={viewMode === "visual"} onClick={() => setViewMode("visual")}>Soạn</ModeButton>
          <ModeButton active={viewMode === "preview"} onClick={() => setViewMode("preview")}><Eye className="w-3.5 h-3.5" /> Xem trước</ModeButton>
          <ModeButton active={viewMode === "source"} onClick={() => setViewMode("source")}><Code2 className="w-3.5 h-3.5" /> Mã HTML</ModeButton>
        </div>
        {viewMode === "visual" && (
          <>
            <ToolButton title="Đoạn văn" onClick={() => runCommand("formatBlock", "<p>") }><Pilcrow className="w-4 h-4" /></ToolButton>
            <ToolButton title="Tiêu đề lớn" onClick={() => runCommand("formatBlock", "<h2>")}>H2</ToolButton>
            <ToolButton title="Tiêu đề" onClick={() => runCommand("formatBlock", "<h3>")}>H3</ToolButton>
            <ToolButton title="Mục nhỏ" onClick={() => runCommand("formatBlock", "<h4>")}>H4</ToolButton>
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <ToolButton title="In đậm" onClick={() => runCommand("bold")}><Bold className="w-4 h-4" /></ToolButton>
            <ToolButton title="In nghiêng" onClick={() => runCommand("italic")}><Italic className="w-4 h-4" /></ToolButton>
            <ToolButton title="Gạch ngang" onClick={() => runCommand("strikeThrough")}><Strikethrough className="w-4 h-4" /></ToolButton>
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <ToolButton title="Danh sách" onClick={() => runCommand("insertUnorderedList")}><List className="w-4 h-4" /></ToolButton>
            <ToolButton title="Danh sách đánh số" onClick={() => runCommand("insertOrderedList")}><ListOrdered className="w-4 h-4" /></ToolButton>
            <ToolButton title="Trích dẫn" onClick={() => runCommand("formatBlock", "<blockquote>") }><Quote className="w-4 h-4" /></ToolButton>
            <ToolButton title="Đường kẻ" onClick={() => insertHtml("<hr>")}><Minus className="w-4 h-4" /></ToolButton>
            <ToolButton title="Liên kết" onClick={addLink}><LinkIcon className="w-4 h-4" /></ToolButton>
            <ToolButton title="Chèn ảnh vào bài" onClick={() => fileRef.current?.click()}><ImagePlus className="w-4 h-4" /></ToolButton>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={addImageUrl} className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg">URL ảnh</button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertHtml('<div class="card-note"><strong>Lưu ý:</strong> Nhập nội dung lưu ý.</div>')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Lưu ý
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertHtml('<div class="card-highlight"><strong>Ưu đãi:</strong> Nhập nội dung nổi bật.</div>')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
            >
              <Tag className="w-3.5 h-3.5" /> Ưu đãi
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <div className="relative group">
            <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl">
              <FileText className="w-3.5 h-3.5" /> Mẫu bài
            </button>
            <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 hidden group-hover:block">
              {TEMPLATES.map((template) => (
                <button key={template.name} type="button" onClick={() => applyTemplate(template.content)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  {template.name}
                </button>
              ))}
            </div>
          </div>
          {viewMode === "visual" && (
            <>
              <ToolButton title="Hoàn tác" onClick={() => runCommand("undo")}><Undo2 className="w-4 h-4" /></ToolButton>
              <ToolButton title="Làm lại" onClick={() => runCommand("redo")}><Redo2 className="w-4 h-4" /></ToolButton>
            </>
          )}
          <ToolButton title={isFullscreen ? "Thu nhỏ" : "Mở rộng"} onClick={() => setIsFullscreen((open) => !open)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ToolButton>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadImage(file);
          event.target.value = "";
        }}
      />

      <div className={isFullscreen ? "h-[calc(100vh-150px)] overflow-y-auto" : ""}>
        {viewMode === "visual" && (
          <div
            ref={editorRef}
            className="news-content-preview news-visual-editor"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="Nội dung chi tiết bài viết"
            data-placeholder="Viết nội dung bài tại đây. Chọn chữ rồi bấm Đậm, tiêu đề, danh sách, lưu ý hoặc ưu đãi."
            suppressContentEditableWarning
            onInput={emitVisual}
            onPaste={onPaste}
          />
        )}
        {viewMode === "source" && (
          <textarea
            value={value}
            onChange={(event) => publish(event.target.value)}
            spellCheck={false}
            className="w-full min-h-[68vh] p-5 text-sm font-mono leading-relaxed text-slate-800 resize-y focus:outline-none"
            placeholder="Mã HTML của bài viết"
          />
        )}
        {viewMode === "preview" && (
          <div className="min-h-[68vh] overflow-y-auto bg-slate-50 p-6">
            <article className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 text-xs text-white">
                <span className="inline-flex items-center gap-1.5 font-bold"><Smartphone className="w-3.5 h-3.5 text-blue-400" /> Xem như trên ứng dụng</span>
              </div>
              {imageUrl ? (
                <div className="relative h-48 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary-700">{category}</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">{title || "Tiêu đề bài viết"}</h2>
                <p className="mt-1 text-xs text-slate-400">{audience === "driver" ? "Tài xế" : audience === "shipper" ? "Chủ hàng" : "Tất cả"}</p>
                {summary ? <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">{summary}</p> : null}
                <div className="news-content-preview mt-4 border-t border-slate-100 pt-4" dangerouslySetInnerHTML={{ __html: legacyToHtml(value) }} />
              </div>
            </article>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 rounded-b-2xl text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">{wordCount} từ</span>
          <span className={charCount > 7800 ? "font-bold text-red-600" : ""}>{charCount.toLocaleString("vi-VN")} / 8.000 ký tự</span>
          <span>Đọc khoảng {readTimeMin} phút</span>
          {uploading ? <span>Đang tải ảnh...</span> : null}
          {notice ? <span className="text-red-600">{notice}</span> : null}
        </div>
        <span>Bài trên app nhận tiêu đề, đoạn văn, danh sách, ảnh, khung lưu ý và khung ưu đãi.</span>
      </div>
    </div>
  );
}

function markEmpty(editor: HTMLDivElement) {
  const empty = !editor.textContent?.trim() && !editor.querySelector("img");
  editor.dataset.empty = empty ? "true" : "false";
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${active ? "bg-primary-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
    >
      {children}
    </button>
  );
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex min-w-8 items-center justify-center rounded-lg border border-transparent px-2 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-200 hover:bg-white"
    >
      {children}
    </button>
  );
}
