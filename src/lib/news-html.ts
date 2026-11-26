import { resolveSafeNewsImage } from "./news-public";

export type NewsInlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: NewsInlineNode[] }
  | { type: "em"; children: NewsInlineNode[] }
  | { type: "del"; children: NewsInlineNode[] }
  | { type: "br" }
  | { type: "link"; href: string; internal: boolean; children: NewsInlineNode[] };

export type NewsBlockNode =
  | { type: "heading"; level: 2 | 3 | 4; id?: string; text: string; children: NewsInlineNode[] }
  | { type: "paragraph"; children: NewsInlineNode[] }
  | { type: "list"; ordered: boolean; items: NewsInlineNode[][] }
  | { type: "blockquote"; children: NewsInlineNode[] }
  | { type: "callout"; variant: "note" | "highlight"; children: NewsInlineNode[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "table"; headers: NewsInlineNode[][]; rows: NewsInlineNode[][][] }
  | { type: "hr" };

export type ParsedNewsDocument = {
  blocks: NewsBlockNode[];
  headings: { id: string; title: string }[];
};

export type NewsSeoStats = {
  wordCount: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  internalLinkCount: number;
  externalLinkCount: number;
};

const DANGEROUS_TAG_RE = /<(script|style|iframe|object|embed|svg|math|form|input|textarea|button|select)\b[^>]*>[\s\S]*?<\/\1\s*>|<(script|style|iframe|object|embed|svg|math|form|input|textarea|button|select)\b[^>]*\/?>/gi;
const HTML_TAG_DETECT_RE = /<(?:p|div|h[1-6]|ul|ol|li|blockquote|hr|img|figure|figcaption|table|thead|tbody|tr|th|td|strong|b|em|i|del|s|a|br)\b/i;

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);|&#(?:\d+|x[\da-f]+);/gi, (value) => {
    const lower = value.toLowerCase();
    const named: Record<string, string> = {
      "&nbsp;": " ",
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
      "&#39;": "'",
    };
    if (named[lower]) return named[lower];
    const code = lower.startsWith("&#x") ? parseInt(lower.slice(3), 16) : parseInt(lower.slice(2), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

export function normalizeNewsHref(raw: string): { href: string; internal: boolean } | null {
  const value = decodeHtmlEntities(raw).trim();
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return null;
  if (/^\/(?!\/)/.test(value)) {
    return { href: value, internal: true };
  }
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    if (/^(?:www\.)?txepro\.vn$/i.test(url.hostname)) {
      const path = (url.pathname || "/") + url.search + url.hash;
      return { href: path, internal: true };
    }
    return { href: url.href, internal: false };
  } catch {
    return null;
  }
}

function readAttr(attrs: string, name: string): string {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`, "i");
  const match = attrs.match(re);
  if (!match) return "";
  return decodeHtmlEntities(match[1] ?? match[2] ?? match[3] ?? "").trim();
}

function inlineToText(nodes: NewsInlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "br") return " ";
      return inlineToText(node.children);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMarkdownInline(text: string): NewsInlineNode[] {
  const nodes: NewsInlineNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const at = match.index;
    if (at > last) nodes.push({ type: "text", value: text.slice(last, at) });
    if (match[1] !== undefined && match[2] !== undefined) {
      const normalized = normalizeNewsHref(match[2]);
      if (normalized) {
        nodes.push({
          type: "link",
          href: normalized.href,
          internal: normalized.internal,
          children: [{ type: "text", value: match[1] }],
        });
      } else {
        nodes.push({ type: "text", value: match[1] });
      }
    } else if (match[3] !== undefined) {
      nodes.push({ type: "strong", children: [{ type: "text", value: match[3] }] });
    } else if (match[4] !== undefined) {
      nodes.push({ type: "em", children: [{ type: "text", value: match[4] }] });
    }
    last = at + match[0].length;
  }
  if (last < text.length) nodes.push({ type: "text", value: text.slice(last) });
  return nodes;
}

function parseInlineHtml(html: string): NewsInlineNode[] {
  const cleaned = html.replace(DANGEROUS_TAG_RE, "");
  type StackEntry =
    | { type: "root"; children: NewsInlineNode[] }
    | { type: "strong" | "em" | "del"; children: NewsInlineNode[] }
    | { type: "link"; href: string; internal: boolean; children: NewsInlineNode[] };

  const stack: StackEntry[] = [{ type: "root", children: [] }];
  const tokenRe = /<(\/)?([a-z][a-z0-9]*)([^>]*)>|([^<]+)/gi;

  const pushText = (raw: string) => {
    const decoded = decodeHtmlEntities(raw).replace(/\r/g, "");
    if (!decoded) return;
    const parent = stack[stack.length - 1];
    // Support markdown links if editors pasted markdown inside HTML paragraphs
    const parsed = /\[[^\]]+\]\(\/[^)\s]+\)/.test(decoded) ? parseMarkdownInline(decoded) : [{ type: "text" as const, value: decoded }];
    parent.children.push(...parsed);
  };

  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(cleaned)) !== null) {
    const [, closing, rawTag, attrs = "", text] = match;
    if (text !== undefined) {
      pushText(text);
      continue;
    }
    const tag = rawTag.toLowerCase();
    if (tag === "br") {
      if (!closing) stack[stack.length - 1].children.push({ type: "br" });
      continue;
    }
    if (tag === "p" || tag === "div") {
      if (closing) {
        const parent = stack[stack.length - 1].children;
        if (parent.length > 0 && parent[parent.length - 1].type !== "br") {
          parent.push({ type: "br" });
        }
      }
      continue;
    }
    const kind =
      tag === "strong" || tag === "b"
        ? "strong"
        : tag === "em" || tag === "i"
          ? "em"
          : tag === "del" || tag === "s" || tag === "strike"
            ? "del"
            : tag === "a"
              ? "link"
              : null;
    if (!kind) continue;

    if (!closing) {
      if (kind === "link") {
        const normalized = normalizeNewsHref(readAttr(attrs, "href"));
        if (normalized) {
          stack.push({ type: "link", href: normalized.href, internal: normalized.internal, children: [] });
        }
      } else {
        stack.push({ type: kind, children: [] });
      }
    } else {
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].type === kind) {
          const popped = stack.splice(i);
          let node: NewsInlineNode | null = null;
          for (let j = popped.length - 1; j >= 0; j--) {
            const entry = popped[j];
            if (node) entry.children.push(node);
            if (entry.type === "root") continue;
            if (entry.children.length === 0) {
              node = null;
            } else if (entry.type === "link") {
              node = { type: "link", href: entry.href, internal: entry.internal, children: entry.children };
            } else {
              node = { type: entry.type, children: entry.children };
            }
          }
          if (node) stack[stack.length - 1].children.push(node);
          break;
        }
      }
    }
  }

  while (stack.length > 1) {
    const entry = stack.pop()!;
    if (entry.type === "root" || entry.children.length === 0) continue;
    const node: NewsInlineNode =
      entry.type === "link"
        ? { type: "link", href: entry.href, internal: entry.internal, children: entry.children }
        : { type: entry.type, children: entry.children };
    stack[stack.length - 1].children.push(node);
  }

  const root = stack[0].children;
  while (root.length && root[0].type === "br") root.shift();
  while (root.length && root[root.length - 1].type === "br") root.pop();
  return root;
}

function parseTableHtml(innerHtml: string): NewsBlockNode | null {
  const rowMatches = Array.from(innerHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi));
  if (!rowMatches.length) return null;
  let headers: NewsInlineNode[][] = [];
  const rows: NewsInlineNode[][][] = [];
  for (let i = 0; i < rowMatches.length; i++) {
    const rowHtml = rowMatches[i][1];
    const cells = Array.from(rowHtml.matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi));
    if (!cells.length) continue;
    const parsedCells = cells.map((cell) => parseInlineHtml(cell[2]));
    const isHeaderRow = i === 0 && cells.every((cell) => cell[1].toLowerCase() === "th");
    if (isHeaderRow) headers = parsedCells;
    else rows.push(parsedCells);
  }
  if (!headers.length && !rows.length) return null;
  return { type: "table", headers, rows };
}

function extractImageBlock(tagAttrs: string, captionHtml?: string): NewsBlockNode | null {
  const src = resolveSafeNewsImage(readAttr(tagAttrs, "src"));
  if (!src) return null;
  const alt = readAttr(tagAttrs, "alt") || readAttr(tagAttrs, "title") || "";
  const caption = captionHtml ? inlineToText(parseInlineHtml(captionHtml)) : undefined;
  return { type: "image", src, alt, ...(caption ? { caption } : {}) };
}

function parseHtmlBlocks(html: string): NewsBlockNode[] {
  const cleaned = html.replace(DANGEROUS_TAG_RE, "").replace(/<!--[\s\S]*?-->/g, "");
  const blocks: NewsBlockNode[] = [];

  const blockRe =
    /<figure\b[^>]*>([\s\S]*?)<\/figure\s*>|<table\b[^>]*>([\s\S]*?)<\/table\s*>|<(ul|ol)\b[^>]*>([\s\S]*?)<\/\3\s*>|<blockquote\b[^>]*>([\s\S]*?)<\/blockquote\s*>|<(h[1-6])\b[^>]*>([\s\S]*?)<\/\6\s*>|<div\b([^>]*)>([\s\S]*?)<\/div\s*>|<p\b[^>]*>([\s\S]*?)<\/p\s*>|<img\b([^>]*?)\/?>|<hr\b[^>]*\/?>/gi;

  let lastIndex = 0;
  const pushLooseText = (segment: string) => {
    const inline = parseInlineHtml(segment);
    if (inlineToText(inline)) blocks.push({ type: "paragraph", children: inline });
  };

  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(cleaned)) !== null) {
    const index = match.index;
    if (index > lastIndex) pushLooseText(cleaned.slice(lastIndex, index));
    lastIndex = index + match[0].length;

    const [
      full,
      figureInner,
      tableInner,
      listTag,
      listInner,
      quoteInner,
      headingTag,
      headingInner,
      divAttrs,
      divInner,
      pInner,
      imgAttrs,
    ] = match;

    if (/^<hr\b/i.test(full)) {
      blocks.push({ type: "hr" });
      continue;
    }

    if (imgAttrs !== undefined) {
      const img = extractImageBlock(imgAttrs);
      if (img) blocks.push(img);
      continue;
    }

    if (figureInner !== undefined) {
      const imgMatch = figureInner.match(/<img\b([^>]*?)\/?>/i);
      const capMatch = figureInner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption\s*>/i);
      if (imgMatch) {
        const img = extractImageBlock(imgMatch[1], capMatch?.[1]);
        if (img) blocks.push(img);
      }
      continue;
    }

    if (tableInner !== undefined) {
      const table = parseTableHtml(tableInner);
      if (table) blocks.push(table);
      continue;
    }

    if (listTag !== undefined && listInner !== undefined) {
      const items = Array.from(listInner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi))
        .map((item) => parseInlineHtml(item[1]))
        .filter((item) => inlineToText(item).length > 0);
      if (items.length) {
        blocks.push({ type: "list", ordered: listTag.toLowerCase() === "ol", items });
      }
      continue;
    }

    if (quoteInner !== undefined) {
      const inline = parseInlineHtml(quoteInner);
      if (inlineToText(inline)) blocks.push({ type: "blockquote", children: inline });
      continue;
    }

    if (headingTag !== undefined && headingInner !== undefined) {
      const rawLevel = Number(headingTag.slice(1));
      const level: 2 | 3 | 4 = rawLevel <= 2 ? 2 : rawLevel === 3 ? 3 : 4;
      const children = parseInlineHtml(headingInner);
      const text = inlineToText(children);
      if (text) blocks.push({ type: "heading", level, text, children });
      continue;
    }

    if (divInner !== undefined) {
      const cls = readAttr(divAttrs || "", "class").split(/\s+/);
      if (cls.includes("card-note") || cls.includes("card-highlight")) {
        const variant = cls.includes("card-note") ? "note" : "highlight";
        const children = parseInlineHtml(divInner);
        if (inlineToText(children)) blocks.push({ type: "callout", variant, children });
      } else if (/<(?:p|div|h[1-6]|ul|ol|blockquote|hr|img|figure|table)\b/i.test(divInner)) {
        blocks.push(...parseHtmlBlocks(divInner));
      } else {
        const inline = parseInlineHtml(divInner);
        if (inlineToText(inline)) blocks.push({ type: "paragraph", children: inline });
      }
      continue;
    }

    if (pInner !== undefined) {
      // Split paragraphs that wrap inline <img> tags so images render cleanly as figures
      if (/<img\b/i.test(pInner)) {
        const parts = pInner.split(/(<img\b[^>]*?\/?>)/gi);
        for (const part of parts) {
          const imgMatch = part.match(/^<img\b([^>]*?)\/?>$/i);
          if (imgMatch) {
            const img = extractImageBlock(imgMatch[1]);
            if (img) blocks.push(img);
          } else {
            const inline = parseInlineHtml(part);
            if (inlineToText(inline)) blocks.push({ type: "paragraph", children: inline });
          }
        }
      } else {
        const inline = parseInlineHtml(pInner);
        if (inlineToText(inline)) blocks.push({ type: "paragraph", children: inline });
      }
    }
  }

  if (lastIndex < cleaned.length) pushLooseText(cleaned.slice(lastIndex));
  return blocks;
}

function parseMarkdownBlocks(input: string): NewsBlockNode[] {
  const blocks: NewsBlockNode[] = [];
  const chunks = input.replace(/\r/g, "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);

  for (const chunk of chunks) {
    if (/^---+$/.test(chunk)) {
      blocks.push({ type: "hr" });
      continue;
    }
    const headingMatch = chunk.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch && !chunk.includes("\n")) {
      const rawLevel = headingMatch[1].length;
      const level: 2 | 3 | 4 = rawLevel <= 2 ? 2 : rawLevel === 3 ? 3 : 4;
      const children = parseMarkdownInline(headingMatch[2].trim());
      const text = inlineToText(children);
      if (text) blocks.push({ type: "heading", level, text, children });
      continue;
    }
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => /^[-*•]\s+/.test(line))) {
      blocks.push({
        type: "list",
        ordered: false,
        items: lines.map((line) => parseMarkdownInline(line.replace(/^[-*•]\s+/, ""))),
      });
      continue;
    }
    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      blocks.push({
        type: "list",
        ordered: true,
        items: lines.map((line) => parseMarkdownInline(line.replace(/^\d+\.\s+/, ""))),
      });
      continue;
    }
    if (lines.every((line) => /^>\s*/.test(line))) {
      const text = lines.map((line) => line.replace(/^>\s*/, "")).join(" ");
      blocks.push({ type: "blockquote", children: parseMarkdownInline(text) });
      continue;
    }
    // Single-line heading followed by paragraph lines
    const firstHeading = lines[0]?.match(/^(#{1,4})\s+(.+)$/);
    if (firstHeading) {
      const rawLevel = firstHeading[1].length;
      const level: 2 | 3 | 4 = rawLevel <= 2 ? 2 : rawLevel === 3 ? 3 : 4;
      const children = parseMarkdownInline(firstHeading[2].trim());
      const text = inlineToText(children);
      if (text) blocks.push({ type: "heading", level, text, children });
      if (lines.length > 1) {
        blocks.push({ type: "paragraph", children: parseMarkdownInline(lines.slice(1).join(" ")) });
      }
      continue;
    }
    blocks.push({ type: "paragraph", children: parseMarkdownInline(lines.join("\n")) });
  }
  return blocks;
}

export function parseNewsContent(raw: string): ParsedNewsDocument {
  const input = (raw || "").trim();
  if (!input) return { blocks: [], headings: [] };

  const blocks = HTML_TAG_DETECT_RE.test(input) ? parseHtmlBlocks(input) : parseMarkdownBlocks(input);

  // Normalize heading hierarchy so CMS templates starting at <h3> -> <h4> don't skip <h2>
  const hasH2 = blocks.some((block) => block.type === "heading" && block.level === 2);
  if (!hasH2 && blocks.some((block) => block.type === "heading" && block.level === 3)) {
    for (const block of blocks) {
      if (block.type === "heading" && block.level > 2) {
        block.level = (block.level - 1) as 2 | 3;
      }
    }
  }

  const headings: { id: string; title: string }[] = [];
  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      const id = "phan-" + headings.length;
      block.id = id;
      headings.push({ id, title: block.text });
    }
  }

  return { blocks, headings };
}

function countLinksInInline(nodes: NewsInlineNode[], counts: { internal: number; external: number }) {
  for (const node of nodes) {
    if (node.type === "link") {
      if (node.internal) counts.internal++;
      else counts.external++;
      countLinksInInline(node.children, counts);
    } else if (node.type === "strong" || node.type === "em" || node.type === "del") {
      countLinksInInline(node.children, counts);
    }
  }
}

export function extractNewsSeoStats(raw: string): NewsSeoStats {
  const { blocks } = parseNewsContent(raw);
  let h2Count = 0;
  let h3Count = 0;
  let imageCount = 0;
  let imagesMissingAlt = 0;
  const links = { internal: 0, external: 0 };
  const textParts: string[] = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      if (block.level === 2) h2Count++;
      else if (block.level === 3) h3Count++;
      textParts.push(block.text);
      countLinksInInline(block.children, links);
    } else if (block.type === "paragraph" || block.type === "blockquote" || block.type === "callout") {
      textParts.push(inlineToText(block.children));
      countLinksInInline(block.children, links);
    } else if (block.type === "list") {
      for (const item of block.items) {
        textParts.push(inlineToText(item));
        countLinksInInline(item, links);
      }
    } else if (block.type === "image") {
      imageCount++;
      if (!block.alt.trim()) imagesMissingAlt++;
      if (block.caption) textParts.push(block.caption);
    } else if (block.type === "table") {
      for (const cell of block.headers) {
        textParts.push(inlineToText(cell));
        countLinksInInline(cell, links);
      }
      for (const row of block.rows) {
        for (const cell of row) {
          textParts.push(inlineToText(cell));
          countLinksInInline(cell, links);
        }
      }
    }
  }

  const plain = textParts.join(" ").trim();
  const wordCount = plain ? plain.split(/\s+/).length : 0;

  return {
    wordCount,
    h2Count,
    h3Count,
    imageCount,
    imagesMissingAlt,
    internalLinkCount: links.internal,
    externalLinkCount: links.external,
  };
}
