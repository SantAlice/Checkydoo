-- CreateTable
CREATE TABLE "schedule_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_snapshots_user_id_key" ON "schedule_snapshots"("user_id");

-- AddForeignKey
ALTER TABLE "schedule_snapshots" ADD CONSTRAINT "schedule_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
