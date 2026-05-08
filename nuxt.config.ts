// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    'leaflet/dist/leaflet.css',
    'leaflet.markercluster/dist/MarkerCluster.css',
    'leaflet.markercluster/dist/MarkerCluster.Default.css'
  ],
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxthub/core',
    '@nuxt/test-utils/module'
  ]
})