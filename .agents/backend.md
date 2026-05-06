# Backend Architecture (Nuxt Nitro)
- **Directory**: The backend lives inside the `server/` directory (`server/api/`, `server/utils/`, `server/plugins/`).
- **Handlers**: All API routes must be defined using `defineEventHandler`.

# Server Architecture & OOP (Service/Repository Pattern)
- **Lean Handlers**: API route handlers (`defineEventHandler`) MUST be completely lean. They only parse the incoming request, call a service class, and return the response.
- **Services & Repositories**: Delegate all heavy lifting (data parsing, fetching, geocoding) to dedicated classes stored in `server/utils/` or `server/services/`.
- **Modularity**: Build independent classes for distinct tasks (e.g., `PoliceTickerScraperService`, `GeocodingService`, `CrimeDataRepository`).

# Data Handling & API Rules
- **Validation**: Always validate incoming query parameters and request bodies (use `zod` or similar validation tools if configured, otherwise strict TS checks).
- **Error Handling**: Ensure robust error handling. Use `createError()` to return meaningful HTTP status codes (400, 404, 500) and clear error messages to the frontend.
- **External Fetching & Resilience**: When fetching data from the police ticker, implement robust try/catch blocks. Assume the external source might change its structure or go offline.

# Caching & Storage
- **CRITICAL - Rate Limiting**: Since external data sources (like police tickers) can block IPs upon excessive requests, aggressively use Nitro's caching (`defineCachedEventHandler`, `cachedFunction`) or the built-in key-value storage (`useStorage()`) to cache parsed results.

# Documentation & MCP Tools
- **CRITICAL**: You have access to the Model Context Protocol (MCP) server for Nuxt (`nuxt-docs`).
- ALWAYS use this MCP tool to query the official Nitro/Nuxt documentation whenever working on server API routes, server utilities, background tasks (cron), or caching/storage configurations. Do not rely on outdated knowledge for Nitro specifics.