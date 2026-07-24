import { db, schema as tables } from '@nuxthub/db'
import { desc, sql, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const startDate = query.startDate ? String(query.startDate) : undefined
    const endDate = query.endDate ? String(query.endDate) : undefined

    // Determine if data is outdated or empty
    let shouldUpdateData = false
    try {
      const latestIncident = await db
        .select({ date: tables.historicalIncidents.date })
        .from(tables.historicalIncidents)
        .orderBy(desc(tables.historicalIncidents.date))
        .limit(1)

      if (latestIncident.length === 0) {
        shouldUpdateData = true
      } else {
        const latestDateStr = latestIncident[0]?.date
        if (latestDateStr) {
           const latestDate = new Date(latestDateStr)
           const now = new Date()
           const diffHours = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60)

           if (diffHours > 24) {
             shouldUpdateData = true
           }
        } else {
           shouldUpdateData = true
        }
      }
    } catch (e) {
      console.warn("Could not check if database is outdated, attempting to update anyway:", e)
      shouldUpdateData = true
    }

    if (shouldUpdateData) {
      console.log('Statistics data is empty or outdated, triggering fetch-historical-news task...')
      try {
        await runTask('fetch-historical-news')
      } catch (taskError) {
        console.error('Failed to run fetch-historical-news task on demand:', taskError)
      }
    }

    // Build base filter conditions
    const conditions = []
    if (startDate) {
      conditions.push(gte(tables.historicalIncidents.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(tables.historicalIncidents.date, endDate))
    }
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

    const topTopicsPromise = db
      .select({
        topic: tables.historicalIncidents.topic,
        count: sql<number>`count(*)`
      })
      .from(tables.historicalIncidents)
      .where(whereCondition)
      .groupBy(tables.historicalIncidents.topic)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10)

    const locationConditions = [sql`${tables.historicalIncidents.location} != ''`]
    if (whereCondition) {
      locationConditions.push(whereCondition)
    }

    const topLocationsPromise = db
      .select({
        location: tables.historicalIncidents.location,
        count: sql<number>`count(*)`
      })
      .from(tables.historicalIncidents)
      .where(and(...locationConditions))
      .groupBy(tables.historicalIncidents.location)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10)

    const totalResultPromise = db
      .select({ count: sql<number>`count(*)` })
      .from(tables.historicalIncidents)
      .where(whereCondition)

    const [topTopicsSettled, topLocationsSettled, totalResultSettled] = await Promise.allSettled([
      topTopicsPromise,
      topLocationsPromise,
      totalResultPromise
    ]);

    let topTopics: Array<{ topic: string | null; count: number }> = [];
    if (topTopicsSettled.status === 'fulfilled') {
      topTopics = topTopicsSettled.value;
    } else {
      console.error('Error fetching topTopics:', topTopicsSettled.reason);
    }

    let topLocations: Array<{ location: string | null; count: number }> = [];
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
