# AI R&D Platform

Professional monorepo structure for AI-powered R&D platform with ingredient management, formulations, and COGS analysis.

## Architecture

```
AI_RD_PLATFORM/
├── frontend/              # Next.js client application
├── backend/               # API routes and business logic
├── shared/                # Shared types, utils, and database schema
└── docs/                  # Documentation
```

## Workspaces

### Frontend (`frontend/`)

- Next.js application for user interface
- Pages: Dashboard, Ingredients, Formulations, COGS
- Client-side state management and components
- No API routes (uses backend)

**Start development:**

```bash
cd frontend && npm run dev
```

### Backend (`backend/`)

- API routes for Ingredients, Formulations, COGS
- Database services and middleware
- Prisma ORM with SQLite
- Business logic and data validation

**Start development:**

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
# Install all dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Development

Start all services:

```bash
npm run dev
```

Or start individual services:

```bash
npm run dev --workspace=frontend
npm run dev --workspace=backend
```

### Production Build

```bash
npm run build
npm start
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
