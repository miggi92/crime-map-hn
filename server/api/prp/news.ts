import type { NewsFeed, NewsItem } from '../../../types/news'
import { buildNewsItem, fetchNewsChannel } from '../../utils/presseportal-news'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeFullArticle = query.full === '1' || query.full === 'true'
  const includeArticleCategories = query.categories === '1' || query.categories === 'true'

  try {
    const { channel, channelCategory } = await fetchNewsChannel()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: NewsItem[] = await Promise.all((channel.item || []).map((item: any) => buildNewsItem(item, channelCategory, {
      includeFullArticle,
      includeArticleCategories,
    })))

    const response: NewsFeed = {
      title: channel.title?.[0] || '',
      link: channel.link?.[0] || '',
      description: channel.description?.[0] || '',
      language: channel.language?.[0] || '',
      category: channelCategory,
      item: items,
    }

    return response
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching RSS feed',
    })
  }
})
