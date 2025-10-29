# Copilot Instructions - Invoice Easy

## Architecture Overview
This is a full-stack Next.js 14 (App Router) invoice management SaaS with TypeScript, Prisma (PostgreSQL), Supabase (auth), and shadcn/ui. Built for performance with multi-level caching, optimized bundle splitting, and instant PDF generation.

## Key Performance Patterns

### Multi-Level Caching System
- **API Layer**: Use `lib/api-cache.ts` with `createFastResponse()` for ETag-based HTTP caching
- **User Data**: Use `lib/fast-user-cache.ts` with `resolveDbUserFast()` to avoid repeated DB lookups
- **Client Components**: Lazy load heavy components with `React.lazy()` (see `app/dashboard/layout.tsx`)

### Database Access Patterns
- Always use `lib/prisma.ts` with `withRetry()` wrapper for connection stability
- Use `resolveDbUserFast(supabaseUser)` instead of direct Prisma queries for user lookups
- Follow the compound indexes in schema: `@@index([userId, deletedAt, createdAt])` for fast filtering
- Convert Prisma Decimals with `Number(value)` before JSON serialization

### Authentication Flow
- Server routes: Use `createClient()` from `@/utils/supabase/server` for auth validation
- Client components: Access auth via `useAuth()` context from `lib/auth-context.tsx`
- Protected pages: Wrap with `<ProtectedRoute>` component, never implement auth guards manually
- API auth pattern: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()`

## UI Component Conventions

### shadcn/ui Usage
- All UI primitives live in `components/ui/` (button, card, dialog, etc.)
- Import pattern: `import { Button } from '@/components/ui/button'`
- Never create custom buttons/forms - extend shadcn components
- Use `useToast()` hook for all notifications

### Form Handling
- Use React Hook Form with Zod validation (see existing invoice forms)
- Client-side validation before API calls
- Always handle loading states with `useState` + disabled buttons
- Pattern: `const [isSaving, setIsSaving] = useState(false)`

### Data Fetching
- Use `fetch()` with `getAuthHeaders()` for authenticated API calls
- Always set `Content-Type: application/json` headers
- Handle errors with toast notifications, not throw/catch

## API Route Patterns

### Standard Structure
```typescript
export async function GET/POST(request: NextRequest) {
  // 1. Auth validation
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // 2. Fast user lookup (not direct Prisma)
  const dbUser = await resolveDbUserFast(user)
  
  // 3. Business logic with retry wrapper
  const result = await withRetry(() => prisma.model.findMany(...))
  
  // 4. Return cached response
  return createFastResponse(result, { maxAge: 180 })
}
```

### Error Handling
- Log errors with context: `console.error('Operation failed:', { userId, error })`
- Return structured errors: `NextResponse.json({ error: 'Message' }, { status: 400 })`
- Never expose internal error details to client

## File Organization Rules

### Import Aliases
- `@/components/*` - React components
- `@/lib/*` - Utilities, clients, business logic  
- `@/hooks/*` - React hooks
- `@/utils/*` - Pure utility functions
- `@/types/*` - TypeScript definitions

### Component Structure
- Server Components: Default for performance, no `"use client"`
- Client Components: Only when needed for interactivity, start with `"use client"`
- Lazy loading: Use for heavy/optional components (chatbot, charts, modals)

## Development Workflow

### Essential Commands
- `npm run dev` - Development server with hot reload
- `npx prisma db push` - Apply schema changes (development)
- `npx prisma studio` - Database GUI browser
- `npm run db:seed` - Reset database with sample data

### Environment Setup
- Copy `.env.example` to `.env` and configure
- Check `/env-check` page to validate environment variables
- Supabase auth requires both URL and anon key configured

### Performance Debugging
- Use browser Network tab to check cache headers (304 responses are good)
- Monitor `X-Query-Time` headers on API responses
- Check console for cache hit/miss logs from `fast-user-cache`

## Integration Points

### PDF Generation
- Auto-initializes on server startup (`lib/pdf-auto-init.ts`)
- Use `lib/pdf-generator-fast.ts` for optimized generation
- Handles browser pool management automatically

### Real-time Features
- WebSocket diagnostics via `lib/websocket-client.ts`
- Performance monitoring with `lib/performance-monitor.ts`
- Use sparingly - prefer optimistic updates + cache invalidation

## Common Pitfalls to Avoid
- Don't use direct Prisma user queries - always use `resolveDbUserFast()`
- Don't create custom auth logic - use existing `useAuth()` context
- Don't skip loading states - users expect feedback
- Don't hardcode currencies/countries - use `lib/country-utils.ts`
- Don't forget Decimal conversion when serializing Prisma responses

## Documentation policy (important)

To avoid clutter and inconsistent placement of documentation, follow these rules strictly:

- Do NOT create or add Markdown (*.md) files at the repository root unless a human explicitly requests it.
- If you are instructed to generate documentation, reports, or any `.md` file, always place those files inside the `./docs` directory.
- Automated tasks, scripts, or agents must never write new `.md` files to the project root. If a task would create a doc, route it to `./docs` instead.
- Keep the repository root free of ad-hoc documentation. Root-level md files are only allowed when a human maintainer intentionally commits them (the one exception is `README.md`, which should remain in the root).

These rules help keep the repository organized and make automatic tooling predictable.