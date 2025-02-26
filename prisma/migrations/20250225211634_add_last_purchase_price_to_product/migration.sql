/*
  Warnings:

  - The values [UNPAID] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [AVAILABLE,REPAIR] on the enum `VehicleStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deliveryStatus` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Purchase` table. All the data in the column will be lost.
  - The `status` column on the `Purchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PurchaseItem` table. All the data in the column will be lost.
  - The `status` column on the `Sale` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SaleItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Made the column `invoiceNumber` on table `Purchase` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `Purchase` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax` on table `Purchase` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discount` on table `Purchase` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `date` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT', 'PACKAGING', 'BOTTLE', 'CARTON');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('FUEL', 'MAINTENANCE', 'OIL_CHANGE', 'TIRES', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'TRANSFER');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE', 'CANCELLED', 'COMPLETED');
ALTER TABLE "Purchase" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TABLE "Purchase" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VehicleStatus_new" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
ALTER TABLE "Vehicle" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "status" TYPE "VehicleStatus_new" USING ("status"::text::"VehicleStatus_new");
ALTER TYPE "VehicleStatus" RENAME TO "VehicleStatus_old";
ALTER TYPE "VehicleStatus_new" RENAME TO "VehicleStatus";
DROP TYPE "VehicleStatus_old";
ALTER TABLE "Vehicle" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "location" TEXT,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'IN_STOCK',
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'FINISHED_PRODUCT';

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "deliveryStatus",
DROP COLUMN "paymentStatus",
ALTER COLUMN "invoiceNumber" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "tax" SET NOT NULL,
ALTER COLUMN "tax" SET DEFAULT 0,
ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "discount" SET DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PurchaseItem" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "DeliveryStatus";

-- CreateTable
CREATE TABLE "VehicleExpense" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "odometer" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VehicleExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
