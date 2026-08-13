-- AlterTable
ALTER TABLE "ScheduleEntry" ADD COLUMN     "isOvertime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "honorariumRate" DECIMAL(10,2);
