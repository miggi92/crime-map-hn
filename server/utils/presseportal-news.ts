import { XMLParser } from 'fast-xml-parser'
import type { ArticleCategories, NewsItem } from '../../types/news'

export const PRESSEPORTAL_RSS_URL = 'https://www.presseportal.de/rss/dienststelle_110971.rss2'

interface NewsChannel {
    title?: string[]
    link?: string[]
    description?: string[]
    language?: string[]
    category?: string[]
    item?: any[]
}

interface FetchChannelResult {
    channel: NewsChannel
    channelCategory: string
}

interface BuildNewsItemOptions {
    includeFullArticle?: boolean
    includeArticleCategories?: boolean
}

export async function fetchNewsChannel(rssUrl = PRESSEPORTAL_RSS_URL): Promise<FetchChannelResult> {
    const responseXML = await $fetch<string>(rssUrl, { responseType: 'text' })

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "$",
        textNodeName: "_",
        isArray: (name) => ["title", "link", "description", "language", "category", "item", "guid", "content:encoded", "source", "pubDate", "author"].includes(name)
    })
    const jsonData = parser.parse(responseXML)

    const channel = jsonData?.rss?.channel as NewsChannel | undefined
    if (!channel) {
        throw createError({
            statusCode: 500,
            statusMessage: 'RSS feed has no channel data',
        })
    }

    return {
        channel,
        channelCategory: channel.category?.[0] || 'Presseportal.de',
    }
}

export function findRawItemById(items: any[] = [], id: string) {
    return items.find((item: any) => {
        const guid = String(item.guid?.[0] || '')
        const link = String(item.link?.[0] || '')
        return guid.endsWith(`/${id}`) || link.endsWith(`/${id}`)
    })
}

export async function buildNewsItem(
    rawItem: any,
    channelCategory: string,
    options: BuildNewsItemOptions = {},
): Promise<NewsItem> {
    const { includeFullArticle = false, includeArticleCategories = false } = options

    const link = rawItem.link?.[0] || ''
    let fullArticle: string | undefined
    let articleCategories: ArticleCategories | undefined

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
        guid: rawItem.guid?.[0] || link,
        title: rawItem.title?.[0] || '',
        description: rawItem.description?.[0] || '',
        content: fullArticle || rawItem['content:encoded']?.[0] || '',
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

    const paragraphs = [...articleSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((m) => stripHtml(m[1] || '').trim())
        .filter(Boolean)
        .map(decodeHtmlEntities)

    if (!paragraphs.length) {
        return undefined
    }

    return paragraphs.join('\n\n').trim()
}

function stripHtml(value: string): string {
    return value
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(text: string): string {
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

function extractArticleCategoriesFromHtml(html: string): ArticleCategories {
    const places = extractTagLabelsFromSection(html, 'Orte in dieser Meldung')
    const topics = extractTagLabelsFromSection(html, 'Themen in dieser Meldung')
    const newsKeywords = html.match(/<meta\s+name="news_keywords"\s+content="([^"]*)"/i)?.[1]
    const keywords = (newsKeywords || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

    return { places, topics, keywords }
}
