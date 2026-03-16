-- AlterTable
ALTER TABLE "users" ADD COLUMN "department" TEXT;
ALTER TABLE "users" ADD COLUMN "division" TEXT;
ALTER TABLE "users" ADD COLUMN "profile_photo" TEXT;
ALTER TABLE "users" ADD COLUMN "roll_number" TEXT;
ALTER TABLE "users" ADD COLUMN "year" TEXT;

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moodle_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "year" TEXT,
    "division" TEXT,
    "entry_time" DATETIME,
    "exit_time" DATETIME,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "attendance_logs_moodle_id_fkey" FOREIGN KEY ("moodle_id") REFERENCES "users" ("moodle_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_moodle_id_date_key" ON "attendance_logs"("moodle_id", "date");
