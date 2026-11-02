# Copilot Instructions – QRMeal

You are GitHub Copilot Chat. These instructions override default behavior. Apply them to ALL code generation, refactors, and explanations.

## Project Overview

QRMeal is a restaurant management system with QR code ordering for guests. Monorepo project using pnpm workspaces and Turborepo.

## Project Structure

```
QRMeal/
├── client/                  # Next.js 16 frontend (App Router)
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   │   ├── [locale]/  # Internationalized routes
│   │   │   └── api/       # API route handlers
│   │   ├── components/    # React components
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── apiRequests/   # API client functions
│   │   ├── queries/       # TanStack Query hooks
│   │   ├── schemaValidations/ # Zod schemas (shared with server)
│   │   ├── i18n/          # next-intl configuration
│   │   ├── lib/           # Utilities (http client, utils)
│   │   └── types/         # TypeScript types
│   ├── messages/          # i18n translations (en, vi)
│   └── public/            # Static assets
├── server/                 # Fastify backend (TypeScript)
│   ├── src/
│   │   ├── routes/        # API routes (auth, order, dish, etc.)
│   │   ├── controllers/   # Business logic controllers
│   │   ├── database/      # Prisma client instance
│   │   ├── schemaValidations/ # Zod schemas for validation
│   │   ├── hooks/         # Fastify hooks & plugins
│   │   ├── jobs/          # Cron jobs
│   │   └── utils/         # Helper utilities
│   ├── prisma/            # Prisma ORM
│   │   ├── schema.prisma  # Database schema
│   │   └── dbml/          # Database documentation
│   ├── generated/         # Prisma generated client
│   ├── uploads/           # User uploaded files
│   └── scripts/           # Database seed scripts
├── scripts/               # Build/CI scripts
└── postman/               # API collections & environments
```

## CRITICAL RULES (Always follow)

- NEVER use `any` - always provide explicit types
- ALWAYS validate input using Zod schemas
- ALWAYS use absolute imports with TypeScript path aliases
- Controllers contain business logic (this project uses controllers directly, not service layer)
- Use Prisma client from `server/generated/prisma/`
- Permission/authentication check is REQUIRED for protected routes
- Both frontend and backend share Zod schemas for type safety

## Backend Rules (Fastify + TypeScript)

- **Framework**: Fastify (not Express, not NestJS)
- **TypeScript**: Strict mode enabled
- **Validation**: Use Zod schemas with `fastify-type-provider-zod`
- **ORM**: Prisma with SQLite (adapter: better-sqlite3)
- **Authentication**: JWT-based (fast-jwt library)
- **Imports**: Absolute paths configured via tsconfig paths
- **Error handling**: Use Fastify reply.code() for HTTP errors
- **Structure**:
  - Routes: Define endpoints in `src/routes/`
  - Controllers: Business logic in `src/controllers/`
  - Validations: Zod schemas in `src/schemaValidations/`
  - Database: Prisma client from `src/database/prisma.ts`
- **Real-time**: Socket.IO integrated via `fastify-socket.io`
- **Static files**: Served via `@fastify/static` for uploads
- **Security**: Use `@fastify/helmet` and `@fastify/cors`

## Database Rules (Prisma + SQLite)

- **Provider**: SQLite with better-sqlite3 adapter
- **Schema location**: `server/prisma/schema.prisma`
- **Generated client**: `server/generated/prisma/`
- **Snapshot pattern**: Use DishSnapshot for order history (preserves dish state at order time)
- **Relations**: Use proper Prisma relations with onDelete/onUpdate actions
- **Timestamps**: Always include `createdAt` and `updatedAt`
- **Queries**: Use Prisma's type-safe query builder
- **Avoid N+1**: Use `include` or `select` strategically

## Frontend Rules (Next.js 16 + React 19)

- **Framework**: Next.js 16 with App Router (not Pages Router)
- **React**: Version 19.2.3
- **TypeScript**: Strict mode enabled
- **Routing**: Use App Router conventions in `src/app/[locale]/`
- **i18n**: next-intl for internationalization (en, vi)
- **State Management**:
  - Server state: TanStack Query (`@tanstack/react-query`)
  - Client state: React hooks (useState, useReducer)
  - No Zustand in this project
- **Styling**: Tailwind CSS + shadcn/ui components
- **HTTP Client**: Custom http client in `src/lib/http.ts` (based on fetch)
- **Forms**: react-hook-form + Zod validation
- **API Layer**:
  - API request functions in `src/apiRequests/`
  - TanStack Query hooks in `src/queries/`
  - Shared Zod schemas in `src/schemaValidations/`
- **Components**:
  - UI components in `src/components/ui/` (shadcn)
  - Feature components in `src/components/`
- **Real-time**: Socket.IO client for live updates

## DO NOT

- Do not put business logic in controllers or components
- Do not expose sensitive fields (password, tokens)
- Do not use relative imports across modules
- Do not bypass permission checks
- Do not ignore TypeScript errors

## Related Instructions

- See `.github/instructions/nextjs-tailwind.instructions.md` for NextJS patterns
- See `.github/instructions/typescript-5-es2022.instructions.md` for TypeScript rules
