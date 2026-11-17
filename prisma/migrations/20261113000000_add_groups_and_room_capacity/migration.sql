-- CreateEnum
CREATE TYPE "GroupChangeAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "capacity" INTEGER;

-- AlterTable
ALTER TABLE "ScheduleEntry" ADD COLUMN     "groupId" INTEGER;

-- CreateTable
CREATE TABLE "RoomCapacityChange" (
    "id" SERIAL NOT NULL,
    "oldCapacity" INTEGER,
    "newCapacity" INTEGER,
    "roomId" INTEGER NOT NULL,
    "changedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomCapacityChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teacherId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChange" (
    "id" SERIAL NOT NULL,
    "action" "GroupChangeAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "groupId" INTEGER NOT NULL,
    "changedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomCapacityChange_roomId_createdAt_idx" ON "RoomCapacityChange"("roomId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE INDEX "Group_teacherId_idx" ON "Group"("teacherId");

-- CreateIndex
CREATE INDEX "GroupChange_groupId_createdAt_idx" ON "GroupChange"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduleEntry_groupId_idx" ON "ScheduleEntry"("groupId");

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapacityChange" ADD CONSTRAINT "RoomCapacityChange_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapacityChange" ADD CONSTRAINT "RoomCapacityChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChange" ADD CONSTRAINT "GroupChange_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChange" ADD CONSTRAINT "GroupChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
