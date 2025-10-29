# Invoice system — comprehensive workflow

This document traces, step-by-step, every major invoice-related functionality in the codebase (frontend → API → DB → auth → side effects), with exact file/function references and counts of network/DB calls. Use this as the canonical reference for optimization work.

---

## Conventions
- "Client" = browser UI / React components under `app/...` and `components/...` using `useAuth()` to get headers.
- "Server" = Next.js route handlers under `app/api/...` using `createClient()` (server Supabase client) + `prisma` for DB.
- "DB" = Prisma (Postgres) operations via `prisma.*` methods.
- File references are absolute to repository root.

---

# 1. Authentication & session (foundation)

Files:
- `lib/auth-context.tsx` — Client auth provider and helper functions
  - getAuthHeaders(): calls `supabase.auth.getSession()` (client-side supabase SDK) and returns HeadersInit with `Authorization: Bearer ${session?.access_token}` and `Content-Type: application/json`.
  - updateUser(user: User) — local profile set.

- `app/api/*` server routes use `utils/supabase/server` `createClient()` and then `supabase.auth.getUser()` to resolve the user on the server. Example: `app/api/invoices/route.ts`, `app/api/invoices/[id]/route.ts`, etc.

Notes:
- Client-side calls use `getAuthHeaders()` to attach Authorization Bearer access token.
- Server-side handlers call `createClient()` + `supabase.auth.getUser()` which relies on cookies or the server Supabase integration to resolve the user. This is the single source of truth for auth in server routes.
- Some pages use `credentials: 'include'` instead of `getAuthHeaders()` — both are present in the codebase. For consistency, prefer `getAuthHeaders()` client-side and server `createClient()`.

---

# 2. Invoice creation (New invoice)

User action: Fill invoice form → Save (Draft) or Save and Send (Sent)

Frontend (sequence):
- `app/dashboard/invoices/new/page.tsx` → `saveInvoice(status)`
  - Calls `getAuthHeaders()` (local supabase session read) — no network round-trip typically, just reading stored session token.
  - `fetch('/api/invoices', { method: 'POST', headers, body: JSON.stringify(invoiceData) })` — 1 HTTP request to server.

Server (route):
- `app/api/invoices/route.ts` → `export async function POST(request)`
  - `createClient()` → `supabase.auth.getUser()` (server-side auth check). (1 call to Supabase Auth server or internal session parse)
  - `resolveDbUser(supabaseUser)`:
    - Tries `prisma.user.findUnique({ where: { id: supabaseUser.id } })` (DB read)
    - If no db user, fallback findUnique by email (DB read)
    - If still none, server will create a DB user record before creating invoice.
  - Compute subtotal/total locally using `data.items`.
  - `prisma.invoice.create(...)` with nested `items.create` (DB write) — returns created invoice with `items` and `payments`.
  - Convert Decimals to numbers and return JSON.

DB calls: (~2-3)
- `prisma.user.findUnique` (maybe) — user lookup
- Possibly `prisma.user.create` (if user record doesn't exist)
- `prisma.invoice.create` (1 write, plus nested items writes)

Total round trips from client: 1 request to server; server does 2–4 DB/supabase operations.

Edge cases:
- Validation of invoice fields done client-side in `validateForm()`; server trusts data shape but recomputes totals server-side.

---

# 3. Invoice listing (Dashboard list)

Frontend:
- `app/dashboard/invoices/page.tsx` → `fetchInvoices()`
  - `getAuthHeaders()` then `fetch('/api/invoices', { headers, cache: 'no-store' })` — 1 HTTP request.

Server:
- `app/api/invoices/route.ts` → `GET` handler
  - `createClient()` + `supabase.auth.getUser()` — auth (1)
  - `resolveDbUser(user)` (1 read)
  - `withRetry(() => prisma.invoice.findMany({ where: { userId: dbUser.id, deletedAt: null }, select: {...}, _count: { items: true, payments: true }, orderBy: { createdAt: 'desc' }, take, skip }))` — optimized selective projection (1 DB read)
  - Returns serialized invoices (Decimal → number conversion)

DB calls: 1 main `findMany` (with projection + counts). Possibly 1 user lookup.

Notes:
- Pagination params (limit/offset) are supported.
- The server sets Cache-Control headers for private caching.

---

# 4. Invoice detail / view

Frontend:
- `app/dashboard/invoices/[id]/page.tsx` → `fetchInvoice()`
  - `getAuthHeaders()` + `fetch(/api/invoices/${id})` (1 request)

Server:
- `app/api/invoices/[id]/route.ts` → `GET`
  - `createClient()` + `supabase.auth.getUser()` (1)
  - `prisma.invoice.findFirst({ where: { id, userId: user.id, deletedAt: null }, include: { customer, items, payments }})` (1 DB read)
  - Convert decimals and return.

DB calls: 1 invoice lookup including related tables.

---

# 5. Update invoice (PATCH)

Frontend:
- Actions: Edit invoice header, notes, payment instructions, status changes.
- `app/dashboard/invoices/[id]/page.tsx` calls `fetch('/api/invoices/${id}', { method: 'PATCH', headers, body })` — 1 request.

Server:
- `app/api/invoices/[id]/route.ts` → `PATCH`
  - `createClient()` + `supabase.auth.getUser()` (1)
  - Verify ownership via `prisma.invoice.findUnique` or `findFirst` (1)
  - `prisma.invoice.update({ where: { id }, data: { ... }, include: { customer, items, payments } })` (1 write + include fetch)
  - Return serialized updated invoice

DB calls: find + update (2 queries)

---

# 6. Delete invoice (DELETE) — safe/optimized flow

Frontend:
- `app/dashboard/invoices/page.tsx` and `app/dashboard/invoices/[id]/page.tsx` call DELETE `/api/invoices/${id}` (1 request). Both use optimistic UI removal then reconcile.

Server:
- `app/api/invoices/[id]/route.ts` → `DELETE`
  - `createClient()` + `supabase.auth.getUser()` (auth) (1)
  - `prisma.invoice.findFirst({ where: { id, userId: user.id, deletedAt: null }, select: { id, status, _count: { payments: true } }})` (1 read)
  - If invoice has payments and `confirmWithPayments` not provided, return { requiresConfirmation: true } (HTTP 400) — front-end then prompts user.
  - If confirmed, server builds `txOps` array:
    - Optionally `prisma.payment.deleteMany({ where: { invoiceId: id } })` (1)
    - Optionally `prisma.invoiceItem.deleteMany({ where: { invoiceId: id } })` (1)
    - `prisma.invoice.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.id, deleteReason, updatedAt } })` (1)
    - `prisma.invoiceAuditLog.create({ data: {...} })` (1)
  - Executes `await prisma.$transaction(txOps)` — atomic.
  - Returns success or failure.

DB calls (typical soft-delete flow):
- 1 read (findFirst)
- 2–4 writes inside transaction (depends on `removeAssociated` flag)

Client behavior:
- Optimistic UI update: removed from UI immediately, then server response either confirms or returns requiresConfirmation or error; UI restores item when needed.

Important note: Soft-delete is used (`deletedAt`), preserving data for audits. Whole-DB deletes only if `removeAssociated` explicitly passed.

---

# 7. Generate / Download PDF

There are two paths where PDFs are generated:
A) Server-side PDF endpoint (download link) — recommended for reliable downloads.
B) Client-side preview / generation (in-browser) — faster for previews but depends on client environment.

A) Server-side (reliable download):
- Frontend: `InvoicesPage.handleDownloadPDF` calls `fetch('/api/invoices/${invoiceId}/pdf', { headers })` (1 request).
- Server: `app/api/invoices/[id]/pdf/route.ts` → `GET`
  - `createClient()` + `supabase.auth.getUser()` (1)
  - `prisma.invoice.findUnique({ where: { id, userId: user.id }, include: { customer, items } })` (1 read)
  - `prisma.user.findUnique({ where: { id: user.id } })` to get user profile/branding (1 read)
  - `generateInvoicePDF(invoiceForPDF, userProfile)` from `lib/pdf-generator.ts` — this is an async function that builds a jsPDF document using `jsPDF` and `autotable` and returns a PDF instance. The function loads the logo image via an Image and canvas. (1 CPU-bound op)
  - `pdf.output('arraybuffer')` and returns a PDF response (content-type application/pdf).

B) Client-side preview/download (fast preview, used in new invoice preview and in detail page as user-initiated):
- `app/dashboard/invoices/new/page.tsx` previewPDF uses `require('@/lib/pdf-generator')` dynamically and calls `generateInvoicePDF(...)` in the browser, then opens it in a new tab via blob URL.
- Client-side uses DOM `Image` and `canvas` so it works reliably in browser but not in plain Node server without canvas support.

Notes / Caveats:
- `lib/pdf-generator.ts` uses `Image`, `canvas`, and DOM APIs in `addLogoToPDF` — while server-side route calls this function, server environment must provide a canvas/Image polyfill or jsdom + canvas package. Verify node runtime supports `document`/`Image`. If not, consider:
  - Moving server PDF generation to a headless renderer (Puppeteer) or
  - Generating PDFs client-side only or
  - Using `satori`/`resvg`/server-side canvas with node-canvas for server PDF generation.

DB/Network calls for server PDF: 2 DB reads + no additional external network except when loading remote logo images (logoUrl) which generateInvoicePDF attempts to load via browser-like Image; the server-side image load will issue network fetches.

---

# 8. Send Invoice (Email)

Frontend:
- `app/dashboard/invoices/[id]/page.tsx` → `sendInvoiceEmail()` gathers `recipientEmail`, `ccEmails`, `message` and does `fetch('/api/invoices/${invoice.id}/send', { method: 'POST', headers, body })` (1 HTTP request)

Server:
- `app/api/invoices/[id]/send/route.ts` → `POST`
  - `createClient()` + `supabase.auth.getUser()` (auth)
  - Read invoice via `prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer, items } })` (1 read)
  - Read user profile via `prisma.user.findUnique` (1 read)
  - If SMTP not configured: return error
  - Validate recipient email (use customer email fallback)
  - Duplicate prevention: if `invoice.lastEmailSentAt` is within last 5 seconds → return 429
  - Generate trackingId via `crypto.randomUUID()`
  - Update invoice immediately with queued email info:
    - `prisma.invoice.update({ where: { id }, data: { sentTo, lastEmailSentAt: new Date(), emailCount: (invoice.emailCount||0)+1, trackingId, deliveryStatus: 'queued', ...(status update if DRAFT -> SENT) } })` (1 write)
  - Return JSON success to client quickly (fast UX)

  - Background fire-and-forget (async IIFE): heavy work performed without delaying response:
    - Re-read `prisma.invoice.findUnique({ id }, include: { items, customer, payments })` and `prisma.user.findUnique({ id })` (2 DB reads)
    - Import `getTransporter` from `lib/email` to build Nodemailer transporter (no DB)
    - Build HTML body and generate invoice PDF: `generateInvoicePDF(...)` (CPU + possible image network fetches)
    - `transporter.sendMail({ attachments: [{ content: pdfBuffer }] })` (SMTP network call)
    - On success: `prisma.invoice.update({ where: { id }, data: { deliveryStatus: 'sent', emailDelivered: true } })` (1 write)
    - On failure: set deliveryStatus: 'failed' (1 write)

DB/Network calls (total):
- Synchronous (fast response): 1 auth check + 1 invoice read + 1 user read + 1 invoice update = 3 DB ops (reads & write)
- Background: 2 DB reads + 1 PDF generation + 1 SMTP network call + 1 DB update

Important details:
- Duplicate prevention (5 seconds) reduces accidental double sends
- Email HTML contains an image URL to `api/webhooks/email-tracking?trackingId=...` for open tracking
- CC handling and 'alwaysCcSelf' logic applied in background when preparing CC list

---

# 9. Record Payment / Mark as Paid

Frontend:
- `app/dashboard/invoices/[id]/page.tsx` → `recordPayment()` or `markAsPaid()`
  - Both call `POST /api/invoices/${invoice.id}/payments` with `amount`, `paymentDate`, `method` (1 HTTP request)

Server:
- `app/api/invoices/[id]/payments/route.ts` → `POST`
  - `createClient()` + `supabase.auth.getUser()` (auth)
  - `prisma.invoice.findUnique({ where: { id, userId }, include: { payments }})` (1 read)
  - `prisma.payment.create({ data: { invoiceId, amount, paymentDate, paymentMethod }})` (1 write)
  - Compute totals: `totalPaid = invoice.payments.reduce(...) + data.amount`
  - Determine new status: PAID / PARTIALLY_PAID / unchanged
  - If status changed: `prisma.invoice.update({ where: { id }, data: { status: newStatus } })` (1 write)
  - Re-fetch updated invoice `prisma.invoice.findUnique({ include: { customer, items, payments }})` (1 read)
  - If newStatus === PAID and customer has email: call `sendReceiptEmail(updatedInvoice, payment, user.id)` which:
    - creates Nodemailer transporter
    - composes receipt
    - `transporter.sendMail(...)` (SMTP network)

DB calls: ~3–4

Edge cases:
- Payment amount rounding/currency handling
- Concurrency: if two payments posted concurrently, race to mark PAID — consider transaction or optimistic checks

---

# 10. Auxiliary endpoints

- `app/api/invoices/next-number/route.ts` (GET) — findFirst last invoice ordered by number desc, compute and return next number (1 DB read).
- `app/api/invoices/update-currency/route.ts` (POST) — updateMany invoices + updateMany estimates (2 DB writes) to change currency for not-finalized docs.

---

# 11. PDF generator internals (function-level trace)

File: `lib/pdf-generator.ts`
- Exports `generateInvoicePDF(invoice, userProfile, companySettings?)` (async)
- Uses `new jsPDF()` and `autotable` to create a 4-column items table and totals section.
- addLogoToPDF(doc, logoUrl, companyName)
  - Creates `new Image()` and sets `.crossOrigin = 'anonymous'` and `img.src = logoUrl` — uses DOM Image load -> uses canvas to convert to dataURL, then `doc.addImage`.
  - Fallback: `addCompanyInitials` draws a circle and initials.
- The generator expects DOM APIs (`Image`, `document`, `canvas`) — works in browser; on server Node, this may require polyfills.
- Generate calls are awaited in server routes (e.g., `app/api/invoices/[id]/pdf/route.ts`) and used in background email send.

Important: verify server runtime supports the DOM usage or refactor for server-safe generator.

---

# 12. Exact Prisma calls per route (quick summary)
- `GET /api/invoices` → `prisma.invoice.findMany(...)` (select + _count)
- `POST /api/invoices` → `prisma.user.findUnique`, optional `prisma.user.create`, `prisma.invoice.create` (with `items.create` nested)
- `GET /api/invoices/:id` → `prisma.invoice.findUnique/ findFirst` include customer, items, payments
- `PATCH /api/invoices/:id` → verify findUnique, then `prisma.invoice.update`
- `DELETE /api/invoices/:id` → `prisma.invoice.findFirst` (select + counts), conditional `prisma.payment.deleteMany`, `prisma.invoiceItem.deleteMany`, transaction `prisma.invoice.update`, `prisma.invoiceAuditLog.create`
- `GET /api/invoices/:id/pdf` → `prisma.invoice.findUnique`, `prisma.user.findUnique`, then generatePDF
- `POST /api/invoices/:id/send` → `prisma.invoice.findUnique`, `prisma.user.findUnique`, `prisma.invoice.update` immediate; background: read invoice & user, generate PDF, send mail, update invoice
- `POST /api/invoices/:id/payments` → `prisma.invoice.findUnique`, `prisma.payment.create`, optional `prisma.invoice.update`, `prisma.invoice.findUnique` (updated)
- `GET /api/invoices/next-number` → `prisma.invoice.findFirst({ orderBy: { number: 'desc' } })`
- `POST /api/invoices/update-currency` → `prisma.invoice.updateMany`, `prisma.estimate.updateMany`

---

# 13. Per-action total network & DB calls (typical)
Below are approximate counts for a single user action (happy path):

- Create invoice (POST /api/invoices):
  - Client → Server: 1 HTTP
  - Server → Supabase Auth: 1
  - Server → DB: 1–3 (user lookup, optional user create, invoice create)
  - Total: 3–5 operations

- List invoices (GET /api/invoices):
  - Client → Server: 1
  - Server → Supabase Auth: 1
  - Server → DB: 1 (findMany)
  - Total: 3

- View invoice (GET /api/invoices/:id):
  - Client → Server: 1
  - Server → Supabase Auth: 1
  - Server → DB: 1 (findUnique with include)
  - Total: 3

- Download PDF (GET /api/invoices/:id/pdf):
  - Client → Server: 1
  - Server → Supabase Auth: 1
  - Server → DB: 2 (invoice + user)
  - Server internal: PDF generation and optional image network fetches
  - Total: 3 DB ops + CPU work

- Send email (fast path + background):
  - Client → Server: 1
  - Server → Supabase Auth: 1
  - Server → DB (sync): 2 reads + 1 write
  - Background: 2 reads + PDF generation + SMTP network call + 1 DB write
  - Total: 3–6 DB ops + SMTP network I/O

- Delete invoice (DELETE):
  - Client → Server: 1
  - Server → Supabase Auth: 1
  - Server → DB: 1 read + 1–4 writes (transaction)
  - Total: 2–6 ops

- Record payment (POST /payments):
  - Client → Server: 1
  - Server → Supabase Auth: 1
  - Server → DB: 1 read, 1 create, possibly 1 update, 1 read to return updated invoice
  - Total: ~4 DB ops

---

# 14. Imports & function-to-function map (important files)
- Frontend components/pages:
  - `app/dashboard/invoices/page.tsx` — list, send, download, delete UI logic
  - `app/dashboard/invoices/new/page.tsx` — invoice builder, previewPDF (calls `lib/pdf-generator` client-side), saveInvoice (POST /api/invoices)
  - `app/dashboard/invoices/[id]/page.tsx` — invoice detail, record payment, send email, delete, download PDF
  - `components/voice-invoice.tsx` — voice-created invoice flow (also calls `/api/invoices` endpoints)

- Server API routes:
  - `app/api/invoices/route.ts` — GET list, POST create
  - `app/api/invoices/[id]/route.ts` — GET detail, PATCH update, DELETE soft-delete
  - `app/api/invoices/[id]/pdf/route.ts` — GET PDF generation
  - `app/api/invoices/[id]/send/route.ts` — POST send email (fast response + background worker)
  - `app/api/invoices/[id]/payments/route.ts` — POST payments
  - `app/api/invoices/next-number/route.ts` — GET next invoice number
  - `app/api/invoices/update-currency/route.ts` — POST bulk currency change

- Utilities & libs:
  - `lib/pdf-generator.ts` — generateInvoicePDF, addLogoToPDF, addCompanyInitials
  - `lib/prisma.ts` — prisma client wrapper + withRetry helper
  - `lib/auth-context.tsx` — client-side getAuthHeaders, updateUser
  - `lib/database-utils.ts` — various helpers used by reporting routes
  - `lib/email.ts` — `getTransporter()` used by background send & receipts

---

# 15. Edge cases, race conditions & considerations
- Concurrency on payments: two simultaneous payments could both compute totalPaid and race to mark invoice PAID. Consider wrapping payment creation + status update in a DB transaction or using DB-level sums/locking.
- PDF generation on server uses DOM APIs: verify runtime environment supports these calls or polyfill/replace with a Node-friendly approach.
- Email background work is fire-and-forget; if the server instance is short-lived or cold-started, background work may be interrupted. For reliability, consider using a queue (e.g., BullMQ, Resque, or external worker) and store jobs & retry state.
- Delete flow: soft-delete is safe. Physical deletion of payments/items requires explicit opt-in. Ensure audit logs are always created.
- Auth consistency: codebase has some `credentials: 'include'` fetch calls and some `getAuthHeaders()` calls — choose one consistent approach to avoid issues with token expiration or server/client mismatches.

---

# 16. Next steps for in-depth optimization (what I can do next)
1. Verify server-side PDF generation: run a small script hitting `/api/invoices/:id/pdf` to confirm no `document`/`Image` errors. If failing, I can:
   - Replace with `node-canvas` compatible generator or
   - Move PDF generation to a headless Chromium renderer (Puppeteer) or
   - Offload to a background worker that runs in a browser-like environment.
2. Convert email send background work to a job queue (persist job, retry on failure, monitor), removing fire-and-forget risks.
3. Add DB transaction protection around payments to avoid race conditions.
4. Standardize auth approach: prefer `getAuthHeaders()` everywhere in client; server `createClient()` should read cookies.
5. Add tests for endpoints (happy + edge cases) to validate concurrency and error paths.

---
