import type { NewsItem } from '../../../../types/news'
import { buildNewsItem, fetchNewsChannel, findRawItemById } from '../../../utils/presseportal-news'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing id' })
    }

    try {
        const { channel, channelCategory } = await fetchNewsChannel()
        const rawItem = findRawItemById(channel.item, id)

        if (!rawItem) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Article not found in RSS feed',
            })
        }

        const item: NewsItem = await buildNewsItem(rawItem, channelCategory, {
            includeFullArticle: true,
            includeArticleCategories: true,
        })

        return item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
