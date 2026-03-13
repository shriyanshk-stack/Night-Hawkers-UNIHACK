# AGENTS Guide

This file gives coding agents a fast overview of the repository and the conventions to follow.

## Repo structure

- `frontend/`: React + Vite + TypeScript app.
- `backend/`: Express + TypeScript API.
- `swagger.yaml`: high-level API contract draft.

## Current architecture status

- Backend auth is implemented and split by layers (`routes` / `services` / `middleware` / `lib`).
- Supabase is the persistence layer for auth users + sessions.
- Frontend is still mostly scaffold-level and not fully wired to backend auth yet.

## General coding rules

- Keep changes scoped; avoid broad refactors unless requested.
- Prefer TypeScript strictness and explicit return types for exported functions.
- Do not commit secrets (`.env`, tokens, keys).
- Keep API behavior backward compatible when adding features.
- Update docs/examples when adding new required env vars or endpoint contracts.

## Backend conventions (quick)

- Mount feature routers from `backend/src/index.ts`.
- Keep HTTP concerns in route handlers; move business/data logic to services.
- Reuse shared middleware for cross-cutting concerns (auth, validation, etc.).
- Use Supabase through centralized client module(s), not ad hoc client creation.

## Auth contract summary

- Base path: `/v1/auth`
- Public routes:
  - `POST /register`
  - `POST /login`
- Protected routes:
  - `GET /me`
  - `POST /logout`
- Token transport: request header `x-bearer-token`
- Login response returns token in JSON body (not response headers).

For implementation details, see `backend/AGENTS.md`.
