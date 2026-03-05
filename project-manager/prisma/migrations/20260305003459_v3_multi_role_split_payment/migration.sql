/*
  Warnings:

  - You are about to drop the column `projectRole` on the `ProjectMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "custodyAmount" REAL;
ALTER TABLE "Invoice" ADD COLUMN "pocketAmount" REAL;
ALTER TABLE "Invoice" ADD COLUMN "rejectedBy" TEXT;

-- CreateTable
CREATE TABLE "CustodyReturn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "custodyId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "returnedBy" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustodyReturn_custodyId_fkey" FOREIGN KEY ("custodyId") REFERENCES "EmployeeCustody" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL,
    "targetId" TEXT,
    "note" TEXT,
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "FinanceRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinanceRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmployeeCustody" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "memberId" TEXT,
    "amount" REAL NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeCustody_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmployeeCustody_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmployeeCustody_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ProjectMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeCustody" ("amount", "confirmedAt", "createdAt", "employeeId", "id", "isConfirmed", "memberId", "method", "note", "projectId", "updatedAt") SELECT "amount", "confirmedAt", "createdAt", "employeeId", "id", "isConfirmed", "memberId", "method", "note", "projectId", "updatedAt" FROM "EmployeeCustody";
DROP TABLE "EmployeeCustody";
ALTER TABLE "new_EmployeeCustody" RENAME TO "EmployeeCustody";
CREATE TABLE "new_ProjectMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "projectRoles" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "custodyBalance" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectMember" ("custodyBalance", "id", "projectId", "role", "userId") SELECT "custodyBalance", "id", "projectId", "role", "userId" FROM "ProjectMember";
DROP TABLE "ProjectMember";
ALTER TABLE "new_ProjectMember" RENAME TO "ProjectMember";
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,
    "creatorId" TEXT NOT NULL,
    "purchasedBy" TEXT,
    "invoiceId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    CONSTRAINT "Purchase_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("amount", "createdAt", "creatorId", "date", "deletedAt", "description", "id", "isDeleted", "orderNumber", "projectId", "status", "updatedAt") SELECT "amount", "createdAt", "creatorId", "date", "deletedAt", "description", "id", "isDeleted", "orderNumber", "projectId", "status", "updatedAt" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_orderNumber_key" ON "Purchase"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
