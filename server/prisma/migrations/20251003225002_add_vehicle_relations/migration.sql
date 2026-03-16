-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vehicle_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moodle_id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicle_registrations_moodle_id_fkey" FOREIGN KEY ("moodle_id") REFERENCES "users" ("moodle_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_vehicle_registrations" ("created_at", "id", "moodle_id", "note", "plate", "status", "updated_at") SELECT "created_at", "id", "moodle_id", "note", "plate", "status", "updated_at" FROM "vehicle_registrations";
DROP TABLE "vehicle_registrations";
ALTER TABLE "new_vehicle_registrations" RENAME TO "vehicle_registrations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
