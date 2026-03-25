-- AlterTable
ALTER TABLE "IceShow" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionOccurrenceId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "isMakeUp" BOOLEAN NOT NULL DEFAULT false,
    "makeUpOriginalReference" TEXT,
    "makeUpNotes" TEXT,
    CONSTRAINT "AttendanceRecord_sessionOccurrenceId_fkey" FOREIGN KEY ("sessionOccurrenceId") REFERENCES "ClassSessionOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("id", "kidId", "note", "sessionOccurrenceId", "status", "updatedAt") SELECT "id", "kidId", "note", "sessionOccurrenceId", "status", "updatedAt" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE UNIQUE INDEX "AttendanceRecord_sessionOccurrenceId_kidId_key" ON "AttendanceRecord"("sessionOccurrenceId", "kidId");
CREATE TABLE "new_IceLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rinkMapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "xPercent" REAL,
    "yPercent" REAL,
    "wPercent" REAL,
    "hPercent" REAL,
    CONSTRAINT "IceLocation_rinkMapId_fkey" FOREIGN KEY ("rinkMapId") REFERENCES "RinkMap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IceLocation" ("hPercent", "id", "name", "rinkMapId", "wPercent", "xPercent", "yPercent") SELECT "hPercent", "id", "name", "rinkMapId", "wPercent", "xPercent", "yPercent" FROM "IceLocation";
DROP TABLE "IceLocation";
ALTER TABLE "new_IceLocation" RENAME TO "IceLocation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
