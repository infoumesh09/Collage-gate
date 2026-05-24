# UNIGATE - Smart Campus Access Control System

UNIGATE is an advanced, AI-powered campus access management system designed to streamline entry and exit for students, staff, and vehicles. By integrating multiple verification methods, it ensures high security and efficiency for modern educational institutions.

## 🚀 Key Features

- **Multi-Modal Authentication**:
  - **QR/Barcode Scanning**: Rapid ID card verification.
  - **Face Recognition**: Secure, touchless entry using AI-driven face matching.
  - **License Plate Detection**: Automated vehicle entry using OCR (Optical Character Recognition).
- **Admin Dashboard**:
  - Real-time statistics (Entries, Exits, Denials).
  - **Currently Inside**: Track everyone on campus in real-time.
  - User Management: Approve/Reject registrations and manage user roles.
  - Detailed Access Logs: Historical data for security audits.
- **Student Portal**:
  - Personal QR code for entry.
  - Face enrollment and vehicle registration requests.
  - Personal attendance and access history.
- **Fuzzy Matching**: Intelligent OCR correction to handle minor plate detection inaccuracies.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS, Material UI (MUI)
- **Animations**: Framer Motion
- **State Management**: Zustand

### Backend
- **Server**: Node.js, Express
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens)

### AI & ML
- **Face Recognition**: `face-api.js` (TensorFlow.js based)
- **Plate Detection**: Python-based YOLOv8 / OCR models

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/infoumesh09/Collage-gate.git
cd Collage-gate
```

### 2. Backend Setup
```bash
cd server
npm install
# Setup environment variables in .env
# Run migrations
npx prisma migrate dev
# Seed initial data (optional)
node seed.js
# Start server
node index.js
```

### 3. Frontend Setup
```bash
# From root directory
npm install
npm run dev
```

### 4. ML Service Setup (Optional)
```bash
cd ml
pip install -r requirements.txt
python main.py
```

## 🔐 Admin Credentials (Default)
- **Username**: `admin`
- **Password**: `admin123`

## 📝 License
Distributed under the MIT License.

---
Built with ❤️ for a smarter and safer campus.
