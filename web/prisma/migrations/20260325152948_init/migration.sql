-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstructorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstructorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KidProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "currentLevelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KidProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KidProfile_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "Level" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentKid" (
    "parentId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,

    PRIMARY KEY ("parentId", "kidId"),
    CONSTRAINT "ParentKid_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParentKid_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RinkMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '/rink.png',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IceLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rinkMapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "xPercent" REAL NOT NULL,
    "yPercent" REAL NOT NULL,
    "wPercent" REAL NOT NULL,
    "hPercent" REAL NOT NULL,
    CONSTRAINT "IceLocation_rinkMapId_fkey" FOREIGN KEY ("rinkMapId") REFERENCES "RinkMap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "nextLevelId" TEXT,
    CONSTRAINT "Level_nextLevelId_fkey" FOREIGN KEY ("nextLevelId") REFERENCES "Level" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LevelSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "levelId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCritical" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LevelSkill_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classTemplateId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "iceLocationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassSession_classTemplateId_fkey" FOREIGN KEY ("classTemplateId") REFERENCES "ClassTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_iceLocationId_fkey" FOREIGN KEY ("iceLocationId") REFERENCES "IceLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSessionInstructor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classSessionId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "ClassSessionInstructor_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSessionInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classTemplateId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassOccurrence_classTemplateId_fkey" FOREIGN KEY ("classTemplateId") REFERENCES "ClassTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSessionOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classOccurrenceId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'NORMAL',
    "sourceSessionOccurrenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassSessionOccurrence_classOccurrenceId_fkey" FOREIGN KEY ("classOccurrenceId") REFERENCES "ClassOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSessionOccurrence_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KidSessionEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kidId" TEXT NOT NULL,
    "sessionOccurrenceId" TEXT NOT NULL,
    "enrolledByAdminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KidSessionEnrollment_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KidSessionEnrollment_sessionOccurrenceId_fkey" FOREIGN KEY ("sessionOccurrenceId") REFERENCES "ClassSessionOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionOccurrenceId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_sessionOccurrenceId_fkey" FOREIGN KEY ("sessionOccurrenceId") REFERENCES "ClassSessionOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionEndCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionOccurrenceId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "instructorNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SessionEndCard_sessionOccurrenceId_fkey" FOREIGN KEY ("sessionOccurrenceId") REFERENCES "ClassSessionOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionEndCard_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionEndCard_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EndCardSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endCardId" TEXT NOT NULL,
    "levelSkillId" TEXT NOT NULL,
    "acquired" BOOLEAN NOT NULL,
    "note" TEXT,
    CONSTRAINT "EndCardSkill_endCardId_fkey" FOREIGN KEY ("endCardId") REFERENCES "SessionEndCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EndCardSkill_levelSkillId_fkey" FOREIGN KEY ("levelSkillId") REFERENCES "LevelSkill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstructorFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromParentId" TEXT NOT NULL,
    "toInstructorId" TEXT NOT NULL,
    "sessionOccurrenceId" TEXT,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedByAdminId" TEXT,
    CONSTRAINT "InstructorFeedback_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "AdminProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstructorFeedback_fromParentId_fkey" FOREIGN KEY ("fromParentId") REFERENCES "ParentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstructorFeedback_toInstructorId_fkey" FOREIGN KEY ("toInstructorId") REFERENCES "InstructorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IceShow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IceShow_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IceShowPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iceShowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iceLocationId" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IceShowPart_iceShowId_fkey" FOREIGN KEY ("iceShowId") REFERENCES "IceShow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IceShowPart_iceLocationId_fkey" FOREIGN KEY ("iceLocationId") REFERENCES "IceLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IceShowPartInstructor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iceShowPartId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "IceShowPartInstructor_iceShowPartId_fkey" FOREIGN KEY ("iceShowPartId") REFERENCES "IceShowPart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IceShowPartInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IceShowEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "iceShowPartId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    CONSTRAINT "IceShowEnrollment_iceShowPartId_fkey" FOREIGN KEY ("iceShowPartId") REFERENCES "IceShowPart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IceShowEnrollment_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorProfile_userId_key" ON "InstructorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KidProfile_userId_key" ON "KidProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelSkill_levelId_sortOrder_key" ON "LevelSkill"("levelId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_classTemplateId_levelId_key" ON "ClassSession"("classTemplateId", "levelId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSessionInstructor_classSessionId_instructorId_key" ON "ClassSessionInstructor"("classSessionId", "instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassOccurrence_classTemplateId_date_key" ON "ClassOccurrence"("classTemplateId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSessionOccurrence_classOccurrenceId_classSessionId_key" ON "ClassSessionOccurrence"("classOccurrenceId", "classSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "KidSessionEnrollment_kidId_sessionOccurrenceId_key" ON "KidSessionEnrollment"("kidId", "sessionOccurrenceId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionOccurrenceId_kidId_key" ON "AttendanceRecord"("sessionOccurrenceId", "kidId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionEndCard_sessionOccurrenceId_kidId_key" ON "SessionEndCard"("sessionOccurrenceId", "kidId");

-- CreateIndex
CREATE UNIQUE INDEX "EndCardSkill_endCardId_levelSkillId_key" ON "EndCardSkill"("endCardId", "levelSkillId");

-- CreateIndex
CREATE INDEX "InstructorFeedback_toInstructorId_status_idx" ON "InstructorFeedback"("toInstructorId", "status");

-- CreateIndex
CREATE INDEX "IceShow_date_idx" ON "IceShow"("date");

-- CreateIndex
CREATE UNIQUE INDEX "IceShowPart_iceShowId_name_key" ON "IceShowPart"("iceShowId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "IceShowPartInstructor_iceShowPartId_instructorId_key" ON "IceShowPartInstructor"("iceShowPartId", "instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "IceShowEnrollment_iceShowPartId_kidId_key" ON "IceShowEnrollment"("iceShowPartId", "kidId");
