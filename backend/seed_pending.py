import sqlite3
import os
import datetime

db_path = os.path.join(os.path.dirname(__file__), "database.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Ensure standard faculty accounts exist
faculty_seeds = [
    ("FAC001", "FAC001", "faculty", "Dr. Ramesh Kumar", None, "CS201,CS202", "Class Teacher,2nd Year Coordinator", "dr.ramesh@vignan.ac.in", "+91 90000 11111", "Active"),
    ("FAC002", "FAC002", "faculty", "Dr. Priya Sharma", None, "CS203,CS204", "Exam Cell Incharge", "dr.priya@vignan.ac.in", "+91 90000 22222", "Active"),
    ("FAC003", "FAC003", "faculty", "Prof. Venkat Rao", None, "MA201", "HOD Mathematics", "prof.venkat@vignan.ac.in", "+91 90000 33333", "Active"),
    ("MEN001", "MEN001", "mentor", "Prof. Sunitha Devi", None, "CS201,CS203", "Senior Mentor", "prof.sunitha@vignan.ac.in", "+91 90000 44444", "Active"),
    ("MEN002", "MEN002", "mentor", "Dr. Anil Kumar", None, "CS202,CS204", "Hostel Warden", "dr.anil@vignan.ac.in", "+91 90000 55555", "Active"),
]

for f in faculty_seeds:
    c.execute("""
        INSERT INTO users (id, password, role, display_name, linked_student_id, subjects, extra_roles, email, phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            display_name=excluded.display_name,
            role=excluded.role,
            subjects=excluded.subjects,
            extra_roles=excluded.extra_roles,
            email=excluded.email,
            phone=excluded.phone,
            status=excluded.status
    """, f)

# Add 2 pending applications
today = datetime.date.today().isoformat()
c.execute("""
    INSERT INTO signup_requests (user_id, password, role, display_name, email, phone, subjects, extra_roles, status, rejection_reason, created_at, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", ("FAC012", "Pass@123", "faculty", "Dr. Rajesh Gupta", "rajesh.gupta@vignan.ac.in", "+91 98765 11223", "CS201,CS303", "Lab Incharge", "Pending", None, today, None))

c.execute("""
    INSERT INTO signup_requests (user_id, password, role, display_name, email, phone, subjects, extra_roles, status, rejection_reason, created_at, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", ("MEN005", "Pass@123", "mentor", "Prof. Ananya Sen", "ananya.sen@vignan.ac.in", "+91 98765 44332", "CS101,CS202", "Counselor", "Pending", None, today, None))

conn.commit()
conn.close()
print("Pending applications and faculty records successfully populated.")
