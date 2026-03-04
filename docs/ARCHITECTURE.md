# Documentation

## Project Overview

AI R&D Platform is a professional monorepo for managing ingredients, formulations, and COGS analysis.

## Architecture

### Frontend (`/frontend`)

- Next.js 14+ application
- User interface for ingredients, formulations, and COGS
- Calls backend API endpoints
- Tailwind CSS styling

### Backend (`/backend`)

- Next.js API routes
- Database operations via Prisma ORM
- SQLite database with better-sqlite3 adapter
- API endpoints for all data operations

### Shared (`/shared`)

- TypeScript type definitions
- Utility functions
- Prisma schema and migrations
- Shared constants and validators

## Development Workflow

### 1. Start Development Environment

**Terminal 1 - Frontend:**

```bash
cd frontend
npm run dev
```

Runs on http://localhost:3000

**Terminal 2 - Backend:**

```bash
cd backend
npm run dev
```

Runs on http://localhost:3001

### 2. Making Changes

**Add a new API endpoint:**

1. Create route file in `backend/app/api/`
2. Define types in `shared/types/index.ts`
3. Use in frontend with fetch to `http://localhost:3001/api/...`

**Create shared utility:**

1. Add function to `shared/utils/index.ts`
2. Export from shared
3. Import in frontend/backend

**Update database schema:**

1. Modify `shared/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Regenerate client: `npx prisma generate`

### 3. Building for Production

```bash
npm run build
npm start
```

## Database

### Schema Location

`shared/prisma/schema.prisma`

### Migrations

`shared/prisma/migrations/`

### Generate Client

```bash
npx prisma generate
```

### Run Migrations

```bash
npx prisma migrate deploy
```

## File Structure

```
AI_RD_PLATFORM/
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── ingredients/
│   │   ├── formulations/
│   │   ├── cogs/
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── types.ts
│   └── package.json
│
├── backend/
│   ├── app/
│   │   └── api/
│   │       ├── ingredients/
│   │       │   ├── route.ts              # GET, POST
│   │       │   └── [id]/route.ts         # PUT, DELETE
│   │       └── formulations/
│   ├── lib/
│   │   └── prisma.ts
│   └── package.json
│
├── shared/
│   ├── types/
│   │   └── index.ts           # Ingredient, Formulation, etc.
│   ├── utils/
│   │   └── index.ts           # Validation, formatting
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md         (this file)
│
├── package.json               # Root workspace
└── README.md
```

## Key Decisions

### Monorepo Structure

- **Separation of Concerns:** Frontend, backend, and shared are distinct packages
- **Code Reuse:** Shared types prevent duplication
- **Scalability:** Easy to add microservices or workers later

### Database in Shared

- Ensures both frontend and backend can reference schema
- Migrations are centralized
- Single source of truth for data model

### API on Different Port

- Clean separation of concerns
- Easier to troubleshoot issues
- Can easily move backend to separate service later

### Types in Shared

- Prevents type duplication
- Ensures consistency between frontend and backend
- Single point of update for data models

## Environment Variables

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`.env.local`)

```
DATABASE_URL=file:../shared/prisma/dev.db
NODE_ENV=development
```

### Shared (`.env`)

```
DATABASE_URL=file:./prisma/dev.db
```

## Common Tasks

### Add New Data Model

1. Update `shared/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_feature`
3. Update types in `shared/types/index.ts`
4. Create API routes in `backend/app/api/`
5. Create UI in `frontend/app/`

### Add New API Endpoint

1. Create `backend/app/api/resource/route.ts`
2. Add types to `shared/types/index.ts`
3. Add service logic to `backend/src/services/`
4. Update frontend to call new endpoint

### Fix Database Issue

1. Check database file at `shared/prisma/dev.db`
2. Run migrations: `npx prisma migrate deploy`
3. Regenerate client: `npx prisma generate`
4. Restart both servers

## Troubleshooting

### API Connection Error

- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Verify no firewall blocks localhost

### Database Error

- Run `npx prisma generate` to regenerate client
- Check `DATABASE_URL` environment variable
- Verify database file exists at specified path

### Type Errors

- Ensure types are exported from `shared/types/index.ts`
- Regenerate Prisma types: `npx prisma generate`
- Restart IDE for TypeScript to reload

## Performance Considerations

- Database queries are optimized with proper indexing
- API responses are JSON with minimal overhead
- Frontend uses Next.js optimizations (Image, Link, Code Splitting)
- Backend handles concurrent requests efficiently

## Security

- Input validation on both frontend and backend
- Error messages don't expose internal details
- Database operations use parameterized queries (Prisma)
- Consider adding authentication for production
