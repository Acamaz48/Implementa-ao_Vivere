-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "checked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unavailable" BOOLEAN NOT NULL DEFAULT false;
