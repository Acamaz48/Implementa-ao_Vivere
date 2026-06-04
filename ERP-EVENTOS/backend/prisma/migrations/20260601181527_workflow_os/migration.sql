-- AlterEnum
ALTER TYPE "ServiceOrderStatus" ADD VALUE 'RETURNED';

-- DropIndex
DROP INDEX "ServiceOrder_eventId_idx";

-- DropIndex
DROP INDEX "ServiceOrder_status_idx";

-- DropIndex
DROP INDEX "ServiceOrder_userId_idx";

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "observation" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AlterTable
ALTER TABLE "ServiceOrderItem" ADD COLUMN     "checked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unavailable" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
