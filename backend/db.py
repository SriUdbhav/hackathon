# =====================================================
# DB.PY
# SQLite Database Setup, Tables, Seeding & Settings
# Supports: UAC (Admin/Faculty/Mentor/Student),
#           Per-Subject Marks, Extracurricular Activities
# =====================================================

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def get_db_connection():
    """Establishes connection to local SQLite database with 20s lock timeout."""
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Creates all tables and seeds initial data if empty."""
    conn = get_db_connection()
    c = conn.cursor()

    # ---- 1. STUDENTS TABLE ----
    c.execute("""
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

    # ---- 2. USERS TABLE (UAC: Admin, Faculty, Mentor, Student) ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            display_name TEXT,
            linked_student_id TEXT,
            subjects TEXT,
            extra_roles TEXT
        )
    """)

    # ---- 3. SUBJECTS TABLE (year/semester specific) ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            short_name TEXT,
            credits INTEGER DEFAULT 3,
            year TEXT NOT NULL,
            semester INTEGER DEFAULT 1
        )
    """)

    # ---- 4. SUBJECT MARKS (per-student per-subject) ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS subject_marks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            subject_code TEXT NOT NULL,
            attendance INTEGER DEFAULT 0,
            internal_marks INTEGER DEFAULT 0,
            external_marks INTEGER DEFAULT 0,
            assignment_score INTEGER DEFAULT 0,
            grade TEXT DEFAULT 'N/A',
            UNIQUE(student_id, subject_code)
        )
    """)

    # ---- 5. EXTRACURRICULAR ACTIVITIES (master list) ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS extracurriculars (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT
        )
    """)

    # ---- 6. STUDENT ACTIVITIES (student ↔ activity mapping) ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS student_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            activity_id TEXT NOT NULL,
            role TEXT DEFAULT 'Participant',
            date_joined TEXT,
            notes TEXT,
            UNIQUE(student_id, activity_id)
        )
    """)

    # ---- 7. INTERVENTIONS TABLE ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS interventions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            date TEXT,
            action TEXT,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            urgency TEXT DEFAULT 'Moderate',
            subject_code TEXT,
            mentor_id TEXT,
            completed_date TEXT
        )
    """)

    # ---- 8. NOTIFICATIONS TABLE ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            date TEXT NOT NULL,
            student_id TEXT
        )
    """)

    # ---- 9. AGENT LOGS TABLE ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS agent_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            student_name TEXT,
            timestamp TEXT,
            diagnosis TEXT,
            actions_taken TEXT
        )
    """)

    # ---- 10. SETTINGS TABLE ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    # =====================================================
    # SEED DATA (only if tables are empty)
    # =====================================================

    # -- Seed Students --
    c.execute("SELECT COUNT(*) FROM students")
    if c.fetchone()[0] == 0:
        students_data = [
            ("25CS001", "V.Sri Udbhav",    "Male",   "CSE", "2nd Year", 8.2, 24, 82, 88, 18, "Ramesh Kumar",  "Lakshmi Kumar", "Telugu", "Hyderabad",  "South India", "India"),
            ("25CS002", "Y.Hemanth Reddy",  "Male",   "CSE", "2nd Year", 7.4, 23, 68, 60, 55, "Reddy Kumar",   "Padma",         "Telugu", "Vijayawada", "South India", "India"),
            ("25CS003", "T.Gopi",           "Male",   "CSE", "2nd Year", 7.8, 22, 73, 70, 42, "Srinivas",      "Anitha",        "Telugu", "Guntur",     "South India", "India"),
            ("25CS004", "Sneha Rao",        "Female", "CSE", "2nd Year", 8.7, 25, 91, 95,  8, "Rao Kumar",     "Sunitha",       "Telugu", "Hyderabad",  "South India", "India"),
            ("25CS005", "Arjun Patel",      "Male",   "CSE", "2nd Year", 6.9, 20, 61, 50, 72, "Mahesh Patel",  "Kavitha",       "Hindi",  "Mumbai",     "West India",  "India"),
        ]
        c.executemany("INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", students_data)

    # -- Seed Users (UAC) --
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        users_data = [
            # Admin
            ("admin",   "admin123",  "admin",   "System Administrator",  None,      None,              None),
            # Faculty
            ("FAC001",  "FAC001",    "faculty", "Dr. Ramesh Kumar",      None,      "CS201,CS202",     "Class Teacher,2nd Year Coordinator"),
            ("FAC002",  "FAC002",    "faculty", "Dr. Priya Sharma",      None,      "CS203,CS204",     None),
            ("FAC003",  "FAC003",    "faculty", "Prof. Venkat Rao",      None,      "MA201",           "HOD Mathematics"),
            # Mentor
            ("MEN001",  "MEN001",    "mentor",  "Prof. Sunitha Devi",    None,      "CS201,CS203",     None),
            ("MEN002",  "MEN002",    "mentor",  "Dr. Anil Kumar",        None,      "CS202,CS204",     None),
            # Students (password = their own ID)
            ("25CS001", "25CS001",   "student", "V.Sri Udbhav",         "25CS001", None,              None),
            ("25CS002", "25CS002",   "student", "Y.Hemanth Reddy",      "25CS002", None,              None),
            ("25CS003", "25CS003",   "student", "T.Gopi",               "25CS003", None,              None),
            ("25CS004", "25CS004",   "student", "Sneha Rao",            "25CS004", None,              None),
            ("25CS005", "25CS005",   "student", "Arjun Patel",          "25CS005", None,              None),
        ]
        c.executemany("INSERT INTO users VALUES (?,?,?,?,?,?,?)", users_data)

    # -- Seed Subjects (year-specific) --
    c.execute("SELECT COUNT(*) FROM subjects")
    if c.fetchone()[0] == 0:
        subjects_data = [
            # 1st Year
            ("MA101", "Engineering Mathematics I",    "Math-I",    4, "1st Year", 1),
            ("PH101", "Engineering Physics",          "Physics",   3, "1st Year", 1),
            ("CS101", "C Programming",                "C Lang",    4, "1st Year", 2),
            ("EN101", "Technical English",             "English",   2, "1st Year", 2),
            # 2nd Year
            ("CS201", "Database Management Systems",   "DBMS",      4, "2nd Year", 3),
            ("CS202", "Operating Systems",             "OS",        4, "2nd Year", 3),
            ("MA201", "Discrete Mathematics",          "Math-III",  3, "2nd Year", 3),
            ("CS203", "Computer Networks",             "CN",        4, "2nd Year", 4),
            ("CS204", "Software Engineering",          "SE",        3, "2nd Year", 4),
            # 3rd Year
            ("CS301", "Artificial Intelligence & ML",  "AI/ML",     4, "3rd Year", 5),
            ("CS302", "Cloud Computing",               "Cloud",     3, "3rd Year", 6),
            # 4th Year
            ("CS401", "Major Project",                 "Project",   6, "4th Year", 7),
            ("CS402", "Industry Internship",           "Internship",6, "4th Year", 8),
        ]
        c.executemany("INSERT INTO subjects VALUES (?,?,?,?,?,?)", subjects_data)

    # -- Seed Subject Marks (2nd Year students, Semester 3 subjects) --
    c.execute("SELECT COUNT(*) FROM subject_marks")
    if c.fetchone()[0] == 0:
        marks_data = [
            # Sri Udbhav (strong overall)
            ("25CS001", "CS201", 85, 24, 62, 88, "A"),
            ("25CS001", "CS202", 80, 22, 58, 82, "A"),
            ("25CS001", "MA201", 78, 20, 55, 75, "B+"),
            ("25CS001", "CS203", 84, 25, 60, 90, "A+"),
            ("25CS001", "CS204", 82, 23, 57, 85, "A"),
            # Hemanth Reddy (attendance issues)
            ("25CS002", "CS201", 65, 18, 45, 60, "B"),
            ("25CS002", "CS202", 70, 20, 50, 65, "B+"),
            ("25CS002", "MA201", 62, 15, 40, 55, "B"),
            ("25CS002", "CS203", 72, 19, 48, 62, "B"),
            ("25CS002", "CS204", 68, 17, 44, 58, "B"),
            # Gopi (moderate, inconsistent)
            ("25CS003", "CS201", 75, 21, 52, 70, "B+"),
            ("25CS003", "CS202", 72, 19, 48, 68, "B"),
            ("25CS003", "MA201", 70, 18, 45, 65, "B"),
            ("25CS003", "CS203", 74, 20, 50, 72, "B+"),
            ("25CS003", "CS204", 76, 22, 54, 74, "B+"),
            # Sneha Rao (excellent)
            ("25CS004", "CS201", 92, 28, 65, 95, "A+"),
            ("25CS004", "CS202", 90, 27, 63, 92, "A+"),
            ("25CS004", "MA201", 88, 26, 60, 90, "A"),
            ("25CS004", "CS203", 93, 29, 66, 96, "A+"),
            ("25CS004", "CS204", 91, 28, 64, 94, "A+"),
            # Arjun Patel (struggling across subjects)
            ("25CS005", "CS201", 55, 8,  30, 40, "D"),
            ("25CS005", "CS202", 62, 14, 38, 50, "C"),
            ("25CS005", "MA201", 58, 10, 32, 42, "D"),
            ("25CS005", "CS203", 64, 15, 40, 52, "C"),
            ("25CS005", "CS204", 60, 12, 35, 48, "C"),
        ]
        c.executemany("INSERT INTO subject_marks (student_id, subject_code, attendance, internal_marks, external_marks, assignment_score, grade) VALUES (?,?,?,?,?,?,?)", marks_data)

    # -- Seed Extracurricular Activities --
    c.execute("SELECT COUNT(*) FROM extracurriculars")
    if c.fetchone()[0] == 0:
        activities_data = [
            ("CCLUB",  "Coding Club",                    "Club",      "Weekly coding challenges, competitive programming practice"),
            ("RCLUB",  "Robotics Club",                  "Club",      "Arduino/Raspberry Pi projects and inter-college robotics competitions"),
            ("LCLUB",  "Literary & Debate Club",         "Club",      "Public speaking, essay writing, and inter-college debate tournaments"),
            ("TECH26", "TechFest 2026",                  "Event",     "Annual college technical festival with paper presentations and project expos"),
            ("CULT26", "Cultural Fest 2026",             "Event",     "Annual cultural festival with performances, art, and music"),
            ("HACK01", "Inter-College Hackathon 2026",   "Hackathon", "48-hour hackathon solving real-world engineering problems"),
            ("CRIC01", "College Cricket Team",           "Sports",    "Inter-university cricket team representing the college"),
            ("BASK01", "College Basketball Team",        "Sports",    "Inter-university basketball team"),
            ("WORK01", "AWS Cloud Workshop",             "Workshop",  "2-day hands-on workshop on AWS cloud services and deployment"),
        ]
        c.executemany("INSERT INTO extracurriculars VALUES (?,?,?,?)", activities_data)

    # -- Seed Student Activities --
    c.execute("SELECT COUNT(*) FROM student_activities")
    if c.fetchone()[0] == 0:
        student_act_data = [
            ("25CS001", "CCLUB",  "Lead",        "2025-08-01", "Founded the competitive programming wing"),
            ("25CS001", "HACK01", "Participant",  "2026-03-15", "Built an AI attendance tracker"),
            ("25CS001", "TECH26", "Participant",  "2026-02-20", "Paper presentation on ML applications"),
            ("25CS002", "RCLUB",  "Member",       "2025-09-01", None),
            ("25CS002", "CRIC01", "Member",       "2025-08-15", "Bowler in college team"),
            ("25CS003", "BASK01", "Captain",      "2025-07-01", "Led team to state quarter-finals"),
            ("25CS003", "CULT26", "Participant",   "2026-01-10", "Music performance"),
            ("25CS004", "LCLUB",  "Lead",         "2025-08-01", "Won Best Speaker at inter-college debate"),
            ("25CS004", "CCLUB",  "Member",       "2025-09-15", None),
            ("25CS004", "HACK01", "Winner",       "2026-03-15", "Won 1st place - EduTech category"),
            ("25CS004", "WORK01", "Participant",   "2026-04-10", "Completed AWS certification"),
            ("25CS005", "CRIC01", "Member",       "2025-08-15", None),
        ]
        c.executemany("INSERT INTO student_activities (student_id, activity_id, role, date_joined, notes) VALUES (?,?,?,?,?)", student_act_data)

    # -- Seed Settings --
    c.execute("SELECT COUNT(*) FROM settings")
    if c.fetchone()[0] == 0:
        default_settings = {
            "ai_provider": "local",
            "api_key": "",
            "api_base_url": "",
            "model_name": "",
            "attendance_threshold": "75",
            "risk_threshold": "60",
        }
        for k, v in default_settings.items():
            c.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()


# =====================================================
# SETTINGS HELPERS
# =====================================================
def get_system_settings():
    """Returns all settings as a dictionary."""
    conn = get_db_connection()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

def save_system_settings(settings_dict):
    """Upserts settings key-value pairs."""
    conn = get_db_connection()
    for k, v in settings_dict.items():
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
