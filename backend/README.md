# Backend API Service

API routes and business logic for AI R&D Platform.

## Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

All API endpoints are defined in `app/api/` directory.

### Ingredients API

- `GET /api/ingredients` - List all ingredients
- `POST /api/ingredients` - Create new ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

## Services

Business logic is organized in `src/services/`:

- `ingredientService.ts` - Ingredient operations
- `formulationService.ts` - Formulation operations
- `cogsService.ts` - COGS calculations

## Middleware

Request handling middleware in `src/middleware/`:

- `errorHandler.ts` - Global error handling
- `validation.ts` - Input validation
