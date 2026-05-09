import { fetchNewsChannel, buildNewsItem } from '../utils/presseportal-news'

export default defineTask({
  meta: {
    name: 'fetch-historical-news',
    description: 'Fetches RSS news and stores aggregated long-term data in D1 database',
  },
  async run() {
    console.log('Running fetch-historical-news task...')
    const db = typeof hubDatabase === 'function' ? hubDatabase() : undefined
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

        // Insert or update into the D1 database
        await db.prepare(`
          INSERT INTO historical_incidents (guid, date, topic, location)
          VALUES (?1, ?2, ?3, ?4)
          ON CONFLICT(guid) DO UPDATE SET
            date=excluded.date,
            topic=excluded.topic,
            location=excluded.location
        `).bind(guid, date, topic, location).run()
      }

      return { result: `Successfully processed and stored ${rawItems.length} news items.` }
    } catch (error) {
      console.error('Error fetching historical news:', error)
      return { result: 'Failed to fetch and process historical news.' }
    }
  }
})
