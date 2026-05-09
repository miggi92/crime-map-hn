<template>
  <UPage>
    <UPageHero
      title="Crime Statistics"
      description="Langzeitstatistiken basierend auf gesammelten Polizei-Pressemitteilungen."
    />

    <UPageBody>
      <UContainer class="pb-12 sm:pb-16 space-y-8">
        <UCard v-if="pending" class="text-center p-8">
          <UIcon name="i-lucide:loader-2" class="w-8 h-8 animate-spin mx-auto text-primary" />
          <p class="mt-4 text-toned">Lade Statistiken...</p>
        </UCard>

        <div v-else-if="stats" class="space-y-8">
          <!-- Overview Cards -->
          <div class="grid gap-4 md:grid-cols-3">
            <UCard>
              <div class="text-center">
                <p class="text-sm font-medium text-toned mb-1">Total Incidents Recorded</p>
                <p class="text-4xl font-bold text-primary">{{ stats.total }}</p>
              </div>
            </UCard>
          </div>

          <!-- Tables -->
          <div class="grid gap-8 md:grid-cols-2">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide:pie-chart" class="w-5 h-5" /> Top Themen
                </h3>
              </template>
              <UTable :rows="stats.topTopics" :columns="topicColumns" />
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide:map-pin" class="w-5 h-5" /> Top Orte
                </h3>
              </template>
              <UTable :rows="stats.topLocations" :columns="locationColumns" />
            </UCard>
          </div>
        </div>

        <UCard v-else class="text-center p-8 bg-red-50 dark:bg-red-950/20">
          <UIcon name="i-lucide:alert-circle" class="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p class="text-red-600 dark:text-red-400">Fehler beim Laden der Statistiken.</p>
        </UCard>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Statistiken - Crime Map Heilbronn',
  description: 'Langzeitstatistiken über Kriminalitätsvorfälle und Polizei-Pressemitteilungen in Heilbronn.',
})

const { data: stats, pending } = useFetch('/api/stats')

const topicColumns = [
  { accessorKey: 'topic', header: 'Thema' },
  { accessorKey: 'count', header: 'Anzahl Vorfälle' }
]

const locationColumns = [
  { accessorKey: 'location', header: 'Ort' },
  { accessorKey: 'count', header: 'Anzahl Vorfälle' }
]
</script>

<style></style>
