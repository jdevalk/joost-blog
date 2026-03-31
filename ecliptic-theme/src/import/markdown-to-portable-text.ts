/**
 * Converts markdown text to Portable Text blocks.
 *
 * Handles: paragraphs, headings (h1-h6), bold, italic, bold+italic,
 * links, inline code, code blocks, blockquotes, unordered/ordered lists,
 * images, horizontal rules, and HTML blocks.
 */

interface PortableTextSpan {
  _type: "span";
  text: string;
  marks?: string[];
}

interface PortableTextBlock {
  _type: "block";
  _key?: string;
  style?: string;
  children: PortableTextSpan[];
  markDefs?: Array<{ _key: string; _type: string; href?: string }>;
  listItem?: "bullet" | "number";
  level?: number;
}

interface PortableTextCodeBlock {
  _type: "code";
  _key?: string;
  code: string;
  language?: string;
}

interface PortableTextImage {
  _type: "image";
  _key?: string;
  asset: { url: string };
  alt?: string;
}

interface PortableTextBreak {
  _type: "break";
  _key?: string;
  style: "lineBreak";
}

type PortableTextNode =
  | PortableTextBlock
  | PortableTextCodeBlock
  | PortableTextImage
  | PortableTextBreak;

let keyCounter = 0;
function generateKey(): string {
  return `k${++keyCounter}`;
}

/**
 * Parse inline markdown into spans with marks and markDefs.
 */
function parseInline(
  text: string
): { children: PortableTextSpan[]; markDefs: Array<{ _key: string; _type: string; href?: string }> } {
  const children: PortableTextSpan[] = [];
  const markDefs: Array<{ _key: string; _type: string; href?: string }> = [];

  // Tokenize inline markdown
  const tokens: Array<{ text: string; marks: string[]; href?: string }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Inline code
    let match = remaining.match(/^`([^`]+)`/);
    if (match) {
      tokens.push({ text: match[1], marks: ["code"] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Image: ![alt](url)
    match = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      // Images in inline context — render as text placeholder
      tokens.push({ text: `[Image: ${match[1] || match[2]}]`, marks: [] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Link: [text](url)
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      tokens.push({ text: match[1], marks: ["link"], href: match[2] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold + italic: ***text*** or ___text___
    match = remaining.match(/^(\*{3}|_{3})(.+?)\1/);
    if (match) {
      tokens.push({ text: match[2], marks: ["strong", "em"] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold: **text** or __text__
    match = remaining.match(/^(\*{2}|_{2})(.+?)\1/);
    if (match) {
      tokens.push({ text: match[2], marks: ["strong"] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic: *text* or _text_
    match = remaining.match(/^(\*|_)(.+?)\1/);
    if (match) {
      tokens.push({ text: match[2], marks: ["em"] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Plain text until next special character
    match = remaining.match(/^[^*_`\[!]+/);
    if (match) {
      tokens.push({ text: match[0], marks: [] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Single special char that didn't match a pattern
    tokens.push({ text: remaining[0], marks: [] });
    remaining = remaining.slice(1);
  }

  // Convert tokens to spans
  for (const token of tokens) {
    const marks: string[] = [];
    for (const mark of token.marks) {
      if (mark === "link" && token.href) {
        const key = generateKey();
        markDefs.push({ _key: key, _type: "link", href: token.href });
        marks.push(key);
      } else {
        marks.push(mark);
      }
    }
    children.push({
      _type: "span",
      text: token.text,
      ...(marks.length > 0 ? { marks } : {}),
    });
  }

  if (children.length === 0) {
    children.push({ _type: "span", text: "" });
  }

  return { children, markDefs };
}

/**
 * Convert a markdown string to an array of Portable Text blocks.
 */
export function markdownToPortableText(markdown: string): PortableTextNode[] {
  keyCounter = 0;
  const blocks: PortableTextNode[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block
    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch) {
      const language = codeMatch[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        _type: "code",
        _key: generateKey(),
        code: codeLines.join("\n"),
        ...(language ? { language } : {}),
      });
      continue;
    }

    // HTML block (starts with <div, <section, <figure, <table, <iframe, etc.)
    const htmlBlockMatch = line.match(
      /^<(div|section|figure|table|iframe|details|aside|nav|form|video|audio|picture)\b/i
    );
    if (htmlBlockMatch) {
      const tag = htmlBlockMatch[1].toLowerCase();
      const htmlLines: string[] = [line];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        const openMatches = lines[i].match(new RegExp(`<${tag}\\b`, "gi"));
        const closeMatches = lines[i].match(new RegExp(`</${tag}>`, "gi"));
        if (openMatches) depth += openMatches.length;
        if (closeMatches) depth -= closeMatches.length;
        htmlLines.push(lines[i]);
        i++;
      }
      // Store HTML blocks as code blocks with html language
      blocks.push({
        _type: "code",
        _key: generateKey(),
        code: htmlLines.join("\n"),
        language: "html",
      });
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({
        _type: "break",
        _key: generateKey(),
        style: "lineBreak",
      });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const { children, markDefs } = parseInline(headingMatch[2]);
      blocks.push({
        _type: "block",
        _key: generateKey(),
        style: `h${level}`,
        children,
        ...(markDefs.length > 0 ? { markDefs } : {}),
      });
      i++;
      continue;
    }

    // Standalone image line: ![alt](url)
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      blocks.push({
        _type: "image",
        _key: generateKey(),
        asset: { url: imageMatch[2] },
        ...(imageMatch[1] ? { alt: imageMatch[1] } : {}),
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ") || line === ">") {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const { children, markDefs } = parseInline(quoteLines.join(" "));
      blocks.push({
        _type: "block",
        _key: generateKey(),
        style: "blockquote",
        children,
        ...(markDefs.length > 0 ? { markDefs } : {}),
      });
      continue;
    }

    // Unordered list
    if (/^[\-\*\+]\s/.test(line)) {
      while (i < lines.length && /^[\-\*\+]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[\-\*\+]\s+/, "");
        const { children, markDefs } = parseInline(itemText);
        blocks.push({
          _type: "block",
          _key: generateKey(),
          style: "normal",
          listItem: "bullet",
          level: 1,
          children,
          ...(markDefs.length > 0 ? { markDefs } : {}),
        });
        i++;
      }
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, "");
        const { children, markDefs } = parseInline(itemText);
        blocks.push({
          _type: "block",
          _key: generateKey(),
          style: "normal",
          listItem: "number",
          level: 1,
          children,
          ...(markDefs.length > 0 ? { markDefs } : {}),
        });
        i++;
      }
      continue;
    }

    // Regular paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !/^[\-\*\+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^(---|\*\*\*|___)\s*$/.test(lines[i]) &&
      !/^<(div|section|figure|table|iframe|details|aside|nav|form|video|audio|picture)\b/i.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      const text = paraLines.join("\n");
      const { children, markDefs } = parseInline(text);
      blocks.push({
        _type: "block",
        _key: generateKey(),
        style: "normal",
        children,
        ...(markDefs.length > 0 ? { markDefs } : {}),
      });
    }
  }

  return blocks;
}
