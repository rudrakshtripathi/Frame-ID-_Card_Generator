# HH Goa 2026 Frame Generator

A no-login, mobile-first tool that turns a user's photo into a branded Hackers House Goa 2026 profile frame that can be downloaded or shared to X.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/hh-goa-frame` — the React/Vite frontend and browser canvas compositor
- `artifacts/api-server/src/routes/shares.ts` — share creation, image serving, and crawler-facing `/s/:id` HTML
- `lib/api-spec/openapi.yaml` — source of truth for health and share API contracts
- `attached_assets/` — supplied HH Goa branding and product documents

## Architecture decisions

- Photo compositing stays in the browser so upload-to-result is fast and the original photo is never persisted.
- MVP is intentionally Format A only: the PFP frame flow is the submission-critical experience.
- Share pages are served by the API at `/s/:id` with explicit Open Graph metadata because X crawlers do not execute the client app.
- The frame is generated as a 1000×1000 flattened PNG with center-crop fitting into a circular slot.

## Product

- Upload JPG, JPEG, PNG, or HEIC photos up to 25 MB.
- Auto-fit the photo into an HH Goa 2026 event frame in the browser.
- Download the generated PNG or share it to X with `#FrameInGoa`.
- Visit a shared frame page with a "Make your frame" return path.

## Gotchas

- HEIC decode support varies by browser; unsupported HEIC files show a clear inline fallback message.
- Share records are currently held in API process memory, so the share endpoint should move to persistent object storage before relying on shares across server restarts.
