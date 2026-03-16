# Gate (Kiosk) Routes

Frontend Paths:
- `/gate/pedestrian-entry`
- `/gate/pedestrian-exit`
- `/gate/vehicle-entry`
- `/gate/vehicle-exit`

UI Behavior:
- Fullscreen kiosk (no navbar)
- Simple workflow: Scan QR → Scan Face/Plate → Show result

Backend Endpoints:
- `POST /api/gate/validate-qr`
- `POST /api/gate/process-face`
- `POST /api/gate/process-plate`
- `POST /api/gate/update-entry`
- `POST /api/gate/update-exit`

Notes:
- Pedestrian entry requires verified face match.
- Vehicle entry requires registered plate match.
