import { existsSync } from 'node:fs';
import chromium from '@sparticuz/chromium';
import type { Browser, BrowserContext, Page } from 'puppeteer-core';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';

const OFFICIAL_RANKING_URL = 'https://mabinogimobile.nexon.com/Ranking/List';
const LOCAL_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_SIZE = 20;
const MAX_RANK_PER_SERVER = 200;
const MAX_PAGES_PER_SERVER = Math.ceil(MAX_RANK_PER_SERVER / PAGE_SIZE);
const PAGES_PER_SESSION = 30;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const SERVERS = [
  { id: '1', name: '데이안' },
  { id: '2', name: '아이라' },
  { id: '3', name: '던컨' },
  { id: '4', name: '알리사' },
  { id: '5', name: '메이븐' },
  { id: '6', name: '라사' },
  { id: '7', name: '칼릭스' },
];

const RANKING_TYPES = [
  { name: 'total', code: '4' },
  { name: 'combat', code: '1' },
  { name: 'charm', code: '2' },
  { name: 'life', code: '3' },
];

export interface RankingData {
  rank: number;
  server: string;
  characterName: string;
  job: string;
  score: number;
  rankingType: string;
}

async function launchBrowser(): Promise<Browser> {
  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];

  if (process.env.VERCEL) {
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }

  if (existsSync(LOCAL_CHROME_PATH)) {
    return puppeteer.launch({
      executablePath: LOCAL_CHROME_PATH,
      headless: true,
      args: launchArgs,
    });
  }

  return puppeteer.launch({
    headless: true,
    args: launchArgs,
  });
}

async function createRankingPage(browser: Browser, rankingTypeCode: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(USER_AGENT);
  await page.goto(`${OFFICIAL_RANKING_URL}?t=${rankingTypeCode}`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('보안 검사를 진행해 주세요') || bodyText.includes('Enable JavaScript and cookies')) {
    throw new Error(`Blocked by Cloudflare challenge for ranking type ${rankingTypeCode}.`);
  }

  await page.waitForSelector('.pagination[data-mm-paging], .list .item', { timeout: 30000 });

  return { context, page };
}

async function fetchRankingChunk(
  page: Page,
  rankingType: { name: string; code: string },
  server: { id: string; name: string },
  pageStart: number,
  pageEnd: number
): Promise<{ items: RankingData[]; totalPages: number }> {
  return page.evaluate(async function ({ rankingType, server, pageStart, pageEnd, pageSize }) {
    function parseNumber(value: string | null | undefined) {
      return Number((value ?? '').replace(/[^\d]/g, ''));
    }

    function buildFormData(pageNo: number) {
      const form = new FormData();
      form.append('t', rankingType.code);
      form.append('pageno', String(pageNo));
      form.append('s', server.id);
      form.append('c', '0');
      form.append('search', '');
      return form;
    }

    function parseHtml(html: string) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const totalCount = parseNumber(doc.querySelector('.pagination')?.getAttribute('data-totalcount'));

      const items = Array.from(doc.querySelectorAll('.list .item'))
        .map((item) => {
          const blocks = Array.from(item.querySelectorAll('dl'));
          const findValueByLabel = (label: string) => {
            return blocks.find((block) => block.querySelector('dt')?.textContent?.includes(label))?.querySelector('dd')?.textContent?.trim() ?? '';
          };

          const rank = parseNumber(blocks[0]?.querySelector('dt')?.textContent);
          const characterName = item.querySelector('[data-charactername]')?.textContent?.trim() ?? '';
          const job = findValueByLabel('클래스');
          const serverName = findValueByLabel('서버명') || server.name;

          const scoreBlock = blocks.find((block) => {
            const label = block.querySelector('dt')?.textContent ?? '';
            return label.includes('점수') || label.includes('전투력') || label.includes('생활력') || label.includes('매력');
          });

          const scoreValue =
            scoreBlock?.querySelector('dt span:last-child')?.textContent?.trim() ??
            Array.from(scoreBlock?.querySelectorAll('dd span') ?? []).map((span) => span.textContent?.trim() ?? '').find(Boolean) ??
            scoreBlock?.querySelector('dd')?.textContent?.trim() ??
            scoreBlock?.querySelector('dt')?.textContent?.trim() ??
            '';

          const score = parseNumber(scoreValue);

          if (!rank || !score || !characterName) {
            return null;
          }

          return {
            rank,
            server: serverName,
            characterName,
            job,
            score,
            rankingType: rankingType.name,
          };
        })
        .filter(Boolean) as RankingData[];

      return {
        totalCount,
        items,
      };
    }

    async function fetchPageHtml(pageNo: number) {
      const response = await fetch('/Ranking/List/rankdata', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: buildFormData(pageNo),
        credentials: 'include',
      });

      const html = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to fetch rankdata: ${response.status}`);
      }

      return html;
    }

    const items: RankingData[] = [];
    let totalPages = pageEnd;

    for (let pageNo = pageStart; pageNo <= pageEnd; pageNo += 1) {
      const html = await fetchPageHtml(pageNo);
      const parsed = parseHtml(html);

      if (pageNo === pageStart) {
        if (parsed.items.length === 0) {
          const isChallengePage =
            html.includes('보안 검사를 진행해 주세요') ||
            html.includes('Enable JavaScript and cookies');

          throw new Error(
            isChallengePage
              ? `Blocked by Cloudflare challenge for ${rankingType.name}/${server.name}.`
              : `No ranking items found for ${rankingType.name}/${server.name} at page ${pageNo}.`
          );
        }

        totalPages = Math.max(1, Math.ceil((parsed.totalCount || parsed.items.length) / pageSize));
      }

      items.push(...parsed.items);
    }

    return {
      items,
      totalPages,
    };
  }, { rankingType, server, pageStart, pageEnd, pageSize: PAGE_SIZE });
}

export async function crawlRankingData(): Promise<RankingData[]> {
  try {
    const allResults: RankingData[] = [];

    for (const rankingType of RANKING_TYPES) {
      console.log(`Starting crawl for Ranking Type: ${rankingType.name} (code: ${rankingType.code})`);
      const browser = await launchBrowser();

      try {
        for (const server of SERVERS) {
          console.log(`Processing server: ${server.name} for ${rankingType.name}`);

          let currentPage = 1;
          let totalPages = MAX_PAGES_PER_SERVER;

          while (currentPage <= totalPages) {
            const chunkEnd = Number.isFinite(totalPages)
              ? Math.min(currentPage + PAGES_PER_SESSION - 1, totalPages)
              : currentPage + PAGES_PER_SESSION - 1;

            const { context, page } = await createRankingPage(browser, rankingType.code);

            try {
              const result = await fetchRankingChunk(page, rankingType, server, currentPage, chunkEnd);
              totalPages = Math.min(result.totalPages, MAX_PAGES_PER_SERVER);
              allResults.push(...result.items);
              console.log(`  - Pages ${currentPage}-${Math.min(chunkEnd, totalPages)} fetched for ${server.name} (${rankingType.name})`);
              currentPage = chunkEnd + 1;
            } finally {
              await context.close();
            }
          }
        }
      } finally {
        await browser.close();
      }
    }

    return allResults;
  } catch (error) {
    console.error('Crawling failed:', error);
    return [];
  }
}
