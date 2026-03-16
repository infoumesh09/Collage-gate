# ML Integration

Principles:
- All ML assets live under `/ml`.
- Server interacts with ML via API endpoints only.

Face Recognition:
- Assets: `/ml/face_model/model.pt`, `run_face.py`
- Endpoint: `POST /api/gate/process-face`
- Input: `{ moodle_id, descriptor }`
- Output: `{ match, confidence, distance, threshold }`

License Plate Recognition:
- Assets: `/ml/plate_model/run_plate.py`
- Endpoint: `POST /api/gate/process-plate`
- Input: `{ moodle_id, plate, confidence? }`
- Output: `{ match, confidence, plate_registered }`

Notes:
- ML runners should remain decoupled from frontend code.
