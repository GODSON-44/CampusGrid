/*
  Warnings:

  - You are about to drop the column `totalAmount` on the `PendingOrder` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `staffName` on the `Purchase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PendingOrder" DROP COLUMN "totalAmount";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "staffId",
DROP COLUMN "staffName";
