# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and services
- `pnpm typecheck` - Type checking across the monorepo
- `pnpm lint` - Run trunk linting (uses trunk check) - note: use `trunk check` directly
- `pnpm format` - Format code (uses trunk fmt)

### Database Commands
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Apply database migrations (uses drizzle-kit push)
- `pnpm db:seed` - Seed the database with sample data
- `pnpm db:studio` - Open Drizzle Studio for database management

### Service-Specific Commands
- `pnpm dev --filter @acme/api` - Start only the API service
- `pnpm dev --filter @acme/web` - Start only the web application
- API runs on port 13001, Web app runs on port 13000

### Docker Commands
- `pnpm compose:up` - Start auxiliary services (PostgreSQL, etc.)
- `pnpm compose:down` - Stop auxiliary services
- `pnpm compose:status` - Check service status

## Architecture Overview

This is a full-stack TypeScript monorepo using pnpm workspaces with three main layers:

### Project Structure
- **`apps/web/`** - Next.js 15 frontend application with React Query and Tailwind
- **`services/api/`** - Fastify backend API service with PostgreSQL integration
- **`packages/db/`** - Drizzle ORM database layer with PostgreSQL schemas
- **`packages/ui/`** - Shared UI components library
- **`packages/id/`** - ID generation utilities
- **`tools/`** - Shared TypeScript and Tailwind configuration

### Key Technologies
- **Frontend**: Next.js 15, React 18, TanStack Query, Tailwind CSS
- **Backend**: Fastify, TypeScript, Zod validation
- **Database**: PostgreSQL with Drizzle ORM
- **Tooling**: Turbo (build system), Biome (linting), pnpm (package manager)

### Database Architecture
The database uses PostgreSQL with a custom `users` schema and includes:
- Users management with Telegram authentication
- Flats/apartments management system
- Ads/listings management
- Session handling for Telegram users

### Authentication Flow
1. Access auth page: `http://localhost:13000/link?i=123` (where `i` is user ID)
2. System creates mock user and stores in localStorage
3. Redirects to `/my-flats` for apartment management
4. All authenticated pages require localStorage session

### API Integration
The system integrates with a Python API service (port 8008) for property parsing:
- Property data parsing from external sources
- Batch parsing capabilities
- Text-based property parsing
- Health checks and retry logic

## Environment Setup

Required environment files:
- `apps/web/.env.local` - Frontend configuration (NEXT_PUBLIC_API_URL)
- `services/api/.env` - Backend configuration (PORT, PYTHON_API_URL, DATABASE_URL)
- `packages/db/.env` - Database configuration

## Code Style

The project uses:
- Biome for linting and formatting
- Single quotes for JavaScript/TypeScript
- Space indentation
- Semicolons as needed (asNeeded)
- Trunk for additional code quality checks