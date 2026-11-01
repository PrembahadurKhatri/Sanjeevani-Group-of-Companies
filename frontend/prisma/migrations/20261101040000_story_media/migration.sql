-- CreateTable
CREATE TABLE "StoryMedia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "newsArticleId" UUID,
    "eventId" UUID,
    "noticeId" UUID,
    "mediaId" UUID,
    "videoUrl" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryMedia_newsArticleId_sortOrder_idx" ON "StoryMedia"("newsArticleId", "sortOrder");

-- CreateIndex
CREATE INDEX "StoryMedia_eventId_sortOrder_idx" ON "StoryMedia"("eventId", "sortOrder");

-- CreateIndex
CREATE INDEX "StoryMedia_noticeId_sortOrder_idx" ON "StoryMedia"("noticeId", "sortOrder");

-- AddForeignKey
ALTER TABLE "StoryMedia" ADD CONSTRAINT "StoryMedia_newsArticleId_fkey" FOREIGN KEY ("newsArticleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMedia" ADD CONSTRAINT "StoryMedia_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMedia" ADD CONSTRAINT "StoryMedia_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMedia" ADD CONSTRAINT "StoryMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

