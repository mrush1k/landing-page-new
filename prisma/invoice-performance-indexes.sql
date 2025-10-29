-- Performance optimization for invoice queries
-- Add compound indexes for fast invoice list loading

-- Index for invoice list queries (userId + deletedAt + createdAt for sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_user_deleted_created" 
ON "Invoice" ("userId", "deletedAt", "createdAt" DESC);

-- Index for invoice status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_user_status" 
ON "Invoice" ("userId", "status") 
WHERE "deletedAt" IS NULL;

-- Index for invoice number searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_user_number" 
ON "Invoice" ("userId", "number") 
WHERE "deletedAt" IS NULL;

-- Index for due date queries (overdue invoices)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_user_duedate" 
ON "Invoice" ("userId", "dueDate") 
WHERE "deletedAt" IS NULL AND "status" != 'paid';

-- Index for customer invoice relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_customer_user" 
ON "Invoice" ("customerId", "userId") 
WHERE "deletedAt" IS NULL;

-- Partial index for active invoices only (most common queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_active_user_created" 
ON "Invoice" ("userId", "createdAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Index for invoice totals (reporting queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoice_user_total_created" 
ON "Invoice" ("userId", "createdAt" DESC, "total") 
WHERE "deletedAt" IS NULL AND "status" = 'paid';

-- Analyze tables after index creation
ANALYZE "Invoice";
ANALYZE "Customer";