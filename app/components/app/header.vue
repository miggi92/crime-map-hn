<template>
  <UHeader mode="slideover">
    <template #title>
      <AppLogo class="h-6 w-auto" />
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />

      <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
        <UButton
color="neutral" variant="ghost" to="https://github.com/miggi92/crime-map-hn" target="_blank"
          icon="i-simple-icons-github" aria-label="GitHub" />
      </UTooltip>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>

<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Map',
    to: '/map',
    icon: 'i-lucide:map',
  }, {
    label: 'News',
    to: '/news',
    icon: 'i-lucide:newspaper',
    active: route.path.startsWith('/news'),
  },
  {
    label: 'Statistics',
    to: '/stats',
    icon: 'i-lucide:bar-chart-2',
    active: route.path.startsWith('/stats'),
  }])

</script>

<style></style>