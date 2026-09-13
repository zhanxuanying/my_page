# Online writing implementation plan

> For agentic workers: use superpowers:executing-plans to execute this plan in the current task.

**Goal:** Deliver the complete online writing and reading workflow on the existing Cloudflare URL.

**Architecture:** Next.js routes host Payload admin, REST API and blog reader. Existing homepage assets stay intact. Payload uses a separate Supabase Postgres schema; images use Supabase Storage. Hyperdrive pools production database connections without query caching.

**Tech Stack:** Next.js 16, Payload 3.89, React 19, OpenNext Cloudflare, PostgreSQL, Lexical, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-13-online-writing-design.md`

## Global constraints

- Preserve current content, styling, tools, URLs and Supabase public table.
- No public registration, secret leakage, destructive seeds or paid subscriptions.
- Access control applies to REST and Local API, including drafts, preview and versions.
- Tests cover externally meaningful behavior; generated framework boilerplate is reused from the official template.

## Tasks

- [x] **1. Framework and infrastructure:** add Next/OpenNext/Payload packages and route boilerplate; configure dedicated DB schema/role and persistent storage; keep static build available for GitHub Pages. Files: package.json, next.config.ts, open-next.config.ts, wrangler.jsonc, scripts/prepare-app.mjs, src/payload.config.ts.
- [x] **2. CMS model and permissions:** first test access predicates, content import and media validation; implement Users, Posts, Media and storage adapter. Files: src/collections/*, src/lib/*, src/storage/*, tests/cms*.test.*. Users cannot register anonymously; anonymous posts read filters published state/time.
- [x] **3. Data migration and bootstrap:** generate and inspect schema migration, apply to isolated schema, import existing posts idempotently, initialize one administrator through local CLI. Files: src/migrations/*, scripts/import-posts.ts, scripts/admin-account.ts. Verify original table unchanged and no anonymous schema privileges.
- [x] **4. Writing and reading UI:** branded Chinese admin and Lexical editor, previews and versions; build blog index, search/category/pagination, reader/TOC/progress/share/RSS/SEO and homepage integration. Files: src/app/(payload)/*, src/app/(blog)/*, src/components/*, blog.js, app.js, index.html.
- [x] **5. Verification and deployment:** run tests/typecheck/build; test real login, draft/publish/edit/version/media/anonymous restrictions; deploy existing Worker; verify HTTPS/UI and no secret assets; push with existing authorized SSH key; document login and editing instructions.
