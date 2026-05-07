import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'nuxt',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts', 'app/**/*.vue', 'app/**/*.ts'],
      exclude: ['server/tsconfig.json', 'node_modules', '.nuxt'],
    },
  },
})
