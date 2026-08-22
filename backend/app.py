# =====================================================
# APP.PY
# Flask REST API — Auth, CRUD, UAC, Subjects, Activities,
# Intervention Lifecycle, Autonomous Agent, Settings
# =====================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import db
import ai_engine
from agent import AcademicInterventionAgent
import datetime

app = Flask(__name__)
CORS(app)

db.init_db()
agent = AcademicInterventionAgent()


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Online",
        "service": "EduStudent Sight - Autonomous Agentic AI Platform",
        "timestamp": datetime.datetime.now().isoformat()
    })


# =====================================================
# 1. AUTHENTICATION & USER MANAGEMENT
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():
    """Case-insensitive login using raw user ID."""
    data = request.get_json() or {}
    user_id = data.get("email", data.get("id", "")).strip()
    password = data.get("password", "")

    conn = db.get_db_connection()
    # Case-insensitive lookup
    user = conn.execute("SELECT * FROM users WHERE LOWER(id) = LOWER(?)", (user_id,)).fetchone()
    conn.close()

    if user and user["password"] == password:
        return jsonify({
            "success": True,
            "id": user["id"],
            "role": user["role"],
            "display_name": user["display_name"],
            "linked_student_id": user["linked_student_id"],
            "subjects": user["subjects"],
            "extra_roles": user["extra_roles"]
        })

    return jsonify({"success": False, "message": "Invalid ID or password."}), 401


@app.route("/api/users/password", methods=["PUT"])
def change_password():
    """Change password — requires current password verification."""
    data = request.get_json() or {}
    user_id = data.get("id", "").strip()
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")

    if not user_id or not new_pw:
        return jsonify({"success": False, "message": "User ID and new password required."}), 400

    conn = db.get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE LOWER(id) = LOWER(?)", (user_id,)).fetchone()

    if not user or user["password"] != current_pw:
        conn.close()
        return jsonify({"success": False, "message": "Current password is incorrect."}), 403

    conn.execute("UPDATE users SET password = ? WHERE LOWER(id) = LOWER(?)", (new_pw, user_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Password updated successfully."})


@app.route("/api/users", methods=["GET"])
def get_all_users():
    """Admin only: List all user accounts."""
    conn = db.get_db_connection()
    rows = conn.execute("SELECT id, role, display_name, linked_student_id, subjects, extra_roles FROM users").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/users", methods=["POST"])
def create_user():
    """Admin only: Create a new faculty or mentor user."""
    data = request.get_json() or {}
    user_id = data.get("id", "").strip()
    if not user_id:
        return jsonify({"success": False, "message": "User ID required."}), 400

    conn = db.get_db_connection()
    try:
        conn.execute("INSERT INTO users VALUES (?,?,?,?,?,?,?)", (
            user_id,
            data.get("password", user_id),  # Default password = ID
            data.get("role", "mentor"),
            data.get("display_name", user_id),
            data.get("linked_student_id"),
            data.get("subjects", ""),
            data.get("extra_roles", "")
        ))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": f"User {user_id} created."})
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Admin only: Delete a user account."""
    conn = db.get_db_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"User {user_id} deleted."})


# =====================================================
# 2. STUDENT CRUD
# =====================================================

def _get_thresholds():
    """Helper: Read dynamic thresholds from settings."""
    settings = db.get_system_settings()
    return {
        "attendance_threshold": float(settings.get("attendance_threshold", 75)),
        "risk_cgpa_threshold": float(settings.get("risk_cgpa_threshold", 7.5))
    }


@app.route("/api/students", methods=["GET"])
def get_students():
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM students ORDER BY risk DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/students/<student_id>", methods=["GET"])
def get_student_detail(student_id):
    conn = db.get_db_connection()
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    interventions = conn.execute("SELECT * FROM interventions WHERE student_id = ? ORDER BY id DESC", (student_id,)).fetchall()
    marks = conn.execute("SELECT * FROM subject_marks WHERE student_id = ?", (student_id,)).fetchall()
    activities = conn.execute("""
        SELECT sa.*, e.name as activity_name, e.category
        FROM student_activities sa
        JOIN extracurriculars e ON sa.activity_id = e.id
        WHERE sa.student_id = ?
    """, (student_id,)).fetchall()
    conn.close()

    if not row:
        return jsonify({"error": "Student not found"}), 404

    thresholds = _get_thresholds()
    student_dict = dict(row)
    student_dict["interventions"] = [dict(i) for i in interventions]
    student_dict["subject_marks"] = [dict(m) for m in marks]
    student_dict["activities"] = [dict(a) for a in activities]
    student_dict["ai_analysis"] = ai_engine.calculate_risk_score(
        student_dict.get("attendance"),
        student_dict.get("cgpa"),
        student_dict.get("lms_score"),
        **thresholds
    )
    return jsonify(student_dict)


@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.get_json() or {}
    student_id = data.get("id", "").strip()
    name = data.get("name", "").strip()
    if not student_id or not name:
        return jsonify({"success": False, "message": "Student ID and Name are required."}), 400

    attendance = int(data.get("attendance", 80))
    cgpa = float(data.get("cgpa", 7.5))
    lms_score = int(data.get("lms_score", attendance))

    thresholds = _get_thresholds()
    risk_info = ai_engine.calculate_risk_score(attendance, cgpa, lms_score, **thresholds)
    risk_score = risk_info["risk_score"]

    conn = db.get_db_connection()
    try:
        conn.execute("""
            INSERT INTO students (id, name, gender, course, year, cgpa, credits, attendance, lms_score, risk, father, mother, mother_tongue, place, region, country)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            student_id, name, data.get("gender", "Male"), data.get("course", "CSE"),
            data.get("year", "2nd Year"), cgpa, int(data.get("credits", 24)), attendance,
            lms_score, risk_score, data.get("father", "N/A"), data.get("mother", "N/A"),
            data.get("motherTongue", "Telugu"), data.get("place", "Hyderabad"),
            data.get("region", "South India"), data.get("country", "India")
        ))
        # Also create a user account for the student
        conn.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?,?)", (
            student_id, student_id, "student", name, student_id, None, None
        ))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "student": {**data, "risk": risk_score}}), 201
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/api/students/<student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json() or {}
    attendance = int(data.get("attendance", 80))
    cgpa = float(data.get("cgpa", 7.5))
    lms_score = int(data.get("lms_score", attendance))

    thresholds = _get_thresholds()
    risk_info = ai_engine.calculate_risk_score(attendance, cgpa, lms_score, **thresholds)
    risk_score = risk_info["risk_score"]

    conn = db.get_db_connection()
    conn.execute("""
        UPDATE students SET name=?, course=?, year=?, cgpa=?, credits=?, attendance=?, lms_score=?, risk=?
        WHERE id=?
    """, (
        data.get("name"), data.get("course"), data.get("year"), cgpa,
        int(data.get("credits", 24)), attendance, lms_score, risk_score, student_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Student updated.", "risk": risk_score})


@app.route("/api/students/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = db.get_db_connection()
    conn.execute("DELETE FROM interventions WHERE student_id = ?", (student_id,))
    conn.execute("DELETE FROM subject_marks WHERE student_id = ?", (student_id,))
    conn.execute("DELETE FROM student_activities WHERE student_id = ?", (student_id,))
    conn.execute("DELETE FROM users WHERE id = ? AND role = 'student'", (student_id,))
    conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Student {student_id} deleted."})


@app.route("/api/recalculate-risks", methods=["POST"])
def recalculate_risks():
    """Recalculates risk scores for ALL students using current threshold settings."""
    thresholds = _get_thresholds()
    conn = db.get_db_connection()
    rows = conn.execute("SELECT id, attendance, cgpa, lms_score FROM students").fetchall()
    count = 0
    for r in rows:
        risk_info = ai_engine.calculate_risk_score(r["attendance"], r["cgpa"], r["lms_score"], **thresholds)
        conn.execute("UPDATE students SET risk = ? WHERE id = ?", (risk_info["risk_score"], r["id"]))
        count += 1
    conn.commit()
    conn.close()
    return jsonify({"success": True, "updated_count": count})


# =====================================================
# 3. SUBJECTS & MARKS
# =====================================================

@app.route("/api/subjects", methods=["GET"])
def get_subjects():
    year = request.args.get("year")
    conn = db.get_db_connection()
    if year:
        rows = conn.execute("SELECT * FROM subjects WHERE year = ? ORDER BY semester, code", (year,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM subjects ORDER BY year, semester, code").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/subject-marks/<student_id>", methods=["GET"])
def get_subject_marks(student_id):
    conn = db.get_db_connection()
    rows = conn.execute("""
        SELECT sm.*, s.name as subject_name, s.short_name, s.credits, s.year, s.semester
        FROM subject_marks sm
        JOIN subjects s ON sm.subject_code = s.code
        WHERE sm.student_id = ?
        ORDER BY s.semester, s.code
    """, (student_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/subject-marks", methods=["GET"])
def get_all_subject_marks():
    conn = db.get_db_connection()
    rows = conn.execute("""
        SELECT sm.*, s.name as subject_name, s.short_name
        FROM subject_marks sm
        JOIN subjects s ON sm.subject_code = s.code
        ORDER BY sm.student_id, s.code
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/subject-marks", methods=["POST"])
def upsert_subject_marks():
    data = request.get_json() or {}
    conn = db.get_db_connection()
    conn.execute("""
        INSERT INTO subject_marks (student_id, subject_code, attendance, internal_marks, external_marks, assignment_score, grade)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, subject_code) DO UPDATE SET
            attendance=excluded.attendance, internal_marks=excluded.internal_marks,
            external_marks=excluded.external_marks, assignment_score=excluded.assignment_score, grade=excluded.grade
    """, (
        data.get("student_id"), data.get("subject_code"),
        int(data.get("attendance", 0)), int(data.get("internal_marks", 0)),
        int(data.get("external_marks", 0)), int(data.get("assignment_score", 0)),
        data.get("grade", "N/A")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Subject marks saved."})


# =====================================================
# 4. EXTRACURRICULAR ACTIVITIES
# =====================================================

@app.route("/api/extracurriculars", methods=["GET"])
def get_extracurriculars():
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM extracurriculars ORDER BY category, name").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/student-activities/<student_id>", methods=["GET"])
def get_student_activities(student_id):
    conn = db.get_db_connection()
    rows = conn.execute("""
        SELECT sa.*, e.name as activity_name, e.category, e.description as activity_desc
        FROM student_activities sa
        JOIN extracurriculars e ON sa.activity_id = e.id
        WHERE sa.student_id = ?
        ORDER BY e.category, e.name
    """, (student_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# =====================================================
# 5. INTERVENTIONS (Full Lifecycle)
# =====================================================

@app.route("/api/interventions", methods=["GET"])
def get_all_interventions():
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM interventions ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/interventions/<student_id>", methods=["GET"])
def get_student_interventions(student_id):
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM interventions WHERE student_id = ? ORDER BY id DESC", (student_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/interventions", methods=["POST"])
def create_intervention():
    data = request.get_json() or {}
    conn = db.get_db_connection()
    conn.execute("""
        INSERT INTO interventions (student_id, date, action, status, notes, urgency, subject_code, mentor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("student_id"),
        datetime.date.today().isoformat(),
        data.get("action", "Mentoring Session"),
        data.get("status", "Pending"),
        data.get("notes", ""),
        data.get("urgency", "Moderate"),
        data.get("subject_code"),
        data.get("mentor_id")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Intervention created."})


@app.route("/api/interventions/update/<int:intervention_id>", methods=["PUT"])
def update_intervention(intervention_id):
    """Update intervention status (Pending → In Progress → Completed → Archived)."""
    data = request.get_json() or {}
    new_status = data.get("status", "In Progress")
    completed_date = None
    if new_status == "Completed":
        completed_date = datetime.date.today().isoformat()

    conn = db.get_db_connection()
    conn.execute("""
        UPDATE interventions SET status = ?, notes = COALESCE(?, notes), completed_date = ?
        WHERE id = ?
    """, (new_status, data.get("notes"), completed_date, intervention_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Intervention #{intervention_id} updated to {new_status}."})


# =====================================================
# 6. AUTONOMOUS AGENT
# =====================================================

@app.route("/api/agent/run-autonomous-loop", methods=["POST"])
def run_autonomous_loop():
    traces = agent.run_autonomous_cycle()
    return jsonify({
        "success": True,
        "actions_count": len(traces),
        "traces": traces
    })


@app.route("/api/agent/chat", methods=["POST"])
def agent_chat():
    data = request.get_json() or {}
    user_query = data.get("query", "").strip()
    history = data.get("history", [])
    provider = data.get("provider")

    if not user_query:
        return jsonify({"response": "Please enter a valid query."})

    answer = agent.chat_query(user_query, history=history, provider_override=provider)
    return jsonify({"response": answer})


@app.route("/api/agent/logs", methods=["GET"])
def get_agent_logs():
    conn = db.get_db_connection()
    logs = conn.execute("SELECT * FROM agent_logs ORDER BY id DESC LIMIT 20").fetchall()
    conn.close()
    return jsonify([dict(l) for l in logs])


# =====================================================
# 7. SETTINGS
# =====================================================

@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify(db.get_system_settings())


@app.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.get_json() or {}
    db.save_system_settings(data)
    return jsonify({"success": True, "message": "Settings updated."})


# =====================================================
# 8. NOTIFICATIONS & ANOMALIES
# =====================================================

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    student_id = request.args.get("student_id")
    conn = db.get_db_connection()
    if student_id:
        rows = conn.execute("SELECT * FROM notifications WHERE student_id = ? OR student_id IS NULL ORDER BY id DESC LIMIT 30", (student_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 30").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/anomalies", methods=["GET"])
def get_anomalies():
    settings = db.get_system_settings()
    attd_threshold = float(settings.get("attendance_threshold", 75))

    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM students WHERE attendance < ? OR risk >= 50", (attd_threshold,)).fetchall()

    anomalies_list = []
    for r in rows:
        st = dict(r)
        # Get subject marks for subject-level anomalies
        marks = conn.execute("SELECT * FROM subject_marks WHERE student_id = ?", (st["id"],)).fetchall()
        marks_list = [dict(m) for m in marks]
        detected = ai_engine.detect_student_anomalies(st, subject_marks=marks_list)
        if detected:
            anomalies_list.append({
                "student_id": st["id"],
                "student_name": st["name"],
                "attendance": st["attendance"],
                "risk": st["risk"],
                "anomalies": detected
            })
    conn.close()
    return jsonify(anomalies_list)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
