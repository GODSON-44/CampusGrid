-- CreateTable
CREATE TABLE "GatePass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "roll" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "parentsPh" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "reason" TEXT,
    "outTime" TIMESTAMP(3) NOT NULL,
    "inTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingOrder" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingItem" (
    "id" SERIAL NOT NULL,
    "pendingOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "PendingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingOrder_rollNumber_key" ON "PendingOrder"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PendingOrder_token_key" ON "PendingOrder"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PendingItem_pendingOrderId_productId_key" ON "PendingItem"("pendingOrderId", "productId");

-- AddForeignKey
ALTER TABLE "PendingItem" ADD CONSTRAINT "PendingItem_pendingOrderId_fkey" FOREIGN KEY ("pendingOrderId") REFERENCES "PendingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingItem" ADD CONSTRAINT "PendingItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
