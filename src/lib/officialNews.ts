import { decodeHtmlEntities, htmlToPlainText } from "@/lib/text";
import { logger } from "@/lib/logger";

export type OfficialNewsKind = "notice" | "update" | "event";

export type OfficialNewsItem = {
  id: string;
  kind: OfficialNewsKind;
  title: string;
  href: string;
  dateLabel: string;
  likeCount: number;
  badge?: string;
  imageUrl?: string;
};

export type OfficialNewsCollection = {
  notices: OfficialNewsItem[];
  updates: OfficialNewsItem[];
  events: OfficialNewsItem[];
};

type FeedConfig = {
  kind: OfficialNewsKind;
  listUrl: string;
  detailBasePath: string;
  maxItems: number;
};

const OFFICIAL_NEWS_FETCH_HEADERS = {
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

export const OFFICIAL_NEWS_URLS = {
  notices: "https://mabinogimobile.nexon.com/News/Notice",
  updates: "https://mabinogimobile.nexon.com/News/Update",
  events: "https://mabinogimobile.nexon.com/News/Events?headlineId=2501",
} as const;

const FEEDS: FeedConfig[] = [
  {
    kind: "notice",
    listUrl: OFFICIAL_NEWS_URLS.notices,
    detailBasePath: "https://mabinogimobile.nexon.com/News/Notice",
    maxItems: 4,
  },
  {
    kind: "update",
    listUrl: OFFICIAL_NEWS_URLS.updates,
    detailBasePath: "https://mabinogimobile.nexon.com/News/Update",
    maxItems: 4,
  },
  {
    kind: "event",
    listUrl: OFFICIAL_NEWS_URLS.events,
    detailBasePath: "https://mabinogimobile.nexon.com/News/Events",
    maxItems: 3,
  },
];

const LIST_ITEM_PATTERN = /<li class="item\s*"[^>]*data-mm-listitem[^>]*data-threadid="(\d+)"[^>]*>([\s\S]*?)<\/li>/g;

function cleanText(value: string | undefined) {
  return htmlToPlainText(decodeHtmlEntities(value ?? ""))
    .replace(/\s+/g, " ")
    .trim();
}

function extractText(block: string, pattern: RegExp) {
  const match = block.match(pattern);
  return cleanText(match?.[1]);
}

function extractLikeCount(block: string) {
  const raw = extractText(block, /<span data-mm-threadlikecount>([\s\S]*?)<\/span>/);
  const parsed = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseFeedItems(html: string, config: FeedConfig): OfficialNewsItem[] {
  const items: OfficialNewsItem[] = [];

  for (const match of html.matchAll(LIST_ITEM_PATTERN)) {
    const id = match[1];
    const block = match[2];
    const title = extractText(block, /class="title[^"]*"[^>]*>\s*<span>([\s\S]*?)<\/span>/);
    const dateLabel = extractText(block, /<div class="date">\s*<span>\s*([\s\S]*?)\s*<\/span>/);
    const badge =
      config.kind === "event"
        ? extractText(block, /<div class="type">\s*([\s\S]*?)\s*<\/div>/)
        : extractText(block, /<div class="type">\s*<span>([\s\S]*?)<\/span>\s*<\/div>/);
    const imageUrl =
      config.kind === "event"
        ? extractText(block, /<img src="([^"]+)"/)
        : undefined;

    if (!id || !title || !dateLabel) {
      continue;
    }

    items.push({
      id,
      kind: config.kind,
      title,
      href: `${config.detailBasePath}/${id}`,
      dateLabel,
      likeCount: extractLikeCount(block),
      badge: badge || undefined,
      imageUrl: imageUrl || undefined,
    });

    if (items.length >= config.maxItems) {
      break;
    }
  }

  return items;
}

async function fetchFeed(config: FeedConfig): Promise<OfficialNewsItem[]> {
  const response = await fetch(config.listUrl, {
    headers: OFFICIAL_NEWS_FETCH_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${config.kind} feed: ${response.status}`);
  }

  const html = await response.text();
  if (html.includes("Enable JavaScript and cookies") || html.includes("보안 검사를 진행해 주세요")) {
    throw new Error(`Blocked while loading ${config.kind} feed.`);
  }

  return parseFeedItems(html, config);
}

export async function getOfficialNewsCollection(): Promise<OfficialNewsCollection> {
  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)));

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.warn(`Official ${FEEDS[index]?.kind ?? "unknown"} news load failed:`, result.reason);
    }
  });

  return {
    notices: results[0]?.status === "fulfilled" ? results[0].value : [],
    updates: results[1]?.status === "fulfilled" ? results[1].value : [],
    events: results[2]?.status === "fulfilled" ? results[2].value : [],
  };
}
