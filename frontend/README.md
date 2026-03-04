# Frontend Application

Next.js client application for AI R&D Platform.

## Development

```bash
npm run dev
```

App runs on `http://localhost:3000`

## Pages

- `/` - Dashboard
- `/ingredients` - Ingredient management
- `/formulations` - Formulation builder
- `/cogs` - COGS analysis

## Architecture

- `app/` - Next.js pages and layouts
- `lib/` - Utilities and helpers
- `public/` - Static assets
- `components/` - Reusable React components (optional)

## Configuration

Update API base URL in environment:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
