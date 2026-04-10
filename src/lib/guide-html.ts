import sanitizeHtml from "sanitize-html";
import { htmlToPlainText } from "@/lib/text";

export const GUIDE_CONTENT_SANITIZER_VERSION = 1;

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const RGB_COLOR_PATTERN =
  /^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const TEXT_ALIGN_PATTERN = /^(?:left|right|center|justify)$/;
const IMAGE_LENGTH_PATTERN = /^\d+(?:px|%)$/;

const GUIDE_ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "u",
  "ul",
];

const GUIDE_ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
  h4: ["style"],
  h5: ["style"],
  h6: ["style"],
  img: ["src", "alt", "width", "height", "style"],
  li: ["style"],
  ol: ["style"],
  p: ["style"],
  span: ["style"],
  ul: ["style"],
} satisfies sanitizeHtml.IOptions["allowedAttributes"];

const GUIDE_ALLOWED_STYLES = {
  "*": {
    color: [HEX_COLOR_PATTERN, RGB_COLOR_PATTERN],
    "text-align": [TEXT_ALIGN_PATTERN],
  },
  img: {
    height: [IMAGE_LENGTH_PATTERN],
    width: [IMAGE_LENGTH_PATTERN],
  },
} satisfies sanitizeHtml.IOptions["allowedStyles"];

const GUIDE_SANITIZE_OPTIONS = {
  allowedAttributes: GUIDE_ALLOWED_ATTRIBUTES,
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowedStyles: GUIDE_ALLOWED_STYLES,
  allowedTags: GUIDE_ALLOWED_TAGS,
  allowProtocolRelative: false,
  parseStyleAttributes: true,
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href?.trim();
      const nextAttribs = { ...attribs };

      if (!href) {
        delete nextAttribs.target;
        delete nextAttribs.rel;
        return { attribs: nextAttribs, tagName };
      }

      const isExternalHref =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:");

      if (isExternalHref) {
        nextAttribs.target = "_blank";
        nextAttribs.rel = "noopener noreferrer nofollow";
      } else {
        delete nextAttribs.target;
        delete nextAttribs.rel;
      }

      return { attribs: nextAttribs, tagName };
    },
  },
} satisfies sanitizeHtml.IOptions;

export function sanitizeGuideTitle(title: string): string {
  return htmlToPlainText(title ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeGuideHtml(html: string): string {
  return sanitizeHtml(html ?? "", GUIDE_SANITIZE_OPTIONS).trim();
}

export function hasRenderableGuideContent(html: string): boolean {
  return htmlToPlainText(html).length > 0 || /<img\b/i.test(html);
}
