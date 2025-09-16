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

### Local Development
Copy `.env.example` files and configure:

```bash
# Frontend
cp apps/web/.env.example apps/web/.env.local
```

Required environment files:
- `apps/web/.env.local` - Frontend configuration (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BASE_URL)
- `services/api/.env` - Backend configuration (PORT, PYTHON_API_URL, DATABASE_URL)
- `packages/db/.env` - Database configuration

### Production Deployment

#### Netlify (Frontend only with mock API)
1. Connect repository to Netlify
2. Set build command: `turbo run build --filter @acme/web`
3. Set publish directory: `apps/web/.next`
4. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://yourdomain.netlify.app/api`
   - `NEXT_PUBLIC_BASE_URL` = `https://yourdomain.netlify.app`

#### Full Stack Deployment
1. **Backend API**: Deploy to Railway/Heroku/Render
   - Set environment variables for database and external APIs
   - Note the deployed API URL

2. **Frontend**: Deploy to Netlify/Vercel
   - Set `NEXT_PUBLIC_API_URL` to your backend API URL
   - Set `NEXT_PUBLIC_BASE_URL` to your frontend domain

3. **Database**: PostgreSQL on Railway/Supabase/Neon
   - Update `DATABASE_URL` in backend environment

#### Self-hosted Server
1. Clone repository
2. Create `.env.local` files with your server URLs
3. Run with Docker or direct deployment:
   ```bash
   pnpm install
   pnpm build
   pnpm start
   ```

## Code Style

The project uses:
- Biome for linting and formatting
- Single quotes for JavaScript/TypeScript
- Space indentation
- Semicolons as needed (asNeeded)
- Trunk for additional code quality checks

## Component Architecture

### My-Flats Page Refactoring (January 2025)

The main apartment editing form (`edit-flat-form.tsx`) was refactored from a monolithic 2155+ line component into a modular architecture with 17 separate files:

#### File Structure:
```
my-flats/[flatId]/components/
├── types/
│   ├── flat-form.types.ts        # Form state and collapse types
│   └── ads-blocks.types.ts       # Block component prop types
├── utils/
│   ├── ad-formatters.ts          # Data formatting utilities
│   ├── ad-updaters.ts            # Update operation helpers
│   └── excel-export.ts           # Excel export functionality
├── hooks/
│   ├── use-collapse-state.ts     # Collapsible blocks state management
│   ├── use-flat-ads-state.ts     # Main form state management
│   ├── use-flat-ads-actions.ts   # Action handlers (delete, toggle, etc.)
│   └── use-excel-export.ts       # Excel export hook
├── shared/
│   ├── collapsible-block.tsx     # Universal collapsible container
│   ├── ads-table.tsx             # Reusable ads table component
│   ├── update-buttons.tsx        # Update action buttons
│   └── flat-form-fields.tsx      # Form input fields
├── blocks/
│   ├── flat-ads-block.tsx        # "По этой квартире" block
│   ├── house-ads-block.tsx       # "По этому дому" block
│   ├── nearby-ads-block.tsx      # "В радиусе 500м" block
│   └── comparison-ads-block.tsx  # "Сравнение квартир" block
└── edit-flat-form.tsx            # Main orchestrating component (~200 lines)
```

#### Key Features:
- **Collapsible Blocks**: All 4 tabular blocks can be collapsed/expanded via chevron icons
- **Modular State Management**: Separate custom hooks for different concerns
- **Reusable Components**: Shared table and button components across blocks
- **Type Safety**: Comprehensive TypeScript interfaces for all props and state
- **Excel Export**: Dedicated hook for comparison data export
- **Action Handlers**: Centralized delete, update, and comparison toggle logic

#### Technical Patterns:
- Custom hooks pattern for state management (`use-*`)
- Component composition over inheritance
- Props drilling minimization through specialized hooks
- Separation of concerns (formatting, actions, state)
- TypeScript strict typing for all interfaces