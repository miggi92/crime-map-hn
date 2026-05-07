<template>
  <UPage>
    <UPageHeader
      :title="article?.title || 'Meldung nicht gefunden'"
      :description="article?.description || 'Die Meldung ist nicht mehr im aktuellen Feed enthalten.'"
    />

    <UPageBody>
      <UContainer>
        <div class="mb-4">
          <UButton to="/news" variant="ghost" icon="i-lucide-arrow-left" label="Zur News-Übersicht" />
        </div>

        <div v-if="pending" class="space-y-3">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-5 w-1/2" />
          <USkeleton class="h-40 w-full" />
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          title="Fehler beim Laden"
          :description="error.message"
        />

        <UAlert
          v-else-if="!article"
          color="warning"
          variant="soft"
          title="Meldung nicht gefunden"
          description="Der Beitrag wurde im aktuellen RSS-Feed nicht gefunden."
        />

        <article v-else class="space-y-6">
          <div class="flex flex-wrap gap-2 text-sm text-gray-600">
            <span v-if="article.date">{{ article.date }}</span>
            <span v-if="article.source?.name">· {{ article.source.name }}</span>
            <span v-if="article.category">· {{ article.category }}</span>
          </div>

          <div v-if="article.articleCategories?.places?.length" class="space-y-2">
            <h2 class="text-base font-semibold">Orte</h2>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="place in article.articleCategories.places"
                :key="`place-${place}`"
                color="neutral"
                variant="soft"
              >
                {{ place }}
              </UBadge>
            </div>
          </div>

          <div v-if="article.articleCategories?.topics?.length" class="space-y-2">
            <h2 class="text-base font-semibold">Themen</h2>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="topic in article.articleCategories.topics"
                :key="`topic-${topic}`"
                color="primary"
                variant="soft"
              >
                {{ topic }}
              </UBadge>
            </div>
          </div>

          <div v-if="article.articleCategories?.keywords?.length" class="space-y-2">
            <h2 class="text-base font-semibold">Keywords</h2>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="keyword in article.articleCategories.keywords"
                :key="`keyword-${keyword}`"
                color="info"
                variant="subtle"
              >
                {{ keyword }}
              </UBadge>
            </div>
          </div>

          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="prose max-w-none" v-html="articleHtml" />

          <div class="pt-2">
            <UButton
              :to="article.link"
              target="_blank"
              icon="i-lucide-external-link"
              label="Original bei Presseportal"
            />
          </div>
        </article>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>
import type { NewsItem } from '~/types/news'

const route = useRoute()
const routeId = computed(() => {
  const param = route.params.id
  const segments = Array.isArray(param) ? param : [String(param || '')]
  return segments[segments.length - 1] || ''
})

const { data, pending, error } = await useAsyncData(
  () => `news-detail-${routeId.value}`,
  () => $fetch(`/api/prp/news/${routeId.value}`),
  {
    watch: [routeId],
  },
)

const article = computed<NewsItem | null>(() => {
  return (data.value as NewsItem) || null
})

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const articleHtml = computed(() => {
  const raw = article.value?.content || ''
  if (!raw) {
    return '<p>Kein Inhalt verfügbar.</p>'
  }

  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw
  }

  return `<p>${escapeHtml(raw).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
})

</script>

<style>

</style>