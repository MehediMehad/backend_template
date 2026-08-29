-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'ABORTED');

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "uploadId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "totalParts" INTEGER NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_uploads_uploadId_key" ON "file_uploads"("uploadId");

-- CreateIndex
CREATE UNIQUE INDEX "file_uploads_fileKey_key" ON "file_uploads"("fileKey");

-- CreateIndex
CREATE INDEX "file_uploads_uploadId_idx" ON "file_uploads"("uploadId");

-- CreateIndex
CREATE INDEX "file_uploads_status_idx" ON "file_uploads"("status");

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
