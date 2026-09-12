# Supabase Blog Implementation Plan

> Execution: complete the tasks inline in this session, following superpowers:executing-plans and test-driven-development. Account login can proceed while local implementation continues.

**Goal:** Connect the existing blog notes to Supabase with public read-only access.

**Architecture:** Keep the static GitHub Pages website. A small browser module fetches published articles from the Supabase REST API; a PostgreSQL migration creates the table, read policy, and existing sample articles. The Supabase dashboard is the editing interface.

**Tech Stack:** HTML, CSS, plain JavaScript, PostgreSQL RLS, Node test runner, PGlite for database tests.

**Spec:** `docs/supabase-blog-design.md`

## Global Constraints

- Blog only; preserve the existing tools and visual design.
- Publishable key only in browser configuration; no server credentials in public files.
- Anonymous and authenticated visitors can read only published articles whose publication time has arrived, and cannot mutate data.
- Configured empty/error states never show local sample articles as though they came from the database.

## Tasks

- [x] Add `tests/blog.test.cjs` and `tests/database.test.cjs`. Run `npm test` before implementation to confirm the missing integration and migration fail.
- [x] Create `supabase/migrations/20260912000100_blog_posts.sql`: table, constraints, publication index, updated timestamp trigger, SELECT-only grants, RLS, three non-destructive seed inserts. Run the migration in PGlite and verify anonymous/authenticated reads and all write denials.
- [x] Add `blog.js`, `blog-data.js`, and `supabase-config.js`. Export tested configuration validation, published-article loading, safe Markdown rendering and card rendering. Preserve sample content for an unconfigured checkout.
- [x] Update `app.js` and `index.html` to load articles, render cards and dialogs, support loading/empty/retry states and load more. Add small matching styles in `styles.css`.
- [x] Update the Pages artifact allowlist to include only the new public assets. Add automated tests before deployment. Document editing/publishing, setup, permissions and credentials in `docs/supabase-setup.md` and `README.md`.
- [x] Once login is available, inspect projects and use an appropriate free project; apply the migration, obtain only its public key, and verify the public API's read-only behavior.
- [x] Run `npm test`, JavaScript syntax checks, browser desktop/mobile checks, and `git diff --check`. Push and verify Pages after real configuration is valid.
