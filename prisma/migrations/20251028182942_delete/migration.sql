/*
  Warnings:

  - The values [VOIDED] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `voidReason` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `voidedAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `voidedBy` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'SENT', 'READ', 'APPROVED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED');
ALTER TABLE "invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "voidReason",
DROP COLUMN "voidedAt",
DROP COLUMN "voidedBy";

-- CreateIndex
CREATE INDEX "chatbot_interactions_userId_idx" ON "chatbot_interactions"("userId");

-- CreateIndex
CREATE INDEX "chatbot_interactions_timestamp_idx" ON "chatbot_interactions"("timestamp");

-- CreateIndex
CREATE INDEX "customers_userId_idx" ON "customers"("userId");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_createdAt_idx" ON "customers"("createdAt");

-- CreateIndex
CREATE INDEX "customer_activity_idx" ON "customers"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "estimate_items_estimateId_idx" ON "estimate_items"("estimateId");

-- CreateIndex
CREATE INDEX "estimates_userId_idx" ON "estimates"("userId");

-- CreateIndex
CREATE INDEX "estimates_customerId_idx" ON "estimates"("customerId");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "estimates_createdAt_idx" ON "estimates"("createdAt");

-- CreateIndex
CREATE INDEX "estimate_stats_idx" ON "estimates"("userId", "status", "total");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_issueDate_idx" ON "invoices"("issueDate");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_number_idx" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_deletedAt_idx" ON "invoices"("deletedAt");

-- CreateIndex
CREATE INDEX "invoices_userId_status_idx" ON "invoices"("userId", "status");

-- CreateIndex
CREATE INDEX "invoices_userId_deletedAt_idx" ON "invoices"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "invoices_customerId_status_idx" ON "invoices"("customerId", "status");

-- CreateIndex
CREATE INDEX "invoices_userId_status_updatedAt_idx" ON "invoices"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "invoices_userId_deletedAt_status_dueDate_idx" ON "invoices"("userId", "deletedAt", "status", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_updatedAt_status_idx" ON "invoices"("updatedAt", "status");

-- CreateIndex
CREATE INDEX "dashboard_recent_idx" ON "invoices"("userId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "dashboard_stats_idx" ON "invoices"("userId", "deletedAt", "status", "total");

-- CreateIndex
CREATE INDEX "dashboard_activity_idx" ON "invoices"("userId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
