# API Endpoints Overview

Auth:
- `POST /api/auth/login`

Admin:
- `GET /api/users` (existing)
- `GET /api/logs` (existing)
- `GET /api/settings` (existing)
- `GET /api/stats/today` (existing)
- `GET /api/stats/daily` (added)
- `POST /api/stats/archive` (added)
- `GET /api/admin/pending-users` (to implement)
- `POST /api/admin/approve-user` (to implement)

Student:
- `GET /api/users/:moodle_id` (existing)
- `POST /api/face/:moodle_id` (existing)
- `GET /api/logs/my` (existing)
- `POST /api/vehicles/register` (to implement)

Gate:
- `POST /api/gate/validate-qr` (added)
- `POST /api/gate/process-face` (added)
- `POST /api/gate/process-plate` (added)
- `POST /api/gate/update-entry` (added)
- `POST /api/gate/update-exit` (added)
