# Invoice system — Next steps & Optimization Plan

This document lists prioritized optimizations and reliability fixes for the invoice subsystem (frontend → API → DB → side effects). For each item I explain: where it matters (file paths), why it matters (symptoms & risk), how to implement (concrete steps), tests to validate, and an estimate of impact and complexity.

---

## Goals
- Reduce tail latency and CPU spikes for common user flows (list, view, create invoices).
- Make email sending reliable and observable (avoid fire-and-forget fragility).
- Make server-side PDF generation robust in Node environment.
- Prevent concurrency bugs in payments and invoice status transitions.
- Reduce unnecessary DB work and optimize queries for common UX paths.

---

## High-priority (P1) — Fix server PDF generation reliability

Why:
- `lib/pdf-generator.ts` uses DOM APIs (Image, canvas) which can work in-browser but are fragile on Node. Server routes call it (e.g. `app/api/invoices/[id]/pdf/route.ts` and background email send) — if Node runtime lacks DOM/canvas, PDF generation may fail or block.

Where:
- `lib/pdf-generator.ts`
- `app/api/invoices/[id]/pdf/route.ts`
- `app/api/invoices/[id]/send/route.ts` (background send)

How (recommended):
1. Replace DOM-dependent image handling with Node-compatible approach. Two viable options:
   - Option A (recommended short-term): Use `node-canvas` to implement server-safe image loading and drawing, and keep jsPDF for layout. Replace canvas usage in `addLogoToPDF` with node-canvas code (load image via `sharp` or `node-fetch` then draw using `canvas` API).
   - Option B (recommended long-term): Move server PDF generation to a headless Chromium renderer (Puppeteer) and render a small HTML invoice template to PDF. This gives pixel-perfect HTML/CSS control and easier styling.
2. Implement a thin abstraction in `lib/pdf-generator.ts`:
   - Export `generateInvoicePDF({ source: 'server' | 'browser', ...})` so code chooses Node-safe path on server and DOM path in browser.
   - Add a small test harness `scripts/generate-pdf-test.js` that loads a sample invoice and ensures server PDF output.

Concrete steps (Option A):
- Add dependencies: `npm i canvas sharp node-fetch` (or use built-in fetch node 18+), and add types if needed.
- In `lib/pdf-generator.ts`, detect environment: if `typeof window === 'undefined'` then use node-canvas helper:
  - fetch image bytes
  - create canvas via `const { createCanvas, loadImage } = require('canvas')`
  - draw and convert to PNG buffer
  - call `doc.addImage` with data URL or buffer as needed
- Add try/catch fallback to render initials if logo fetch fails.

Tests:
- Add `scripts/generate-pdf-test.js` that calls server endpoint `/api/invoices/:id/pdf` or directly imports `generateInvoicePDF` server-side and writes `out.pdf` to disk. Run locally and confirm PDF opens.

Impact & effort:
- Impact: High — fixes a frequent production failure (emails/PDFs failing), reduces support tickets. 
- Effort: Medium (2–4 dev hours) for Option A, longer for Puppeteer.

---

## High-priority (P1) — Reliable email sending (don't rely on fire-and-forget)

Why:
- Background email send is fire-and-forget (IIFE inside `app/api/invoices/[id]/send/route.ts`). If a server instance is killed, job lost. Lack of retries and centralized visibility.

Where:
- `app/api/invoices/[id]/send/route.ts`
- `lib/email.ts` (transporter)

How:
1. Introduce a persistent job queue (recommended: BullMQ + Redis or RSMQ for smaller installs). Move heavy work (PDF generation, SMTP send) to a worker.
2. Flow change:
   - API: create a `email_jobs` DB table or use queue; when user requests send, the route will `prisma.invoice.update()` with queued metadata and enqueue a job with job payload (invoiceId, userId, recipient, cc, message, trackingId).
   - Worker: picks job, loads invoice and user, generates PDF using server-safe generator, sends via `lib/email.getTransporter()`, updates invoice deliveryStatus and logs results.
3. Add retry/backoff and dead-letter handling for failed sends.
4. Add monitoring: record job status in DB with timestamps, add a health dashboard or metric (Prometheus or simple admin page) listing failed sends.

Concrete steps:
- Add Redis dependency and BullMQ in the backend: `npm i bullmq ioredis`.
- Create `workers/emailWorker.ts` that subscribes to queue and processes jobs.
- Modify send route to push job to queue instead of starting IIFE.
- Add `email_jobs` Prisma model (optional) to persist job payload and status for auditing.
- Add retries and failure notifications (email to admin or Sentry logs).

Tests:
- Enqueue sample job locally and verify worker processes and updates invoice status.
- Kill worker during a send to verify job stays in queue and is retried/resumed.

Impact & effort:
- Impact: High reliability improvement, allows retries and observability. 
- Effort: Medium to Large (4–10 dev hours), plus adding Redis infra.

---

## High-priority (P1) — Make payments and status updates transactional (avoid race conditions)

Why:
- Concurrent payments (or recordings from third parties) can race when each reads current sum and then writes status. This can briefly allow over/under-counting or inconsistent status.

Where:
- `app/api/invoices/[id]/payments/route.ts`

How:
1. Wrap payment create + invoice status decision in a single `prisma.$transaction` so the sums are consistent.
2. Better: compute total paid inside the transaction using `prisma.payment.aggregate` or use a Postgres `SELECT SUM(amount) FROM payments WHERE invoiceId = $1 FOR UPDATE` pattern before update.
3. Optionally use advisory locks per invoice to serialize operations: `pg_advisory_xact_lock(hashtext(invoiceId))` inside a raw query before making changes.

Concrete steps:
- Replace current sequence with transaction:
  - Start transaction
  - Create payment
  - Aggregate sum of payments for invoice via `prisma.payment.aggregate` inside transaction
  - Compute new status
  - Update invoice status in same transaction
  - Commit
- Alternatively (if using raw SQL): use advisory locks or `FOR UPDATE` selectors.

Tests:
- Create two parallel requests (via `ab` or `wrk` or a small Node script) that post payments to same invoice simultaneously and verify final status is correct and payments both recorded.

Impact & effort:
- Impact: High for correctness. 
- Effort: Low to medium (1–3 hours) to implement and test.

---

## Medium-priority (P2) — Optimize invoice listing and reports

Why:
- Invoice list is a frequent request. Current `prisma.invoice.findMany` is optimized but can be further improved for large datasets (indexes, selective fields, virtual scrolling, caching).

Where:
- `app/api/invoices/route.ts` (GET)
- `app/api/reports/*` routes

How:
1. Add DB indexes on commonly filtered/sorted columns: `createdAt`, `userId`, `status`, `number` (see `prisma/migrations` already contains some indexes — confirm coverage).
2. Ensure `findMany` uses selective `select` and `_count` rather than big includes (already done). If loading more detail for a single invoice, fetch that in detail API only.
3. Add server-side caching for non-sensitive list results:
   - Use shallow caching (Cache-Control: private, max-age=180) or a short Redis cache keyed by userId+filters for expensive reports.
4. Implement virtual scrolling on frontend for long lists and use cursor-based pagination (prefer `createdAt`+`id` cursor) to avoid OFFSET for large offsets.

Concrete steps:
- Review `prisma.schema` and add indexes via migration for (userId, createdAt), (userId, status), number unique index if necessary.
- Implement cursor pagination in `app/api/invoices/route.ts` and update frontend `InvoicesPage.fetchInvoices` to request `after` cursor rather than `offset`.

Tests:
- Load list with 50k invoices in a test DB and verify page response times and memory usage.

Impact & effort:
- Impact: Medium to high for large accounts. 
- Effort: Medium (2–6 hours including migration and frontend changes).

---

## Medium-priority (P2) — Audit and standardize auth flow

Why:
- Codebase uses a mix of `getAuthHeaders()` (Bearer token) and `credentials: 'include'` (cookies). Mixed approaches can introduce bugs when tokens expire or when server expects cookies.

Where:
- `lib/auth-context.tsx` (`getAuthHeaders`)
- `utils/supabase/server.ts`, `lib/auth.ts`, `utils/supabase/middleware.ts`

How:
- Choose a primary approach and document it in `docs/auth-session-flow.md`.
  - Option 1: Always send Authorization Bearer from the client (`getAuthHeaders()`). Server verifies via `lib/auth.ts` service client. Pros: explicit headers, helpful for non-browser clients.
  - Option 2: Use cookies + `createServerClient` & `credentials: 'include'`. Pros: easier for SSR flows and automatic refresh by Supabase SDK.
- Implement a linter check or helper wrapper `apiFetch()` that attaches headers consistently and replace ad-hoc fetch header calls.

Impact & effort:
- Impact: Low-to-medium (stability and fewer edge bugs). 
- Effort: Low (1–3 hours).

---

## Low-priority (P3) — Misc improvements and observability

1. Add metrics & logging:
   - Add counters/timers for slow endpoints: `/api/invoices` list, `/api/invoices/:id/pdf`, `/api/invoices/:id/send`.
   - Use Sentry or a lightweight metrics collector to track email failures and PDF errors.
2. Add tests and CI checks for critical flows: create invoice, send email (mocked), payment recording.
3. Add a retry policy to `generateInvoicePDF` when fetching remote images (logo) to avoid temporary network failures.
4. Add storage lifecycle for logos: if you store many images in Supabase storage, add lifecycle rules or a retention cleanup to avoid cost/ clutter.

Estimated effort: 1–2 days across items depending on depth.

---

## Suggested implementation roadmap (2-week plan)
Week 1 (stabilize & fix critical bugs):
- Implement server-safe PDF generator (Option A) and smoke-test PDF endpoint (P1)
- Make payments transactional to avoid races (P1)
- Replace background IIFE with a job-enqueue call (enqueue only) so route returns quickly and job exists (start of email reliability refactor) (P1)

Week 2 (reliability & performance):
- Implement worker for email jobs using BullMQ (P1)
- Add basic dashboard/metrics for email queue and failed jobs (P2)
- Start cursor-based pagination and DB index review for lists (P2)

Follow-up (opt):
- Replace server PDF with Puppeteer-based renderer for perfect HTML/CSS invoices (P2)
- Add end-to-end tests and CI gating (P2)

---

## Quick "how to test locally" recipes
- Run server and worker locally (power user):

```powershell
# start dev server
npm run dev

# start worker (example script - implement workers/emailWorker.ts and a 'worker' script in package.json)
npm run worker
```

- Manual API checks (replace <ID>):

```powershell
# get next invoice number (authenticated via getAuthHeaders) - example using curl with token
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/api/invoices/next-number

# generate PDF for invoice id
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/api/invoices/<ID>/pdf --output out.pdf

# enqueue/send invoice (quick test)
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <ACCESS_TOKEN>" -d '{"recipientEmail":"test@example.com","message":"hi"}' http://localhost:3000/api/invoices/<ID>/send
```

---

## Final notes
- Many changes above are additive and low-risk when implemented behind feature flags or with a rollout plan (queue first, then move worker to process). 
- I can implement one P1 item next (pick: server-safe PDF or email queue or transactional payments). Tell me which to implement and I'll create a focused plan + PR with code changes and tests.

---

Files I will update if you pick an item now:
- `lib/pdf-generator.ts` (PDF fix)
- `app/api/invoices/[id]/send/route.ts` and `workers/emailWorker.ts` (email queue)
- `app/api/invoices/[id]/payments/route.ts` (transaction)
- `prisma/schema.prisma` (if we add `email_jobs` or add indexes)

