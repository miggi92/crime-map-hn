import { db, schema as tables } from '@nuxthub/db'
import { desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (_event) => {
  try {
    // Fallback if db is not available (shouldn't happen)
    if (!db) {
       return { total: 0, topTopics: [], topLocations: [] }
    }

    const topTopics = await db
      .select({
        topic: tables.historicalIncidents.topic,
        count: sql<number>`count(*)`
      })
      .from(tables.historicalIncidents)
      .groupBy(tables.historicalIncidents.topic)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10)

    const topLocations = await db
      .select({
        location: tables.historicalIncidents.location,
        count: sql<number>`count(*)`
      })
      .from(tables.historicalIncidents)
      .where(sql`${tables.historicalIncidents.location} != ''`)
      .groupBy(tables.historicalIncidents.location)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10)

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tables.historicalIncidents)

    return {
      total: totalResult[0]?.count || 0,
      topTopics,
      topLocations
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    // sanitize error for client side
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching statistics',
      data: undefined
    })
  }
})
