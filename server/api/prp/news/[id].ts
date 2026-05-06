import { parseStringPromise } from 'xml2js'

interface RssNewsDetail {
  guid: string
  title: string
  description?: string
  content?: string
  articleCategories?: {
    places: string[]
    topics: string[]
    keywords: string[]
  }
  category?: string
  source?: {
    name: string
    url?: string
  }
  link?: string
  date?: string
  authors?: [{
    name: string
    description?: string
    avatar?: {
      src: string
      alt: string
    }
  }]
}

function extractArticleBodyFromHtml(html: string): string | undefined {
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = jsonLdPattern.exec(html)) !== null) {
    const raw = match[1]?.trim()
    if (!raw) {
      continue
    }

    try {
      const parsed = JSON.parse(raw)
      const entries = Array.isArray(parsed) ? parsed : [parsed]

      for (const entry of entries) {
        const type = entry?.['@type']
        const typeList = Array.isArray(type) ? type : [type]
        const isArticle = typeList.some((t) => typeof t === 'string' && t.toLowerCase().includes('article'))

        if (isArticle && typeof entry?.articleBody === 'string' && entry.articleBody.trim()) {
          return entry.articleBody.trim()
        }
      }
    } catch {
      // Manche JSON-LD Blöcke sind nicht valides JSON, dann ignorieren.
    }
  }

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
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const rssUrl = 'https://www.presseportal.de/rss/dienststelle_110971.rss2'

  try {
    const responseXML = await $fetch<string>(rssUrl, { responseType: 'text' })
    const jsonData = await parseStringPromise(responseXML)

    const channel = jsonData?.rss?.channel?.[0]
    if (!channel) {
      throw createError({
        statusCode: 500,
        statusMessage: 'RSS feed has no channel data',
      })
    }

    const channelCategory = channel.category?.[0] || 'Presseportal.de'
    const rawItem = (channel.item || []).find((item: any) => {
      const guid = String(item.guid?.[0] || '')
      const link = String(item.link?.[0] || '')
      return guid.endsWith(`/${id}`) || link.endsWith(`/${id}`)
    })

    if (!rawItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found in RSS feed',
      })
    }

    const link = rawItem.link?.[0] || ''
    let fullArticle = rawItem['content:encoded']?.[0] || ''
    let articleCategories: { places: string[]; topics: string[]; keywords: string[] } | undefined

    if (link) {
      try {
        const articleHtml = await $fetch<string>(link, { responseType: 'text' })
        fullArticle = extractArticleBodyFromHtml(articleHtml) || fullArticle
        articleCategories = extractArticleCategoriesFromHtml(articleHtml)
      } catch {
        articleCategories = undefined
      }
    }

    const item: RssNewsDetail = {
      guid: rawItem.guid?.[0] || link,
      title: rawItem.title?.[0] || '',
      description: rawItem.description?.[0] || '',
      content: fullArticle,
      articleCategories,
      category: channelCategory,
      source: {
        name: rawItem.source?.[0]?._ || channelCategory,
        url: rawItem.source?.[0]?.$?.url || link,
      },
      link,
      date: rawItem.pubDate?.[0] || '',
      authors: [{
        name: channelCategory,
        description: rawItem.author?.[0] || '',
        avatar: {
          src: 'https://www.presseportal.de/favicon.ico',
          alt: rawItem.author?.[0] || '',
        },
      }],
    }

    return item
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching article details',
    })
  }
})
