import Parser from 'rss-parser';
import type { NewsItem } from '../types.ts';

export interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  logoText: string;
  category: string;
  categoryDefault?: string;
}

export const RSS_SOURCES: RssSourceConfig[] = [
  {
    id: 'balkanweb-kryesore',
    name: 'BalkanWeb',
    url: 'https://balkanweb.com/feed/',
    logoText: 'BALKANWEB',
    category: 'Aktualitet'
  },
  {
    id: 'balkanweb-shqiperi',
    name: 'BalkanWeb Shqipëri',
    url: 'https://balkanweb.com/category/shqiperi/feed/',
    logoText: 'BALKANWEB',
    category: 'Shqipëri',
    categoryDefault: 'shqiperi'
  },
  {
    id: 'balkanweb-politike',
    name: 'BalkanWeb Politikë',
    url: 'https://balkanweb.com/category/politike/feed/',
    logoText: 'BALKANWEB',
    category: 'Politikë',
    categoryDefault: 'politike'
  },
  {
    id: 'balkanweb-kronike',
    name: 'BalkanWeb Kronikë',
    url: 'https://balkanweb.com/category/kronike/feed/',
    logoText: 'BALKANWEB',
    category: 'Kronikë',
    categoryDefault: 'kronike'
  },
  {
    id: 'balkanweb-ekonomi',
    name: 'BalkanWeb Ekonomi',
    url: 'https://balkanweb.com/category/ekonomi/feed/',
    logoText: 'BALKANWEB',
    category: 'Ekonomi',
    categoryDefault: 'ekonomi'
  },
  {
    id: 'balkanweb-bota',
    name: 'BalkanWeb Bota',
    url: 'https://balkanweb.com/category/bota/feed/',
    logoText: 'BALKANWEB',
    category: 'Bota',
    categoryDefault: 'bota'
  },
  {
    id: 'euronewsal',
    name: 'Euronews AL',
    url: 'https://euronews.al/feed/',
    logoText: 'EURONEWS',
    category: 'Shqipëri & Rajon'
  },
  {
    id: 'euronewsal-rajoni',
    name: 'Euronews Rajoni',
    url: 'https://euronews.al/category/rajoni/feed/',
    logoText: 'EURONEWS',
    category: 'Bota & Rajoni',
    categoryDefault: 'bota'
  },
  {
    id: 'telegrafi',
    name: 'Telegrafi',
    url: 'https://telegrafi.com/feed/',
    logoText: 'TELEGRAFI',
    category: 'Aktualitet'
  },
  {
    id: 'gazetaexpress',
    name: 'Gazeta Express',
    url: 'https://www.gazetaexpress.com/feed/',
    logoText: 'EXPRESS',
    category: 'Kryesore'
  },
  {
    id: 'koha',
    name: 'Koha.net',
    url: 'https://www.koha.net/rss',
    logoText: 'KOHA',
    category: 'Vendi',
    categoryDefault: 'kosove'
  },
  {
    id: 'reporteri',
    name: 'Reporteri',
    url: 'https://reporteri.net/feed/',
    logoText: 'REPORTERI',
    category: 'Investigim'
  },
  {
    id: 'lajminet',
    name: 'Lajmi.net',
    url: 'https://lajmi.net/feed/',
    logoText: 'LAJMI.NET',
    category: 'Lajme',
    categoryDefault: 'kosove'
  },
  {
    id: 'indeksonline',
    name: 'IndeksOnline',
    url: 'https://indeksonline.net/feed/',
    logoText: 'INDEKS',
    category: 'Kryesore',
    categoryDefault: 'kosove'
  }
];

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'creator']
    ]
  }
});

// Cache in memory
interface CachedFeed {
  lastFetched: number;
  items: NewsItem[];
}

let feedCache: CachedFeed | null = null;
const CACHE_TTL_MS = 2.5 * 60 * 1000; // 2.5 minutes cache for ultra responsiveness

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/<[^>]*>/g, '') // strip remaining tags
    .trim();
}

function cleanHeadline(title: string, sourceName: string): string {
  let cleaned = decodeHtmlEntities(title);
  // Remove trailing source branding if attached, e.g. " - Telegrafi", " | Euronews Albania", " - Gazeta Express"
  cleaned = cleaned.replace(new RegExp(`\\s*[-–|/:]\\s*${sourceName}.*$`, 'i'), '');
  cleaned = cleaned.replace(/\s*[-–|/:]\s*(KOHA(\.net)?|Telegrafi|Gazeta Express|Euronews|BalkanWeb|Reporteri|Lajmi\.net)\s*$/i, '');
  cleaned = cleaned.replace(/\s*\((FOTO|VIDEO|FOTOT|VIDEOT)\)\s*$/i, '');
  return cleaned.trim();
}

function splitHeadlineIntoLines(title: string): string[] {
  // If title is short (<= 45 chars), keep 1 line
  if (title.length <= 45) return [title];

  // Try splitting by colon or dash
  if (title.includes(': ') && title.indexOf(': ') < 45) {
    const parts = title.split(': ');
    if (parts.length === 2 && parts[0].length > 10 && parts[1].length > 15) {
      return [parts[0] + ':', parts[1]];
    }
  }

  // Split nicely around middle whitespace
  const words = title.split(' ');
  if (words.length <= 4) return [title];

  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  return [line1, line2];
}

function isBreakingNewsKeyword(text: string): boolean {
  const upper = text.toUpperCase();
  const keywords = [
    'URGJENTE',
    'E FUNDIT',
    'BREAKING',
    'LAJM I FUNDIT',
    'ALARM',
    'TRONDITËSE',
    'TRONDITESE',
    'ATENTAT',
    'EMERGJENCË',
    'EMERGJENCE',
    'EKSPORT',
    'KATASTROF'
  ];
  return keywords.some(k => upper.includes(k));
}

function extractImage(item: any): string | null {
  // 1. Check mediaContent
  if (item.mediaContent && Array.isArray(item.mediaContent)) {
    for (const mc of item.mediaContent) {
      const url = mc?.$?.url || mc?.url;
      if (url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        return url;
      }
    }
  }

  // 2. Check enclosure
  if (item.enclosure) {
    const url = item.enclosure?.$?.url || item.enclosure?.url;
    if (url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      const type = (item.enclosure?.$?.type || item.enclosure?.type || '').toLowerCase();
      if (!type || type.includes('image') || /\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        return url;
      }
    }
  }

  // 3. Check regex match in content, contentEncoded, description
  const combined = `${item.content || ''} ${item.contentEncoded || ''} ${item.description || ''}`;
  const imgMatch = combined.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const url = imgMatch[1];
    // Avoid tiny tracker pixels or icons
    if (!url.includes('1x1') && !url.includes('pixel') && !url.includes('favicon')) {
      return url;
    }
  }

  return null;
}

export function detectCategory(
  headline: string,
  summary: string = '',
  categories: string[] = [],
  link: string = '',
  sourceName: string = ''
): string {
  const text = `${headline} ${summary}`.toLowerCase();
  const catText = categories.join(' ').toLowerCase();
  const urlLower = link.toLowerCase();

  // 1. Direct feed category or URL check
  if (catText.includes('sport') || urlLower.includes('/sport')) return 'sport';
  if (catText.includes('kosov') || urlLower.includes('/kosove')) return 'kosove';
  if (catText.includes('kronik') || urlLower.includes('/kronike')) return 'kronike';
  if (catText.includes('ekonomi') || urlLower.includes('/ekonomi') || catText.includes('biznes') || urlLower.includes('/biznes')) return 'ekonomi';
  if (catText.includes('bota') || urlLower.includes('/bota')) return 'bota';
  if (catText.includes('showbiz') || catText.includes('kultur') || catText.includes('vip') || urlLower.includes('/showbiz') || urlLower.includes('/kulture')) return 'kulture';
  if (catText.includes('teknologji') || urlLower.includes('/teknologji')) return 'teknologji';
  if (catText.includes('politik') || urlLower.includes('/politike')) return 'politike';

  // 2. High-precision keyword check
  // Sport
  if (/\b(futboll|futbollist|ndeshje|kampionat|champions league|premier league|serie a|la liga|superligë|superliga|uefa|fifa|trajnere|trajner|kuqezinj|vllaznia|partizani|skënderbeu|ballkani|drita|reali|barça|barcelona|milan|inter|juventus|messi|ronaldo|yamal|mbappe|chelsea|arsenal|liverpool|transferim|tenis|basketboll|boks|mundje|stadion|arbitër|gol|gola)\b/i.test(text)) {
    return 'sport';
  }

  // Kronikë & Siguri
  if (/\b(arrestohet|arrestohen|pranga|kapet|kapen|policia|policë|spak|gjkko|droga|kokainë|kanabis|vrasje|vrasja|plagosje|plagoset|aksident|përplasje|grabitje|dënohet|burg|burgim|hetim|kontroll|sekuestrohet|renea|zjarr|ekzekutim)\b/i.test(text)) {
    return 'kronike';
  }

  // Kosovë (Specific events, institutions, or personalities)
  if (/\b(kosovë|kosova|prishtinë|prishtina|kurti|albin kurti|vjosa osmani|prizren|pejë|peja|mitrovicë|mitrovica|ferizaj|gjakovë|gjilan|kfor|eulex|qeveria e kosovës|policia e kosovës|kuvendi i kosovës|kosovar)\b/i.test(text)) {
    return 'kosove';
  }

  // Bota / Ndërkombëtare
  if (/\b(trump|biden|putin|zelensky|rusia|ukraina|kiev|moskë|shba|washington|shtëpia e bardhë|bashkimi evropian|bruksel|nato|izrael|gaza|netanyahu|iran|teheran|kinë|pekin|francë|macron|gjermani|scholz|britani|londër|itali|meloni|greqi|turqi|erdogan)\b/i.test(text)) {
    return 'bota';
  }

  // Politikë
  if (/\b(kryeministër|kryeministri|ministër|ministrja|ministria|deputet|deputetët|kuvend|kuvendi|parlament|parlamenti|qeveria|edi rama|rama|sali berisha|berisha|basha|opozita|mazhoranca|zgjedhje|zgjedhjet|votim|votimi|partia demokratike|partia socialiste|lsi|koalicion)\b/i.test(text)) {
    return 'politike';
  }

  // Ekonomi
  if (/\b(ekonomi|ekonomia|biznes|biznesi|tregu|çmimi|çmimet|inflacion|tatime|tatimet|euro|leku|valuta|eksport|import|paga|pagat|investim|investimet|buxheti|fmn|kredi|kredia|bursë)\b/i.test(text)) {
    return 'ekonomi';
  }

  // Showbiz / Kulturë
  if (/\b(big brother|bbv|vip|këngëtar|këngëtare|aktore|aktor|filmi|koncert|festival|hollywood|estrad|muzikë|muzika|modelja|dasma|romanc)\b/i.test(text)) {
    return 'kulture';
  }

  // Teknologji
  if (/\b(inteligjenc[eë] artificiale|chatgpt|openai|iphone|samsung|robotik[eë]|teknologji|haker|kriptovalut|bitcoin)\b/i.test(text)) {
    return 'teknologji';
  }

  // If item comes from a Kosovo portal and not classified elsewhere, classify as Kosovë
  const isKosovoSource = ['Telegrafi', 'Gazeta Express', 'Koha.net', 'Reporteri', 'Lajmi.net', 'IndeksOnline'].includes(sourceName);
  if (isKosovoSource) {
    return 'kosove';
  }

  // Default to Shqipëri
  return 'shqiperi';
}

export async function fetchAlbanianRssNews(forceRefresh = false): Promise<NewsItem[]> {
  const now = Date.now();
  if (!forceRefresh && feedCache && (now - feedCache.lastFetched < CACHE_TTL_MS)) {
    return feedCache.items;
  }

  const allItems: NewsItem[] = [];

  const settled = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      try {
        const response = await fetch(src.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          },
          signal: AbortSignal.timeout(6500)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from ${src.name}`);
        }

        const xml = await response.text();
        const feed = await parser.parseString(xml);

        const items: NewsItem[] = [];
        (feed.items || []).forEach((item, index) => {
          if (!item.title) return;

          const headline = cleanHeadline(item.title, src.name);
          if (headline.length < 5) return;

          const rawSummary = item.contentSnippet || (item as any).description || '';
          const cleanSummary = decodeHtmlEntities(rawSummary).slice(0, 190);

          const image = extractImage(item);
          // If no image, provide a high-quality TV broadcast backdrop
          const mediaUrl = image || `https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1280&q=80`;

          const pubDate = item.pubDate || item.isoDate;
          let publishedTime = 'TANI';
          let itemDate = new Date();

          if (pubDate) {
            try {
              itemDate = new Date(pubDate);
              publishedTime = itemDate.toLocaleTimeString('sq-AL', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Europe/Tirane'
              });
            } catch {
              publishedTime = 'TANI';
            }
          }

          const isBreaking = isBreakingNewsKeyword(headline) || isBreakingNewsKeyword(cleanSummary);

          const uniqueId = `rss-${src.id}-${index}-${Math.abs(headline.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;

          const itemCategories = Array.isArray(item.categories) ? item.categories : [];
          const category = src.categoryDefault || detectCategory(headline, cleanSummary, itemCategories, item.link || '', src.name);

          items.push({
            id: uniqueId,
            headline,
            headlines: splitHeadlineIntoLines(headline),
            scrollingText: cleanSummary || headline,
            mediaUrl,
            mediaType: 'image',
            duration: isBreaking ? 18 : 12,
            isBreakingNews: isBreaking,
            source: src.name,
            publishedTime,
            order: index,
            createdAt: itemDate.toISOString(),
            updatedAt: itemDate.toISOString(),
            link: item.link || '',
            isRss: true,
            summary: cleanSummary,
            category
          });
        });

        return items;
      } catch (err: any) {
        console.warn(`[RSS Warning] Failed to fetch ${src.name}:`, err.message);
        return [] as NewsItem[];
      }
    })
  );

  // Group items by source and interleave them so we have equal, dynamic representation of portals
  const sourceBuckets: NewsItem[][] = [];
  settled.forEach((res) => {
    if (res.status === 'fulfilled' && res.value.length > 0) {
      sourceBuckets.push(res.value);
    }
  });

  // Interleave round-robin
  let hasMore = true;
  let idx = 0;
  const seenHeadlines = new Set<string>();

  while (hasMore) {
    hasMore = false;
    for (const bucket of sourceBuckets) {
      if (idx < bucket.length) {
        const itm = bucket[idx];
        const normalized = itm.headline.toLowerCase().slice(0, 30);
        if (!seenHeadlines.has(normalized)) {
          seenHeadlines.add(normalized);
          allItems.push(itm);
        }
        hasMore = true;
      }
    }
    idx++;
    if (allItems.length >= 80) break; // Limit to top 80 fresh items
  }

  if (allItems.length > 0) {
    feedCache = {
      lastFetched: now,
      items: allItems
    };
  }

  return allItems;
}
