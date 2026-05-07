<template>
  <UPage class="h-[calc(100vh-var(--ui-header-height,64px))] flex flex-col">
    <UPageHeader title="Crime map Heilbronn & Umgebung" class="flex-shrink-0">
      <template #links>
        <USelectMenu
v-model="selectedTopics" :items="availableTopics" multiple placeholder="Kategorien filtern"
          class="w-full sm:w-64" />
      </template>
    </UPageHeader>
    <UPageBody class="flex-grow p-0 sm:p-0 flex flex-col overflow-hidden">
      <div class="px-4 py-2 sm:px-6 flex-shrink-0">
        <UAlert v-if="error" color="error" variant="soft" title="Fehler beim Laden der Karte" :description="error.message" />
        <UAlert
v-else-if="!pending && !mapLocations.length" color="warning" variant="soft" title="Keine Orte gemappt"
          description="Fuer die aktuellen News wurden noch keine passenden Koordinaten im Mapping gefunden." />
      </div>

      <div class="flex-grow w-full h-[calc(100vh-var(--ui-header-height,64px)-150px)] relative z-0">
        <ClientOnly>
          <Map :locations="mapLocations" />
        </ClientOnly>
      </div>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>
import { getCoordinatesForLocation } from '~/utils/location-mapping'
import type { MapLocation } from '~~/types/map-location'
import type { NewsFeed, NewsItem } from '~~/types/news'

type Coordinates = {
  lat: number
  lng: number
}

type MarkerArticle = {
  id: string
  title: string
  date?: string
}

const { data, pending, error } = await useAsyncData('map-news', () => {
  return $fetch<NewsFeed>('/api/prp/news', {
    query: {
      categories: true,
    },
  })
})

const availableTopics = computed(() => {
  const topics = new Set<string>()
  for (const item of data.value?.item || []) {
    for (const topic of item.articleCategories?.topics || []) {
      topics.add(topic)
    }
  }
  return Array.from(topics).sort((a, b) => a.localeCompare(b, 'de'))
})

const selectedTopics = ref<string[]>([])

const filteredItems = computed(() => {
  const items = data.value?.item || []
  if (!selectedTopics.value.length) {
    return items
  }
  return items.filter(item => {
    const itemTopics = item.articleCategories?.topics || []
    return selectedTopics.value.some(topic => itemTopics.includes(topic))
  })
})

const unmappedPlaces = computed(() => {
  const places = new Set<string>()

  for (const item of filteredItems.value) {
    for (const place of item.articleCategories?.places || []) {
      if (!getCoordinatesForLocation(place)) {
        places.add(place)
      }
    }
  }

  return Array.from(places).sort((left, right) => left.localeCompare(right, 'de'))
})

const geocodeKey = computed(() => `map-geocode-${unmappedPlaces.value.join('|')}`)

const { data: geocodedLocations } = await useAsyncData<Record<string, Coordinates>>(geocodeKey, () => {
  if (!unmappedPlaces.value.length) {
    return Promise.resolve({})
  }

  return $fetch<Record<string, Coordinates>>('/api/locations/geocode', {
    method: 'POST',
    body: {
      places: unmappedPlaces.value,
    },
  })
}, {
  default: () => ({}),
  watch: [unmappedPlaces],
})

function extractArticleId(item: NewsItem): string {
  return String(item.guid || item.link || '').match(/(\d+)$/)?.[1] || ''
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildPopupHtml(place: string, articles: MarkerArticle[]): string {
  const articleList = articles
    .map((article) => {
      const href = article.id ? `/news/${article.id}` : '#'
      const title = escapeHtml(article.title)
      const meta = article.date ? `<div class="text-xs text-gray-500">${escapeHtml(article.date)}</div>` : ''

      return `<li><a href="${href}" class="font-medium underline">${title}</a>${meta}</li>`
    })
    .join('')

  return `
    <div class="space-y-2">
      <h3 class="text-sm font-semibold">${escapeHtml(place)}</h3>
      <ul class="space-y-2">${articleList}</ul>
    </div>
  `.trim()
}

const mapLocations = computed<MapLocation[]>(() => {
  const groupedLocations = new Map<string, MapLocation & { articles: MarkerArticle[] }>()

  for (const item of filteredItems.value) {
    for (const place of item.articleCategories?.places || []) {
      const coordinates = getCoordinatesForLocation(place) || geocodedLocations.value?.[place]

      if (!coordinates) {
        continue
      }

      if (!groupedLocations.has(place)) {
        groupedLocations.set(place, {
          name: place,
          lat: coordinates.lat,
          lng: coordinates.lng,
          articles: [],
        })
      }

      groupedLocations.get(place)?.articles.push({
        id: extractArticleId(item),
        title: item.title,
        date: item.date,
      })
    }
  }

  return Array.from(groupedLocations.values()).map((location) => {
    return {
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      popup: buildPopupHtml(location.name, location.articles),
    }
  })
})
</script>

<style></style>