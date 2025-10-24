-- Performance Optimization Database Migration
-- Add indexes to frequently queried fields for better query performance
-- This migration is safe and non-destructive (adds indexes only)

-- User table indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

-- Customer table indexes
CREATE INDEX IF NOT EXISTS "customers_userId_idx" ON "customers"("userId");
CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers"("email");
CREATE INDEX IF NOT EXISTS "customers_createdAt_idx" ON "customers"("createdAt");

-- Invoice table indexes
CREATE INDEX IF NOT EXISTS "invoices_userId_idx" ON "invoices"("userId");
CREATE INDEX IF NOT EXISTS "invoices_customerId_idx" ON "invoices"("customerId");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_issueDate_idx" ON "invoices"("issueDate");
CREATE INDEX IF NOT EXISTS "invoices_dueDate_idx" ON "invoices"("dueDate");
CREATE INDEX IF NOT EXISTS "invoices_createdAt_idx" ON "invoices"("createdAt");
CREATE INDEX IF NOT EXISTS "invoices_number_idx" ON "invoices"("number");

-- InvoiceItem table indexes
CREATE INDEX IF NOT EXISTS "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- Estimate table indexes
CREATE INDEX IF NOT EXISTS "estimates_userId_idx" ON "estimates"("userId");
CREATE INDEX IF NOT EXISTS "estimates_customerId_idx" ON "estimates"("customerId");
CREATE INDEX IF NOT EXISTS "estimates_status_idx" ON "estimates"("status");
CREATE INDEX IF NOT EXISTS "estimates_createdAt_idx" ON "estimates"("createdAt");

-- EstimateItem table indexes
CREATE INDEX IF NOT EXISTS "estimate_items_estimateId_idx" ON "estimate_items"("estimateId");

-- Payment table indexes
CREATE INDEX IF NOT EXISTS "payments_invoiceId_idx" ON "payments"("invoiceId");
CREATE INDEX IF NOT EXISTS "payments_paymentDate_idx" ON "payments"("paymentDate");

-- ChatbotInteraction table indexes
CREATE INDEX IF NOT EXISTS "chatbot_interactions_userId_idx" ON "chatbot_interactions"("userId");
CREATE INDEX IF NOT EXISTS "chatbot_interactions_timestamp_idx" ON "chatbot_interactions"("timestamp");

-- Display success message
SELECT 'Performance indexes created successfully!' as message;
