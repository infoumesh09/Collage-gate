# Student Routes

Frontend Paths:
- `/student/login`
- `/student/dashboard`
- `/student/profile`
- `/student/qr`
- `/student/register-face`
- `/student/register-vehicle`
- `/student/history`

Access Control:
- Only `student` role can access these; unauthenticated users are redirected to `/student/login`.

Related API Endpoints:
- `GET /api/users/:moodle_id` (existing)
- `POST /api/face/:moodle_id` (existing)
- `GET /api/logs/my` (existing)
- `POST /api/vehicles/register` (to implement)
