# Backend Architecture (Nuxt Nitro)
- The backend lives inside the `server/` directory (`server/api/`, `server/utils/`).
- All API routes must use `defineEventHandler`.

# Data Handling & API Rules
- Always validate incoming query parameters and request bodies.
- Ensure proper error handling using `createError()` to send meaningful HTTP status codes to the frontend.

# Documentation & MCP Tools
- You have access to the Model Context Protocol (MCP) server for Nuxt (`nuxt-docs`).
- **CRITICAL**: Use this MCP tool to query the official Nuxt/Nitro documentation whenever you are working on server API routes (`server/api/`), server utilities, or storage/caching configurations.

# Server Architecture & OOP
- Apply the Service and Repository patterns. 
- API route handlers (`defineEventHandler`) must be completely lean. They should only handle HTTP requests/responses and delegate all processing to dedicated service classes.
- Store these reusable classes in the `server/utils/` or a dedicated `server/services/` directory.