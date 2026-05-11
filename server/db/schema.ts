import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const historicalIncidents = sqliteTable('historical_incidents', {
  guid: text().primaryKey(),
  date: text().notNull(),
  topic: text(),
  location: text()
})
