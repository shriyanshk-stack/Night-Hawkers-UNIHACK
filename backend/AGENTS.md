# Backend AGENTS Guide

This guide describes the backend architecture and preferred patterns for coding agents.

## Stack

- Runtime: Node.js + Express
- Language: TypeScript (strict)
- Persistence: Supabase Postgres
- Auth: Supabase Auth (email/password + JWT sessions)

## Source layout

- `src/index.ts`: app bootstrap, middleware registration, router mounting.
- `src/routes/`: HTTP handlers and request/response shaping.
- `src/services/`: business logic and DB operations.
- `src/middleware/`: reusable request middleware.
- `src/lib/`: shared clients/utilities (e.g., Supabase client).
- `src/types/`: ambient/shared TS types (e.g., Express request augmentation).

## Layering rules

- Routes should handle:
  - request parsing/validation
  - status code mapping
  - response formatting
- Services should handle:
  - core logic
  - Supabase reads/writes
  - domain-level errors (use typed errors)
- Middleware should handle cross-cutting concerns and be reusable across features.
- Avoid calling Supabase directly from routes when a service exists.

## Auth implementation details

- Base path: `/v1/auth`
- Routes:
  - `POST /register`
  - `POST /login`
  - `GET /me` (protected)
  - `POST /logout` (protected)
- Token flow:
  - Login returns `accessToken` and `refreshToken` from Supabase Auth.
  - Incoming access tokens are read from `Authorization: Bearer <token>`.
  - Token validation uses Supabase Auth `getUser()` with a user-scoped client.
  - Use `requireAuth` middleware to protect endpoints.

## Database contract (current)

- User identities and sessions are managed by Supabase Auth (`auth.users` + auth session internals).
- Do not store app passwords in custom tables.

## Environment variables

- Required:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- Optional:
  - `PORT` (default `3000`)
  - `SUPABASE_SERVICE_ROLE_KEY` (only if adding admin-level operations)

Never commit real env values; keep examples in `.env.example`.

## Implementation checklist for new protected routes

1. Add route in `src/routes/*`.
2. Attach `requireAuth` middleware.
3. Put non-HTTP logic in a service function.
4. Return typed/safe response objects (never log tokens or secrets).
5. Run `npm run build` before finalizing.

## Error handling pattern

- Throw `AuthServiceError` (or feature-specific equivalent) from service layer for known cases.
- Catch in routes and map to HTTP responses.
- Use generic 500 messages for unknown/internal failures.
