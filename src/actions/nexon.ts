"use server";

export interface MabinogiEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  thumbnail: string;
  link: string;
}

export async function getMabinogiEvents(): Promise<MabinogiEvent[]> {
  try {
    const response = await fetch("https://mabinogimobile.nexon.com/News/Events?headlineId=2501", {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const html = await response.text();

    const events: MabinogiEvent[] = [];
    
    // Regex to match list items
    // This is a simplified regex and might be brittle, but sufficient for this task without cheerio
    const itemRegex = /<li class="item " data-mm-listitem data-threadid="(\d+)">([\s\S]*?)<\/li>/g;
    
    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      const id = match[1];
      const content = match[2];
      
      // Extract Thumbnail
      const imgMatch = content.match(/<img src="([^"]+)"/);
      const thumbnail = imgMatch ? imgMatch[1] : "";
      
      // Extract Type (Status)
      const typeMatch = content.match(/<div class="type">([^<]+)<\/div>/);
      const status = typeMatch ? typeMatch[1].trim() : "";
      
      // Extract Title
      const titleMatch = content.match(/<a[^>]*class="title[^"]*"[^>]*>\s*<span>([^<]+)<\/span>/);
      const title = titleMatch ? titleMatch[1].trim() : "";
      
      // Extract Date
      const dateMatch = content.match(/<div class="date">\s*<span>([\s\S]*?)<\/span>/);
      const date = dateMatch ? dateMatch[1].replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim() : "";
      
      if (id && title) {
        events.push({
          id,
          title,
          date,
          status,
          thumbnail,
          link: `https://mabinogimobile.nexon.com/News/Events/View?n4ArticleSN=${id}`,
        });
      }
    }

    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}
