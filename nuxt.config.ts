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

  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error',
        'brand',
        'darkblue'
      ]
    }
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxthub/core',
    '@nuxt/test-utils/module'
  ],
  hub: {
    db: {
      dialect: 'sqlite',
      driver: 'd1',
      connection: {
        databaseId: '86b0519e-2253-4403-b696-d82297e4160e',
      },
    },
  },
  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '0 0 * * *': ['fetch-historical-news']
    }
  }
})