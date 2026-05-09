export default defineEventHandler(async (_event) => {
  try {
    // We check if hubDatabase exists globally (provided by the NuxtHub core module at runtime)
    const db = typeof hubDatabase === 'function' ? hubDatabase() : undefined
    if (!db) {
       return { total: 0, topTopics: [], topLocations: [] }
    }
    const { results: topTopics } = await db.prepare(`
      SELECT topic, COUNT(*) as count
      FROM historical_incidents
      GROUP BY topic
      ORDER BY count DESC
      LIMIT 10
    `).all()

    const { results: topLocations } = await db.prepare(`
      SELECT location, COUNT(*) as count
      FROM historical_incidents
      WHERE location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `).all()

    const { results: totalIncidents } = await db.prepare(`
      SELECT COUNT(*) as count FROM historical_incidents
    `).all()

    return {
      total: totalIncidents[0]?.count || 0,
      topTopics,
      topLocations
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching statistics',
    })
  }
})
