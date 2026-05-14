<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const title = 'Crime Map Heilbronn'
const description = 'Eine interaktive Karte für die Stadt und den Landkreis Heilbronn, welche die Kriminalstatistiken und Vorfälle basierend auf aktuellen Polizei-Pressemitteilungen visualisiert.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/screenshot.png',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: '/screenshot.png'
})

useHead({
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ]
})
</script>
