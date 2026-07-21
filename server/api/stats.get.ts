import { db, schema as tables } from '@nuxthub/db'
import { desc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    let _db = db;
    // Fallback for cloudflare production where the binding is in the event context
    if (event.context.cloudflare?.env?.DB) {
       const { drizzle } = await import('drizzle-orm/d1')
       _db = drizzle(event.context.cloudflare.env.DB) as unknown as typeof db
    } else if (globalThis.__env__?.DB) {
       const { drizzle } = await import('drizzle-orm/d1')
       _db = drizzle(globalThis.__env__.DB) as unknown as typeof db
    } else if (globalThis.DB) {
       const { drizzle } = await import('drizzle-orm/d1')
       _db = drizzle(globalThis.DB) as unknown as typeof db
    }

    // Attempt to bypass nuxt-hub proxy entirely if needed
    if (!_db) {
       console.error("No database connection available in stats endpoint");
       return { total: 0, topTopics: [], topLocations: [] }
    }

    const topTopicsPromise = _db
      .select({
        topic: tables.historicalIncidents.topic,
        count: sql<number>`count(*)`
      })
      .from(tables.historicalIncidents)
      .groupBy(tables.historicalIncidents.topic)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10)

    const topLocationsPromise = _db
      .select({
        location: tables.historicalIncidents.location,
        count: sql<number>`count(*)`
      })
      .from(tables.historicalIncidents)
      .where(sql`${tables.historicalIncidents.location} != ''`)
      .groupBy(tables.historicalIncidents.location)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10)

    const totalResultPromise = _db
      .select({ count: sql<number>`count(*)` })
      .from(tables.historicalIncidents)

    const [topTopicsSettled, topLocationsSettled, totalResultSettled] = await Promise.allSettled([
      topTopicsPromise,
      topLocationsPromise,
      totalResultPromise
    ]);

    let topTopics = [];
    if (topTopicsSettled.status === 'fulfilled') {
      topTopics = topTopicsSettled.value;
    } else {
      console.error('Error fetching topTopics:', topTopicsSettled.reason);
    }

    let topLocations = [];
    if (topLocationsSettled.status === 'fulfilled') {
      topLocations = topLocationsSettled.value;
    } else {
      console.error('Error fetching topLocations:', topLocationsSettled.reason);
    }

    let total = 0;
    if (totalResultSettled.status === 'fulfilled') {
      total = totalResultSettled.value[0]?.count || 0;
    } else {
      console.error('Error fetching totalResult:', totalResultSettled.reason);
    }

    return {
      total,
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
