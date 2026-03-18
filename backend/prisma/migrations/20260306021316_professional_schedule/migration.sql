-- CreateTable
CREATE TABLE "ProfessionalSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfessionalSchedule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfessionalSchedule_professionalId_dayOfWeek_idx" ON "ProfessionalSchedule"("professionalId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Appointment_salonId_date_idx" ON "Appointment"("salonId", "date");

-- CreateIndex
CREATE INDEX "Appointment_professionalId_date_idx" ON "Appointment"("professionalId", "date");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "ScheduleBlock_salonId_start_idx" ON "ScheduleBlock"("salonId", "start");

-- CreateIndex
CREATE INDEX "ScheduleBlock_professionalId_start_idx" ON "ScheduleBlock"("professionalId", "start");
