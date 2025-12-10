import puppeteer from 'puppeteer';

const SERVERS = ['데이안', '아이라', '던컨', '알리사', '메이븐', '라사', '칼릭스'];

const RANKING_TYPES = [
    { name: 'total', code: 4 },
    { name: 'combat', code: 1 },
    { name: 'charm', code: 2 },
    { name: 'life', code: 3 }
];

export interface RankingData {
  rank: number;
  server: string;
  characterName: string;
  job: string;
  score: number;
  rankingType: string;
}

export async function crawlRankingData(): Promise<RankingData[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const allResults: RankingData[] = [];

  try {
    const page = await browser.newPage();
    // Set viewport large enough
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Loop through Ranking Types
    for (const rType of RANKING_TYPES) {
        console.log(`Starting crawl for Ranking Type: ${rType.name} (code: ${rType.code})`);

        // Navigate to the specific ranking type page
        console.log(`Navigating to https://mabinogimobile.nexon.com/Ranking/List?t=${rType.code}`);
        await page.goto(`https://mabinogimobile.nexon.com/Ranking/List?t=${rType.code}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        // Check Cloudflare
        const title = await page.title();
        if (title.includes('Just a moment')) {
            console.error('Blocked by Cloudflare challenge.');
            continue; // Verify next type if this one fails? Or abort? Abort seems safer.
            // But let's verify if just a fluke.
        }

        // Wait for initial load
        try {
            await page.waitForSelector('.ranking_box, .ranking_list, li', { timeout: 10000 });
        } catch(e) { console.log('Wait timeout, continuing...'); }

        // Loop through servers for this type
        for (const serverName of SERVERS) {
            console.log(`Processing server: ${serverName} for ${rType.name}`);
            
            // Switch Server
            if (serverName !== '데이안') {
                try {
                    // Click Dropdown
                    await page.evaluate(() => {
                        const dropdowns = document.querySelectorAll('.select_box, .dropdown, .select');
                        let serverDropdown = dropdowns[0]; 
                        if (serverDropdown) (serverDropdown as HTMLElement).click();
                    });
                    
                    await new Promise(r => setTimeout(r, 500)); 

                    // Click Option
                    await page.evaluate((targetServer) => {
                        const options = document.querySelectorAll('li, .option, a');
                        for (const opt of options) {
                            if ((opt as HTMLElement).innerText.includes(targetServer)) {
                                (opt as HTMLElement).click();
                                return;
                            }
                        }
                    }, serverName);

                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    console.error(`Failed to switch to server ${serverName}:`, e);
                    continue; 
                }
            } else {
                await new Promise(r => setTimeout(r, 1000));
            }

            // Scroll for more data (Optimized: less scrolls to save time, 3 times is ~60-80 items)
            try {
                for (let i = 0; i < 3; i++) {
                    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
                    await new Promise(r => setTimeout(r, 800));
                }
            } catch (e) {
                console.log('Scroll failed...');
            }

            // Scrape
            const serverData = await page.evaluate((currentServer, currentType) => {
                const results: RankingData[] = [];
                const rows = document.querySelectorAll('.ranking_list li, .tbl_list tr, li');
                
                rows.forEach((row) => {
                    const el = row as HTMLElement;
                    const text = el.innerText.trim().split('\n').map(t => t.trim()).filter(t => t);
                    
                    if (text.length >= 4) {
                        const rankMatch = text[0].match(/^(\d+)위?$/);
                        if (!rankMatch) return;
                        
                        const rank = parseInt(rankMatch[1], 10);
                        
                        let name = '';
                        let job = '';
                        let scoreStr = '';
                        
                        // Text parsing logic heuristic
                        if (text.length >= 5) {
                             name = text[2];
                             job = text[3];
                             scoreStr = text[4];
                        } else {
                             name = text[1];
                             job = text[2];
                             scoreStr = text[3];
                        }
                        
                        const score = parseInt(scoreStr.replace(/,/g, ''), 10);

                        if (!isNaN(rank) && !isNaN(score) && name) {
                            results.push({
                                rank,
                                server: currentServer,
                                characterName: name,
                                job,
                                score,
                                rankingType: currentType
                            });
                        }
                    }
                });
                return results;
            }, serverName, rType.name);

            console.log(`  - Found ${serverData.length} entries for ${serverName} (${rType.name})`);
            allResults.push(...serverData);
            
            // Should current server be reset to '데이안' for next iteration? 
            // The site might persist selection. 
            // But we iterate "serverName of SERVERS". Next loop we check "if !== 데이안".
            // If we are at '아이라' and next is '던컨', we try to switch.
            // If current is '칼릭스' and next type starts, we reload page via goto(), so it defaults reset usually.
        }
    }

    return allResults;

  } catch (error) {
    console.error('Crawling failed:', error);
    return allResults; // Return whatever we got
  } finally {
    await browser.close();
  }
}
