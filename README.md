# AI R&D Platform

Professional monorepo structure for an AI-powered beverage R&D platform.

## Architecture

```
AI_RD_PLATFORM/
├── web/                   # Active Next.js App Router product
├── frontend/              # Legacy frontend snapshot
├── backend/               # Legacy/secondary API app
├── shared/                # Shared types, utils, and database schema
└── docs/                  # Documentation
```

## Active Application

The production app lives in `web/`.

Run it from the repo root with:

```bash
npm run dev
```

Or directly:

```bash
cd web && npm run dev
```

## Packages

### Web (`web/`)

- Next.js App Router application used in production
- Formulations, ingredients, calculators, shelf-life, dashboard, and AI assistant
- The Vercel project should point at this package

### Frontend (`frontend/`)

- Legacy frontend snapshot kept for reference

### Backend (`backend/`)

```bash
cd backend && npm run dev
```

### Shared (`shared/`)

- TypeScript types for Ingredient, Formulation, FormulationIngredient
- Utility functions (validation, formatting, error handling)
- Prisma schema and migrations
- Shared constants

## Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies for the active web app
npm install
```

### Development

Start the active web product from the repo root:

```bash
npm run dev
```

Optional direct package commands:

```bash
cd web && npm run dev
cd backend && npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

## API Endpoints

### Ingredients

- `GET /api/ingredients` - List all ingredients
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

### Formulations

- `GET /api/formulations` - List formulations
- `POST /api/formulations` - Create formulation
- `PUT /api/formulations/:id` - Update formulation
- `DELETE /api/formulations/:id` - Delete formulation

### COGS

- `GET /api/cogs/:formulationId` - Calculate COGS

## Project Structure

### Types

All shared types are defined in `shared/types/index.ts`:

- `Ingredient` - Ingredient model
- `Formulation` - Formulation model
- `FormulationIngredient` - Join table
- `ApiError` - Error response format

### Utilities

Common utilities in `shared/utils/index.ts`:

- `getErrorMessage()` - Error handling
- `readJsonSafe()` - Safe JSON parsing
- `normalizeNumberInput()` - Number input normalization
- `buildPayloadOrThrow()` - Validation and payload building

### Database

Prisma schema located in `shared/prisma/schema.prisma`

## Technologies

- **Framework:** Next.js 14+
- **Language:** TypeScript
- **Database:** SQLite + Prisma ORM
- **UI:** Tailwind CSS
- **Package Manager:** npm Workspaces

## Development Workflow

1. Backend: Define types in `shared/types`
2. Backend: Implement API routes in `backend/app/api`
3. Frontend: Use types from shared in `frontend/app`
4. Frontend: Create UI components and pages

## Contributing

1. Keep types in shared
2. Use consistent error handling (getErrorMessage)
3. Validate inputs before database operations
4. Update API documentation when adding endpoints
