# System Architecture

Layers:
- Web UI: role-based portals (Admin, Student, Gate)
- Backend API: Express routes + controllers + services
- Database: Prisma (SQLite dev)
- ML: Externalized runners for face and plate

Data Flow (Gate Pedestrian Entry):
- `/gate/pedestrian-entry` → scan QR → fetch user → scan face → `POST /api/gate/process-face` → if match → `POST /api/gate/update-entry` → presence + log updated

Data Flow (Vehicle Entry):
- `/gate/vehicle-entry` → scan QR → detect plate → `POST /api/gate/process-plate` → if match → `POST /api/gate/update-entry`

Daily Stats:
- Scheduler archives previous day into `DailyStat` at midnight
- `GET /api/stats/daily` serves historical aggregates

Access Control:
- Route guards enforce admin vs student separation on frontend
- Presence service validates entry/exit rules on backend
