# Frontend Architecture (Nuxt, Vue & Nuxt UI)
- **Directory**: The frontend lives inside the `app/` directory (`app/pages/`, `app/components/`, `app/layouts/`).
- **Vue Standard**: Use Vue 3 Composition API exclusively with `<script setup lang="ts">`. NEVER use the Options API.
- **Auto-imports**: Rely on Nuxt's auto-imports for components, composables, and Vue APIs (`ref`, `computed`, `watch`).

# Frontend Architecture & OOP
- **Dumb Components**: Keep Vue components (`.vue` files) strictly responsible for UI presentation and DOM interactions.
- **Smart Services**: Delegate state manipulation, data transformation, and business logic to pure TypeScript classes (Models/Services).
- **Reactivity Bridge**: Use Vue Composables (`use...`) merely as a bridge to instantiate these OOP service classes and expose their reactive properties to the template. Ensure that class properties integrate properly with Vue's reactivity system when needed.

# UI Components & Styling (Nuxt UI & Tailwind)
- **CRITICAL - Nuxt UI**: Maximize the use of `@nuxt/ui` components (`<UButton>`, `<UCard>`, `<UTable>`, `<UMap>` if applicable, etc.). Do not build custom UI elements if a Nuxt UI equivalent exists.
- **Styling**: Exclusively use Tailwind CSS utility classes for layout, spacing, and responsive design. Do not write custom CSS or `<style scoped>` unless absolutely necessary.
- **Icons**: Use built-in Nuxt UI icons (`<UIcon name="i-heroicons-...">`) instead of external SVGs.
- **UX**: Utilize Nuxt UI's composables like `useToast()` for user feedback and `useColorMode()` for theme handling.

# Map Integration
- When dealing with mapping libraries (e.g., Leaflet, Mapbox, or Vue-specific wrappers), encapsulate the map initialization and marker management inside dedicated composables or service classes to keep the `.vue` files clean.

# State Management & Data Fetching
- Fetch internal Nitro APIs using `useFetch` or `useAsyncData` for SSR-friendly rendering.
- Keep state local to components/composables whenever possible. Use Nuxt's `useState` strictly for global, SSR-safe state sharing.

# Documentation & MCP Tools
- **CRITICAL**: You have access to Model Context Protocol (MCP) servers for Nuxt (`nuxt-docs`) and Nuxt UI (`nuxt-ui`).
- If unsure about the latest Nuxt features, Vue 3 syntax, Nuxt UI component props, or Tailwind configurations, ALWAYS use these MCP tools to query the official documentation before generating code. Do not hallucinate component APIs.