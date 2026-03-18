/*
  Warnings:

  - You are about to drop the `ServiceSubcategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `subcategoryId` on the `Service` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ServiceSubcategory_categoryId_idx";

-- DropIndex
DROP INDEX "ServiceSubcategory_salonId_idx";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "duration" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "endDate" DATETIME;

-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN "method" TEXT;
ALTER TABLE "FinancialTransaction" ADD COLUMN "referenceId" TEXT;
ALTER TABLE "FinancialTransaction" ADD COLUMN "referenceType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "permissions" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ServiceSubcategory";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "totalPaid" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("clientId", "createdAt", "discount", "id", "salonId", "status", "totalAmount", "updatedAt") SELECT "clientId", "createdAt", "discount", "id", "salonId", "status", "totalAmount", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_salonId_idx" ON "Order"("salonId");
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "bufferTime" INTEGER NOT NULL DEFAULT 0,
    "salonId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Service_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("bufferTime", "createdAt", "duration", "id", "name", "price", "salonId", "updatedAt") SELECT "bufferTime", "createdAt", "duration", "id", "name", "price", "salonId", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE INDEX "Service_salonId_idx" ON "Service"("salonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Expense_salonId_idx" ON "Expense"("salonId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "FinancialTransaction_referenceId_idx" ON "FinancialTransaction"("referenceId");
