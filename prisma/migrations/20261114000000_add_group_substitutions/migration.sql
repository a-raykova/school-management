-- AlterTable
ALTER TABLE "ScheduleEntry" ADD COLUMN     "endDate" DATE;

-- CreateTable
CREATE TABLE "GroupSubstitution" (
    "id" SERIAL NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "note" TEXT,
    "groupId" INTEGER NOT NULL,
    "substituteId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupSubstitution_groupId_startDate_idx" ON "GroupSubstitution"("groupId", "startDate");

-- CreateIndex
CREATE INDEX "GroupSubstitution_substituteId_idx" ON "GroupSubstitution"("substituteId");

-- AddForeignKey
ALTER TABLE "GroupSubstitution" ADD CONSTRAINT "GroupSubstitution_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubstitution" ADD CONSTRAINT "GroupSubstitution_substituteId_fkey" FOREIGN KEY ("substituteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubstitution" ADD CONSTRAINT "GroupSubstitution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
