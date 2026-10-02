# BevOrigin R&D Workspace

Private, invitation-only Next.js workspace for BevOrigin formulation, ingredient,
calculator, and shelf-life projects. The production URL is
`https://app.bevorigin.com`.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Set variables in `.env` locally and in Vercel Project Settings → Environment Variables.

- `DATABASE_URL` (required in production)
  - PostgreSQL connection string used by Prisma.
- `NEXTAUTH_SECRET` (required in production)
  - Secret used by NextAuth for JWT/session encryption.
- `NEXTAUTH_URL` (required in production)
  - Canonical application URL: `https://app.bevorigin.com`.
- `AUTH_URL` (required in production)
  - Set to the same canonical URL for Auth.js compatibility.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional pair)
  - Enables the Google sign-in button and OAuth flow.
  - Existing Vercel projects may keep the equivalent `AUTH_GOOGLE_ID` and
    `AUTH_GOOGLE_SECRET` names; the app supports both conventions.
- `ADMIN_EMAIL` (optional)
  - Single admin email address.
- `ADMIN_EMAILS` (optional)
  - Comma-separated admin email list.
- `ALLOW_DEV_NO_LOGIN` (optional, default `false`)
  - Development auth bypass control.
- `DEMO_MODE` (optional)
  - Enables demo-safe mode behavior for testers.
- `NEXT_PUBLIC_DEMO_MODE` (optional)
  - Public demo flag used by client UI badge.

Behavior:

- In production, missing required variables throw a clear startup error.
- Public registration is disabled. Google sign-in succeeds only for an existing
  workspace user or an address configured in `ADMIN_EMAIL(S)`.
- In development, missing required variables print warnings and use safe local fallbacks where possible.
- Configure required variables for both Production and Preview in Vercel so
  pull-request builds can generate Prisma and exercise authentication.

## Deploy to Vercel

1. Push code to GitHub

- Commit and push your branch/repository.

2. Import into Vercel

- Vercel Dashboard → New Project → Import Git Repository.
- Select this `web` project root when prompted.
- Deploy.

3. Configure environment variables

- Vercel → Project → Settings → Environment Variables.
- Add at least:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `AUTH_URL`
- Add optional flags if needed (`DEMO_MODE`, `NEXT_PUBLIC_DEMO_MODE`, admin emails).

4. Prisma in deployment

- `postinstall` runs `prisma generate` automatically.
- Migrations:
  - Run `npm run migrate:deploy` in CI/CD before serving traffic, or
  - Run it manually in an ops step for production database updates.

5. Verify deployment

- Open your deployed app URL.
- Health check endpoint:
  - `/api/health`
  - Expected JSON: `{ "status": "ok", "timestamp": "...", "env": "production" }`

## Troubleshooting

- Build fails with missing env var
  - Ensure required vars are set in Vercel Project Settings.
  - Redeploy after saving variables.

- Prisma errors on deploy
  - Confirm `DATABASE_URL` points to reachable production Postgres.
  - Ensure migrations are applied with `npm run migrate:deploy`.

- Runtime auth/session issues
  - Verify `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `AUTH_URL` are set correctly.
  - Google OAuth must allow
    `https://app.bevorigin.com/api/auth/callback/google` as an authorized redirect
    URI.

## Deployment Checklist

- Local
  - `npm run build`

- Deploy
  - Import repo in Vercel
  - Set env vars

- Test
  - Open production URL
  - Open `/api/health`
