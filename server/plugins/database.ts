export default defineNitroPlugin(async () => {
  if (import.meta.prerender) return

  try {
    const db = typeof hubDatabase === 'function' ? hubDatabase() : undefined
    if (!db) return

    // Initialize the database schema for long-term historical data
    await db.exec(`
      CREATE TABLE IF NOT EXISTS historical_incidents (
        guid TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        topic TEXT,
        location TEXT
      )
    `)
  } catch (err) {
    console.warn('Could not initialize database schema during build/prerender:', err)
  }
})
