# Admin Routes

Frontend Paths:
- `/admin/login`
- `/admin/dashboard`
- `/admin/pending-users`
- `/admin/pending-vehicles`
- `/admin/approved-users`
- `/admin/approved-vehicles`
- `/admin/logs/pedestrian`
- `/admin/logs/vehicle`
- `/admin/settings`

Access Control:
- Only `admin` role can access these routes; others are redirected to `/` or `/admin/login`.

Related API Endpoints:
- `GET /api/admin/pending-users` (to implement)
- `POST /api/admin/approve-user` (to implement)
- `GET /api/logs` (existing)
- `GET /api/settings` (existing)
