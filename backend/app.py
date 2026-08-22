# =====================================================
# APP.PY
# Flask Web Server, REST API & Autonomous Agent Endpoints
# =====================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import db
import ai_engine
from agent import AcademicInterventionAgent
import datetime

app = Flask(__name__)
CORS(app)  # Enables Cross-Origin API requests

# Initialize SQLite tables on startup
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
# 1. AUTHENTICATION
# =====================================================
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    conn = db.get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password)).fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "email": user["email"], "role": user["role"]})
    return jsonify({"success": False, "message": "Invalid email or password."}), 401


# =====================================================
# 2. STUDENT CRUD ENDPOINTS
# =====================================================
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
    conn.close()

    if not row:
        return jsonify({"error": "Student not found"}), 404

    student_dict = dict(row)
    student_dict["interventions"] = [dict(i) for i in interventions]
    student_dict["ai_analysis"] = ai_engine.calculate_risk_score(
        student_dict.get("attendance"),
        student_dict.get("cgpa"),
        student_dict.get("lms_score")
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

    risk_info = ai_engine.calculate_risk_score(attendance, cgpa, lms_score)
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
        conn.commit()
        conn.close()

        data["risk"] = risk_score
        return jsonify({"success": True, "student": data}), 201
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Error inserting student: {str(e)}"}), 500

@app.route("/api/students/<student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json() or {}
    attendance = int(data.get("attendance", 80))
    cgpa = float(data.get("cgpa", 7.5))
    lms_score = int(data.get("lms_score", attendance))

    risk_info = ai_engine.calculate_risk_score(attendance, cgpa, lms_score)
    risk_score = risk_info["risk_score"]

    conn = db.get_db_connection()
    conn.execute("""
        UPDATE students
        SET name = ?, course = ?, year = ?, cgpa = ?, credits = ?, attendance = ?, lms_score = ?, risk = ?
        WHERE id = ?
    """, (
        data.get("name"), data.get("course"), data.get("year"), cgpa,
        int(data.get("credits", 24)), attendance, lms_score, risk_score, student_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Student updated successfully", "risk": risk_score})

@app.route("/api/students/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = db.get_db_connection()
    conn.execute("DELETE FROM interventions WHERE student_id = ?", (student_id,))
    conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Student {student_id} deleted successfully."})


# =====================================================
# 3. TRULY AUTONOMOUS AGENT ENDPOINTS
# =====================================================
@app.route("/api/agent/run-autonomous-loop", methods=["POST"])
def run_autonomous_loop():
    """Triggers autonomous perception-reasoning-tool execution loop."""
    traces = agent.run_autonomous_cycle()
    return jsonify({
        "success": True,
        "actions_count": len(traces),
        "traces": traces
    })

@app.route("/api/agent/chat", methods=["POST"])
def agent_chat():
    """Processes multi-turn interactive queries with context-aware responses."""
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
# 4. SETTINGS & AI PROVIDER CONFIGURATION
# =====================================================
@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify(db.get_system_settings())

@app.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.get_json() or {}
    db.save_system_settings(data)
    return jsonify({"success": True, "message": "Settings updated successfully."})


# =====================================================
# 5. NOTIFICATIONS & INTERVENTIONS
# =====================================================
@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 20").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/interventions", methods=["GET"])
def get_all_interventions():
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM interventions ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/interventions", methods=["POST"])
def create_intervention():
    data = request.get_json() or {}
    student_id = data.get("student_id")
    action = data.get("action", "Mentoring Session")
    status = data.get("status", "In Progress")

    conn = db.get_db_connection()
    conn.execute("""
        INSERT INTO interventions (student_id, date, action, status, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (student_id, datetime.date.today().isoformat(), action, status, data.get("notes", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Intervention recorded successfully."})

@app.route("/api/anomalies", methods=["GET"])
def get_anomalies():
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM students WHERE attendance < 75 OR risk >= 50").fetchall()
    conn.close()

    anomalies_list = []
    for r in rows:
        st = dict(r)
        detected = ai_engine.detect_student_anomalies(st)
        if detected:
            anomalies_list.append({
                "student_id": st["id"],
                "student_name": st["name"],
                "anomalies": detected
            })
    return jsonify(anomalies_list)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
