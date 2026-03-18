-- CreateTable
CREATE TABLE "ServiceNicho" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "salonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceNicho_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProfessionalToServiceNicho" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfessionalToServiceNicho_A_fkey" FOREIGN KEY ("A") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProfessionalToServiceNicho_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceNicho" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "salonId" TEXT NOT NULL,
    "nicheId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceCategory_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceCategory_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "ServiceNicho" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceCategory" ("createdAt", "id", "name", "order", "salonId", "updatedAt") SELECT "createdAt", "id", "name", "order", "salonId", "updatedAt" FROM "ServiceCategory";
DROP TABLE "ServiceCategory";
ALTER TABLE "new_ServiceCategory" RENAME TO "ServiceCategory";
CREATE INDEX "ServiceCategory_salonId_idx" ON "ServiceCategory"("salonId");
CREATE INDEX "ServiceCategory_nicheId_idx" ON "ServiceCategory"("nicheId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ServiceNicho_salonId_idx" ON "ServiceNicho"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProfessionalToServiceNicho_AB_unique" ON "_ProfessionalToServiceNicho"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfessionalToServiceNicho_B_index" ON "_ProfessionalToServiceNicho"("B");
