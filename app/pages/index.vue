<template>
  <UPage>
    <UPageHero
title="Crime map Heilbronn"
      description="Verfolge aktuelle Polizeimeldungen auf einer interaktiven Karte, erkenne lokale Schwerpunkte und springe direkt in die zugehörigen Details."
      :links="heroLinks">
      <template #headline>
        <div class="flex flex-col items-center gap-6 mb-4">
          <NuxtImg src="/logo.svg" alt="Crime Map Heilbronn Logo" class="h-24 w-auto text-primary" />
          <UBadge color="primary" variant="soft" size="lg">
            Live-Überblick für Heilbronn & Umgebung
          </UBadge>
        </div>
      </template>
    </UPageHero>

    <UPageBody>
      <UPageHero
title="Warum diese Plattform?" description="Die wichtigsten Funktionen auf einen Blick."
        orientation="horizontal" :ui="{ root: 'py-8 sm:py-10' }" />

      <UContainer>
        <div class="grid gap-4 md:grid-cols-3">
          <UCard v-for="item in quickHighlights" :key="item.title" :ui="{ body: 'p-5 sm:p-6' }">
            <div class="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
              <UIcon :name="item.icon" class="size-5" />
            </div>
            <div class="space-y-1">
              <p class="font-semibold text-highlighted">
                {{ item.title }}
              </p>
              <p class="text-sm text-toned">
                {{ item.description }}
              </p>
            </div>
          </UCard>
        </div>
      </UContainer>

      <UPageHero
title="So nutzt du die Plattform"
        description="In wenigen Schritten vom Überblick zur konkreten Meldung." orientation="horizontal"
        :ui="{ root: 'pt-12 pb-8 sm:pt-14 sm:pb-10' }" />

      <UContainer class="pb-12 sm:pb-16">
        <div class="grid gap-4 md:grid-cols-3">
          <UCard v-for="step in steps" :key="step.title" :ui="{ body: 'p-5 sm:p-6' }">
            <UBadge color="primary" variant="solid" size="sm" class="mb-3">
              Schritt {{ step.number }}
            </UBadge>
            <p class="font-semibold text-highlighted">
              {{ step.title }}
            </p>
            <p class="mt-2 text-sm text-toned">
              {{ step.description }}
            </p>
          </UCard>
        </div>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script lang="ts" setup>
const heroLinks = [
  {
    label: 'Zur Karte',
    to: '/map',
    icon: 'i-lucide:map',
    size: 'xl',
  },
  {
    label: 'Alle News lesen',
    to: '/news',
    icon: 'i-lucide:newspaper',
    size: 'xl',
    color: 'neutral',
    variant: 'soft',
  },
]

const quickHighlights = [
  {
    icon: 'i-lucide:scan-search',
    title: 'Schneller Lageüberblick',
    description: 'Markierungen auf der Karte zeigen dir auf einen Blick, wo aktuell Meldungen auftreten.',
  },
  {
    icon: 'i-lucide:layers-3',
    title: 'Clustering für bessere Lesbarkeit',
    description: 'Nahe Meldungen werden zusammengefasst und beim Zoomen präzise aufgelöst.',
  },
  {
    icon: 'i-lucide:link',
    title: 'Direkt zur Quelle',
    description: 'Aus jedem Karten-Popup gelangst du sofort in die vollständige News-Detailansicht.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Map öffnen',
    description: 'Starte in der Kartenansicht und zoome in den für dich relevanten Bereich.',
  },
  {
    number: '2',
    title: 'Marker prüfen',
    description: 'Klicke Marker oder Cluster an, um betroffene Orte und Meldungen einzusehen.',
  },
  {
    number: '3',
    title: 'Details lesen',
    description: 'Wechsle mit einem Klick in die News-Seite für vollständige Inhalte und Kontext.',
  },
]

</script>

<style></style>