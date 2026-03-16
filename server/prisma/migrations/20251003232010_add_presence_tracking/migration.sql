-- CreateTable
CREATE TABLE "presence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moodle_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plate" TEXT,
    "last_direction" TEXT NOT NULL,
    "entered_at" DATETIME NOT NULL,
    "exited_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'inside',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "presence_moodle_id_fkey" FOREIGN KEY ("moodle_id") REFERENCES "users" ("moodle_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
