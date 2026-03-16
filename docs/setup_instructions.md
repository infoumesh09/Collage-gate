# Setup Instructions

Prerequisites:
- Node.js 18+
- Python 3.10+
- Prisma with SQLite (bundled)

Backend:
- `cd server`
- Configure `.env` (`PORT=3006`)
- `npm install`
- `npm run dev`

Frontend:
- `cd client`
- `npm install`
- `npm run dev`
- Open `http://localhost:5175/`

ML:
- Place model weights under `/ml/face_model/model.pt`
- Update `run_face.py` or integrate your custom model

Notes:
- Client proxy points to `http://localhost:3006` in `client/vite.config.js`.
