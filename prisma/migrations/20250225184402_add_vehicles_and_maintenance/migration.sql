-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'REPAIR');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE';
