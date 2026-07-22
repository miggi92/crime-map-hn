<template>
  <UPage>
    <UPageHero
      title="Crime Statistics"
      description="Langzeitstatistiken basierend auf gesammelten Polizei-Pressemitteilungen."
    >
      <!-- Timeframe Filter -->
      <div class="mt-8 max-w-xs mx-auto md:mx-0">
        <USelect
          v-model="selectedTimeframe"
          :options="timeframeOptions"
          label="Zeitraum"
          class="w-full"
        />
      </div>
    </UPageHero>

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
              <UTable :data="stats.topTopics" :columns="topicColumns" />
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide:map-pin" class="w-5 h-5" /> Top Orte
                </h3>
              </template>
              <UTable :data="stats.topLocations" :columns="locationColumns" />
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
import { ref, computed } from 'vue'

useSeoMeta({
  title: 'Statistiken - Crime Map Heilbronn',
  description: 'Langzeitstatistiken über Kriminalitätsvorfälle und Polizei-Pressemitteilungen in Heilbronn.',
})

const timeframeOptions = [
  { label: 'Last 2 Weeks', value: '2weeks' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' }
]

const selectedTimeframe = ref('2weeks')

const dateRange = computed(() => {
  const end = new Date()
  let start: Date | null = null

  if (selectedTimeframe.value === '2weeks') {
    start = new Date()
    start.setDate(end.getDate() - 14)
  } else if (selectedTimeframe.value === 'year') {
    start = new Date(end.getFullYear(), 0, 1) // January 1st of current year
  }

  return {
    startDate: start ? start.toISOString() : undefined,
    endDate: end.toISOString()
  }
})

// useFetch will automatically refetch when query params change
const { data: stats, pending } = useFetch('/api/stats', {
  query: dateRange
})

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
