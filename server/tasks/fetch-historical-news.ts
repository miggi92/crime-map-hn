import { fetchNewsChannel, buildNewsItem } from '../utils/presseportal-news'
import { tables, useDB } from '@nuxthub/db'

export default defineTask({
  meta: {
    name: 'fetch-historical-news',
    description: 'Fetches RSS news and stores aggregated long-term data in D1 database',
  },
  async run() {
    console.log('Running fetch-historical-news task...')
    const db = useDB()
    if (!db) return { result: 'Database not available.' }

    try {
      const { channel, channelCategory } = await fetchNewsChannel()
      const rawItems = channel.item || []

      console.log(`Found ${rawItems.length} items in RSS feed.`)

      // Process items to get topics and locations
      for (const rawItem of rawItems) {
        // We include article categories to extract topics and locations
        const item = await buildNewsItem(rawItem, channelCategory, { includeArticleCategories: true })

        const guid = item.guid
        const date = item.date

        // Extract a primary topic (or fallback to 'Allgemein')
        const topic = item.articleCategories?.topics?.[0] || 'Allgemein'

        // Extract a primary location
        const location = item.articleCategories?.places?.[0] || ''

        // Insert or update into the D1 database using Drizzle
        await db
          .insert(tables.historicalIncidents)
          .values({
            guid,
            date,
            topic,
            location
          })
          .onConflictDoUpdate({
            target: tables.historicalIncidents.guid,
            set: {
              date,
              topic,
              location
            }
          })
      }

      return { result: `Successfully processed and stored ${rawItems.length} news items.` }
    } catch (error) {
      console.error('Error fetching historical news:', error)
      return { result: 'Failed to fetch and process historical news.' }
    }
  }
})
