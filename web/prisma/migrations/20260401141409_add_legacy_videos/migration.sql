-- CreateTable
CREATE TABLE "LegacyVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegacyVideo_userId_idx" ON "LegacyVideo"("userId");

-- AddForeignKey
ALTER TABLE "LegacyVideo" ADD CONSTRAINT "LegacyVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
