# =====================================================
# DB.PY
# SQLite Database Setup, Tables, CRUD Operations & Settings
# =====================================================

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def get_db_connection():
    """Establishes connection to local SQLite database file with 20s lock timeout."""
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables and seeds initial student data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Students Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT,
            course TEXT,
            year TEXT,
            cgpa REAL,
            credits INTEGER,
            attendance INTEGER,
            lms_score INTEGER,
            risk INTEGER,
            father TEXT,
            mother TEXT,
            mother_tongue TEXT,
            place TEXT,
            region TEXT,
            country TEXT
        )
    """)

    # 2. Interventions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interventions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            date TEXT,
            action TEXT,
            status TEXT,
            notes TEXT,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    """)

    # 3. Notifications Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            date TEXT NOT NULL
        )
    """)

    # 4. Agent Logs Table (Stores Autonomous Action Traces)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            student_name TEXT,
            timestamp TEXT,
            diagnosis TEXT,
            actions_taken TEXT
        )
    """)

    # 5. Settings Table (Stores AI Provider, API Keys, Thresholds)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    # 6. Users Table (for Authentication)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    # Seed Default User
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users VALUES ('info@vignan.ac.in', 'vucse', 'Admin')")

    # Seed Default Settings
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        default_settings = {
            "ai_provider": "local",
            "api_key": "",
            "api_base_url": "",
            "model_name": "llama-3.1-8b-instant",
            "attendance_threshold": "75",
            "risk_threshold": "60"
        }
        for k, v in default_settings.items():
            cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (k, v))

    # Seed Initial Students
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        initial_students = [
            ("25CS001", "V.Sri Udbhav", "Male", "CSE", "2nd Year", 8.2, 24, 82, 88, 18, "Ramesh Kumar", "Lakshmi Kumar", "Telugu", "Hyderabad", "South India", "India"),
            ("25CS002", "Y.Hemanth Reddy", "Male", "CSE", "2nd Year", 7.4, 23, 68, 60, 55, "Reddy Kumar", "Padma", "Telugu", "Vijayawada", "South India", "India"),
            ("25CS003", "T.Gopi", "Male", "CSE", "2nd Year", 7.8, 22, 73, 70, 42, "Srinivas", "Anitha", "Telugu", "Guntur", "South India", "India"),
            ("25CS004", "Sneha Rao", "Female", "CSE", "2nd Year", 8.7, 25, 91, 95, 8, "Rao Kumar", "Sunitha", "Telugu", "Hyderabad", "South India", "India"),
            ("25CS005", "Arjun Patel", "Male", "CSE", "2nd Year", 6.9, 20, 61, 50, 72, "Mahesh Patel", "Kavitha", "Hindi", "Mumbai", "West India", "India")
        ]
        cursor.executemany("INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", initial_students)

    conn.commit()
    conn.close()

def get_system_settings():
    conn = get_db_connection()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

def save_system_settings(settings_dict):
    conn = get_db_connection()
    for k, v in settings_dict.items():
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
