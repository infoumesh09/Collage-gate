import sqlite3

conn = sqlite3.connect("faces.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    name TEXT,
    div TEXT,
    image_path TEXT,
    embedding BLOB
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE,
    vehicle_type TEXT,
    owner_name TEXT,
    image_path TEXT
)
""")

conn.commit()
