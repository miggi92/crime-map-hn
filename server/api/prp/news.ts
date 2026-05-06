import { parseStringPromise } from 'xml2js';

export interface RssNews {
  guid: string;
  title: string;
  description?: string;
  content?: string;
  articleCategories?: {
    places: string[];
    topics: string[];
    keywords: string[];
  };
  category?: string;
  source?: {
    name: string;
    url?: string;
  };
  link?: string;
  date?: string;
  authors?: [{
    name: string;
    description?: string;
    avatar?: {
      src: string;
      alt: string;
    }
  }];
}

function extractArticleBodyFromHtml(html: string): string | undefined {
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdPattern.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed) ? parsed : [parsed];

      for (const entry of entries) {
        const type = entry?.['@type'];
        const typeList = Array.isArray(type) ? type : [type];
        const isArticle = typeList.some((t) => typeof t === 'string' && t.toLowerCase().includes('article'));

        if (isArticle && typeof entry?.articleBody === 'string' && entry.articleBody.trim()) {
          return entry.articleBody.trim();
        }
      }
    } catch {
      // Manche JSON-LD Blöcke sind nicht valides JSON, dann ignorieren.
    }
  }

  // Fallback: Text direkt aus dem Meldungsbereich der Artikelseite extrahieren.
  const articleSectionMatch = html.match(/<p><i>[\s\S]*?\(ots\)<\/i><\/p>([\s\S]*?)<p class="contact-headline">/i)
  const articleSection = articleSectionMatch?.[1]

  if (!articleSection) {
    return undefined
  }

  const decodeHtmlEntities = (text: string) => {
    const namedEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&ouml;': 'ö',
      '&Ouml;': 'Ö',
      '&auml;': 'ä',
      '&Auml;': 'Ä',
      '&uuml;': 'ü',
      '&Uuml;': 'Ü',
      '&szlig;': 'ß',
      '&ndash;': '-',
      '&mdash;': '-',
      '&hellip;': '...',
    }

    let decoded = text
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))

    for (const [entity, replacement] of Object.entries(namedEntities)) {
      decoded = decoded.split(entity).join(replacement)
    }

    return decoded
  }

  const stripHtml = (value: string) => value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  const paragraphs = [...articleSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripHtml(m[1] || '').trim())
    .filter(Boolean)
    .map(decodeHtmlEntities)

  if (!paragraphs.length) {
    return undefined
  }

  return paragraphs.join('\n\n').trim()

  return undefined;
}

function extractTagLabelsFromSection(html: string, sectionTitle: string): string[] {
  const sectionRegex = new RegExp(`${sectionTitle}[\\s\\S]*?<ul class="tags">([\\s\\S]*?)<\\/ul>`, 'i')
  const sectionMatch = html.match(sectionRegex)

  if (!sectionMatch?.[1]) {
    return []
  }

  return [...sectionMatch[1].matchAll(/data-label="([^"]+)"/g)]
    .map((match) => (match[1] || '').trim())
    .filter(Boolean)
}

function extractArticleCategoriesFromHtml(html: string): { places: string[]; topics: string[]; keywords: string[] } {
  const places = extractTagLabelsFromSection(html, 'Orte in dieser Meldung')
  const topics = extractTagLabelsFromSection(html, 'Themen in dieser Meldung')
  const newsKeywords = html.match(/<meta\s+name="news_keywords"\s+content="([^"]*)"/i)?.[1]
  const keywords = (newsKeywords || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return { places, topics, keywords }
}

export default defineEventHandler(async (event) => {
  const rssUrl = 'https://www.presseportal.de/rss/dienststelle_110971.rss2'
  const query = getQuery(event)
  const includeFullArticle = query.full === '1' || query.full === 'true'
  const includeArticleCategories = query.categories === '1' || query.categories === 'true'

  try {
    // RSS-Feed abrufen
    const responseXML = await $fetch<string>(rssUrl, { responseType: 'text' })
    const jsonData = await parseStringPromise(responseXML)

    const channel = jsonData?.rss?.channel?.[0]
    if (!channel) {
      throw createError({
        statusCode: 500,
        data: undefined,
        statusMessage: 'RSS feed has no channel data',
      })
    }

    const channelCategory = channel.category?.[0] || 'Presseportal.de'
    const items: RssNews[] = await Promise.all((channel.item || []).map(async (item: any) => {
      const link = item.link?.[0] || ''
      let fullArticle: string | undefined
      let articleCategories: { places: string[]; topics: string[]; keywords: string[] } | undefined

      if ((includeFullArticle || includeArticleCategories) && link) {
        try {
          const articleHtml = await $fetch<string>(link, { responseType: 'text' })
          if (includeFullArticle) {
            fullArticle = extractArticleBodyFromHtml(articleHtml)
          }
          if (includeArticleCategories) {
            articleCategories = extractArticleCategoriesFromHtml(articleHtml)
          }
        } catch {
          fullArticle = undefined
          articleCategories = undefined
        }
      }

      return {
        guid: item.guid?.[0] || link,
        title: item.title?.[0] || '',
        description: item.description?.[0] || '',
        // RSS enthält oft nur Teaser. Für Volltext kann ?full=1 genutzt werden.
        content: fullArticle || item['content:encoded']?.[0] || '',
        articleCategories,
        category: channelCategory,
        source: {
          name: item.source?.[0]?._ || channelCategory,
          url: item.source?.[0]?.$?.url || link,
        },
        link,
        date: item.pubDate?.[0] || '',
        authors: [{
          name: channelCategory,
          description: item.author?.[0] || '',
          avatar: {
            src: 'https://www.presseportal.de/favicon.ico',
            alt: item.author?.[0] || '',
          },
        }],
      }
    }))

    return {
      title: channel.title?.[0] || '',
      link: channel.link?.[0] || '',
      description: channel.description?.[0] || '',
      language: channel.language?.[0] || '',
      category: channelCategory,
      item: items,
    }
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      data: undefined,
      statusMessage: 'Error fetching RSS feed',
    })
  }
});
