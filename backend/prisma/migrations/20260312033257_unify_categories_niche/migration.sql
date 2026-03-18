/*
  Warnings:

  - You are about to drop the `ProfessionalCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `categoryId` on the `Professional` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProfessionalCategory_salonId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProfessionalCategory";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_ProfessionalToServiceCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfessionalToServiceCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProfessionalToServiceCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "commission" REAL NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'COMMISSION',
    "salonId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Professional_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Professional" ("commission", "contractType", "createdAt", "id", "isActive", "name", "salonId", "updatedAt") SELECT "commission", "contractType", "createdAt", "id", "isActive", "name", "salonId", "updatedAt" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE INDEX "Professional_salonId_idx" ON "Professional"("salonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ProfessionalToServiceCategory_AB_unique" ON "_ProfessionalToServiceCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfessionalToServiceCategory_B_index" ON "_ProfessionalToServiceCategory"("B");
