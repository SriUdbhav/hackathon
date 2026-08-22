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
import csv
import io

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

def _log_email(recipient, subject, body_html, body_text, email_type):
    """Logs sent email notification to database audit trail."""
    try:
        conn = db.get_db_connection()
        conn.execute("""
            INSERT INTO email_logs (recipient, subject, body_html, body_text, email_type, sent_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (recipient, subject, body_html, body_text, email_type, datetime.datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Email Log Error] {e}")


@app.route("/api/login", methods=["POST"])
def login():
    """Case-insensitive login using raw user ID or email."""
    data = request.get_json() or {}
    user_id = data.get("email", data.get("id", "")).strip()
    password = data.get("password", "")

    conn = db.get_db_connection()
    # Check if there is a pending signup request for this user ID
    pending = conn.execute("SELECT * FROM signup_requests WHERE (LOWER(user_id) = LOWER(?) OR LOWER(email) = LOWER(?)) AND status = 'Pending'", (user_id, user_id)).fetchone()
    if pending:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Your registration request is currently pending Administrator review. You will receive an email once approved."
        }), 403

    rejected = conn.execute("SELECT * FROM signup_requests WHERE (LOWER(user_id) = LOWER(?) OR LOWER(email) = LOWER(?)) AND status = 'Rejected'", (user_id, user_id)).fetchone()
    if rejected:
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Your registration request was not approved. Reason: {rejected['rejection_reason'] or 'Contact administration.'}"
        }), 403

    # Lookup active user by ID or Email
    user = conn.execute("SELECT * FROM users WHERE LOWER(id) = LOWER(?) OR LOWER(COALESCE(email,'')) = LOWER(?)", (user_id, user_id)).fetchone()
    conn.close()

    if user and user["password"] == password:
        return jsonify({
            "success": True,
            "id": user["id"],
            "role": user["role"],
            "display_name": user["display_name"],
            "linked_student_id": user["linked_student_id"],
            "subjects": user["subjects"],
            "extra_roles": user["extra_roles"],
            "email": user["email"] if "email" in user.keys() else None,
            "phone": user["phone"] if "phone" in user.keys() else None
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
    rows = conn.execute("SELECT id, role, display_name, linked_student_id, subjects, extra_roles, email, phone FROM users").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/users", methods=["POST"])
def create_user():
    """Admin only: Create a new faculty or mentor user directly."""
    data = request.get_json() or {}
    user_id = data.get("id", "").strip()
    if not user_id:
        return jsonify({"success": False, "message": "User ID required."}), 400

    conn = db.get_db_connection()
    try:
        conn.execute("INSERT INTO users (id, password, role, display_name, linked_student_id, subjects, extra_roles, email, phone) VALUES (?,?,?,?,?,?,?,?,?)", (
            user_id,
            data.get("password", user_id),
            data.get("role", "mentor"),
            data.get("display_name", user_id),
            data.get("linked_student_id"),
            data.get("subjects", ""),
            data.get("extra_roles", ""),
            data.get("email", ""),
            data.get("phone", "")
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
# 1B. SIGNUP REQUESTS & ADMIN APPROVAL WORKFLOW
# =====================================================

@app.route("/api/signup-requests", methods=["POST"])
def submit_signup_request():
    """Submit a registration application for Faculty or Mentor account."""
    data = request.get_json() or {}
    user_id = data.get("id", data.get("user_id", "")).strip()
    name = data.get("display_name", data.get("name", "")).strip()
    role = data.get("role", "faculty").strip().lower()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    password = data.get("password", "").strip()
    subjects = data.get("subjects", "").strip()
    extra_roles = data.get("extra_roles", "").strip()

    if not user_id or not name or not email or not password:
        return jsonify({"success": False, "message": "User ID, Full Name, Email, and Password are required."}), 400

    conn = db.get_db_connection()

    # Check if user ID already exists in users
    existing_user = conn.execute("SELECT id FROM users WHERE LOWER(id) = LOWER(?)", (user_id,)).fetchone()
    if existing_user:
        conn.close()
        return jsonify({"success": False, "message": f"User ID '{user_id}' is already registered in the system."}), 400

    # Check if email is already in use
    existing_email = conn.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,)).fetchone()
    if existing_email:
        conn.close()
        return jsonify({"success": False, "message": f"Email address '{email}' is already associated with an existing account."}), 400

    # Check if there is an active pending request
    existing_req = conn.execute("SELECT id FROM signup_requests WHERE (LOWER(user_id) = LOWER(?) OR LOWER(email) = LOWER(?)) AND status = 'Pending'", (user_id, email)).fetchone()
    if existing_req:
        conn.close()
        return jsonify({"success": False, "message": "An application with this ID or Email is already pending Administrator review."}), 400

    try:
        cur = conn.execute("""
            INSERT INTO signup_requests (user_id, password, role, display_name, email, phone, subjects, extra_roles, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        """, (user_id, password, role, name, email, phone, subjects, extra_roles, datetime.date.today().isoformat()))
        req_id = cur.lastrowid

        # Also add a system notification for Admin
        conn.execute("""
            INSERT INTO notifications (title, message, type, date)
            VALUES (?, ?, 'warning', ?)
        """, (
            f"New {role.capitalize()} Signup Request: {name}",
            f"{name} ({user_id}) has applied for a {role.capitalize()} account. Review and approve in User Access.",
            datetime.date.today().isoformat()
        ))

        conn.commit()
        conn.close()
        return jsonify({
            "success": True,
            "request_id": req_id,
            "message": f"Application submitted successfully! Your {role.capitalize()} account for '{name}' is awaiting Administrator approval. You will receive an email confirmation at {email} once approved."
        }), 201
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500


@app.route("/api/signup-requests", methods=["GET"])
def get_signup_requests():
    """Admin only: List all signup applications."""
    status = request.args.get("status")
    conn = db.get_db_connection()
    if status:
        rows = conn.execute("SELECT * FROM signup_requests WHERE status = ? ORDER BY id DESC", (status,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM signup_requests ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/signup-requests/<int:req_id>/approve", methods=["POST"])
def approve_signup_request(req_id):
    """Admin only: Approve signup request, activate user, and dispatch welcome email."""
    conn = db.get_db_connection()
    req = conn.execute("SELECT * FROM signup_requests WHERE id = ?", (req_id,)).fetchone()

    if not req:
        conn.close()
        return jsonify({"success": False, "message": "Registration request not found."}), 404

    if req["status"] == "Approved":
        conn.close()
        return jsonify({"success": False, "message": "This application has already been approved."}), 400

    try:
        # 1. Create User in `users` table
        conn.execute("""
            INSERT OR REPLACE INTO users (id, password, role, display_name, linked_student_id, subjects, extra_roles, email, phone)
            VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)
        """, (
            req["user_id"],
            req["password"],
            req["role"],
            req["display_name"],
            req["subjects"],
            req["extra_roles"],
            req["email"],
            req["phone"]
        ))

        # 2. Update request status to Approved
        conn.execute("UPDATE signup_requests SET status = 'Approved', reviewed_at = ? WHERE id = ?", (
            datetime.datetime.now().isoformat(), req_id
        ))

        # 3. Create formatted acceptance email
        subject = f"Welcome to EduStudent Sight — {req['role'].capitalize()} Account Activated"
        body_html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #1e293b; color: #ffffff; padding: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px;">EduStudent Sight</h2>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Academic Intelligence Platform</p>
            </div>
            <div style="padding: 28px; background: #ffffff;">
                <h3 style="color: #0f172a; margin-top: 0;">Welcome, {req['display_name']}!</h3>
                <p style="color: #334155; line-height: 1.6;">Your registration application for the <strong>{req['role'].upper()}</strong> role has been approved by the Institutional Administrator.</p>
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px; margin: 20px 0;">
                    <h4 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; text-transform: uppercase;">Your Account Credentials:</h4>
                    <table style="width: 100%; font-size: 14px; color: #334155;">
                        <tr><td style="padding: 4px 0; width: 140px;"><strong>User ID:</strong></td><td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{req['user_id']}</code></td></tr>
                        <tr><td style="padding: 4px 0;"><strong>Password:</strong></td><td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{req['password']}</code></td></tr>
                        <tr><td style="padding: 4px 0;"><strong>Role:</strong></td><td><span style="color: #2563eb; font-weight: 600;">{req['role'].capitalize()}</span></td></tr>
                        <tr><td style="padding: 4px 0;"><strong>Assigned Subjects:</strong></td><td>{req['subjects'] or 'All Departmental Subjects'}</td></tr>
                        <tr><td style="padding: 4px 0;"><strong>Responsibilities:</strong></td><td>{req['extra_roles'] or 'Department Member'}</td></tr>
                    </table>
                </div>
                <p style="color: #334155; line-height: 1.6;">You may now log in to the platform with your credentials.</p>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                &copy; 2026 EduStudent Sight • Vignan University Department of CSE
            </div>
        </div>
        """
        body_text = f"Welcome, {req['display_name']}! Your {req['role']} account ({req['user_id']}) has been activated. Password: {req['password']}."

        conn.commit()
        conn.close()

        # Log email
        _log_email(req["email"], subject, body_html, body_text, "Account Approved")

        return jsonify({
            "success": True,
            "message": f"Application for {req['display_name']} ({req['user_id']}) approved! Welcome email dispatched to {req['email']} with login credentials."
        })
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Approval failed: {str(e)}"}), 500


@app.route("/api/signup-requests/<int:req_id>/reject", methods=["POST"])
def reject_signup_request(req_id):
    """Admin only: Reject signup request with specified reasoning and dispatch rejection notice."""
    data = request.get_json() or {}
    reason = data.get("reason", "").strip() or "Application details could not be verified by the Department Administrator."

    conn = db.get_db_connection()
    req = conn.execute("SELECT * FROM signup_requests WHERE id = ?", (req_id,)).fetchone()

    if not req:
        conn.close()
        return jsonify({"success": False, "message": "Registration request not found."}), 404

    try:
        # Update request status to Rejected
        conn.execute("UPDATE signup_requests SET status = 'Rejected', rejection_reason = ?, reviewed_at = ? WHERE id = ?", (
            reason, datetime.datetime.now().isoformat(), req_id
        ))

        # Create structured rejection email
        subject = f"EduStudent Sight Application Status — {req['role'].capitalize()} Account"
        body_html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #1e293b; color: #ffffff; padding: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px;">EduStudent Sight</h2>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Academic Intelligence Platform</p>
            </div>
            <div style="padding: 28px; background: #ffffff;">
                <h3 style="color: #0f172a; margin-top: 0;">Application Status Notice</h3>
                <p style="color: #334155; line-height: 1.6;">Dear {req['display_name']},</p>
                <p style="color: #334155; line-height: 1.6;">Thank you for your interest in joining EduStudent Sight as a <strong>{req['role'].upper()}</strong>. After reviewing your registration application (ID: <code>{req['user_id']}</code>), the Department Administrator has decided not to approve the request at this time.</p>
                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                    <strong style="color: #991b1b; display: block; margin-bottom: 6px;">Reason for Decision:</strong>
                    <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">{reason}</p>
                </div>
                <p style="color: #334155; line-height: 1.6;">If you believe this decision was made in error or if you have questions, please contact the Department Academic Advisory office.</p>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                &copy; 2026 EduStudent Sight • Vignan University Department of CSE
            </div>
        </div>
        """
        body_text = f"Dear {req['display_name']}, your application for {req['role']} ({req['user_id']}) was rejected. Reason: {reason}"

        conn.commit()
        conn.close()

        # Log email
        _log_email(req["email"], subject, body_html, body_text, "Account Rejected")

        return jsonify({
            "success": True,
            "message": f"Application for {req['display_name']} ({req['user_id']}) marked as Rejected. Rejection email with explanation dispatched to {req['email']}."
        })
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "message": f"Rejection failed: {str(e)}"}), 500


@app.route("/api/emails", methods=["GET"])
def get_email_logs():
    """Admin only: List dispatched email logs for auditing."""
    conn = db.get_db_connection()
    rows = conn.execute("SELECT * FROM email_logs ORDER BY id DESC LIMIT 50").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


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
    marks = conn.execute("""
        SELECT sm.*, s.name as subject_name, s.short_name
        FROM subject_marks sm
        LEFT JOIN subjects s ON sm.subject_code = s.code
        WHERE sm.student_id = ?
    """, (student_id,)).fetchall()
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

    attendance = int(data.get("attendance", 0))
    cgpa = float(data.get("cgpa", 0.0))
    lms_score = int(data.get("lms_score", attendance))
    email = data.get("email", "").strip() or "Unknown"
    phone = data.get("phone", "").strip() or "Unknown"

    thresholds = _get_thresholds()
    risk_info = ai_engine.calculate_risk_score(attendance, cgpa, lms_score, **thresholds)
    risk_score = risk_info["risk_score"]

    conn = db.get_db_connection()
    try:
        conn.execute("""
            INSERT INTO students (id, name, gender, course, year, cgpa, credits, attendance, lms_score, risk, father, mother, mother_tongue, place, region, country, email, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            student_id, name, data.get("gender", "Unknown"), data.get("course", "Unknown"),
            data.get("year", "Unknown"), cgpa, int(data.get("credits", 0)), attendance,
            lms_score, risk_score, data.get("father", "Unknown"), data.get("mother", "Unknown"),
            data.get("motherTongue", "Unknown"), data.get("place", "Unknown"),
            data.get("region", "Unknown"), data.get("country", "Unknown"),
            email, phone
        ))
        # Also create a user account for the student
        conn.execute("INSERT OR IGNORE INTO users (id, password, role, display_name, linked_student_id, subjects, extra_roles, email, phone) VALUES (?,?,?,?,?,?,?,?,?)", (
            student_id, student_id, "student", name, student_id, None, None, email, phone
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
        UPDATE students SET name=?, course=?, year=?, cgpa=?, credits=?, attendance=?, lms_score=?, risk=?, father=?, mother=?, mother_tongue=?, place=?, region=?, email=?, phone=?
        WHERE id=?
    """, (
        data.get("name"), data.get("course"), data.get("year"), cgpa,
        int(data.get("credits", 24)), attendance, lms_score, risk_score,
        data.get("father"), data.get("mother"), data.get("motherTongue"),
        data.get("place"), data.get("region"), data.get("email"), data.get("phone"),
        student_id
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
    """Update intervention status. Only admin can mark as Completed."""
    data = request.get_json() or {}
    new_status = data.get("status", "In Progress")
    caller_role = data.get("caller_role", "")

    # UAC: Only admin can mark interventions as Completed
    if new_status == "Completed" and caller_role != "admin":
        return jsonify({"success": False, "message": "Only administrators can mark interventions as completed."}), 403

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
    include_read = request.args.get("include_read", "true")
    conn = db.get_db_connection()

    if student_id:
        # UAC FIX: Students ONLY see notifications tagged to their own ID
        # No more leaking NULL/global notifications to students
        if include_read == "false":
            rows = conn.execute("SELECT * FROM notifications WHERE student_id = ? AND read = 0 ORDER BY id DESC LIMIT 50", (student_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM notifications WHERE student_id = ? ORDER BY id DESC LIMIT 50", (student_id,)).fetchall()
    else:
        # Admin/Faculty/Mentor see all notifications
        if include_read == "false":
            rows = conn.execute("SELECT * FROM notifications WHERE read = 0 ORDER BY id DESC LIMIT 100").fetchall()
        else:
            rows = conn.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 100").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/notifications/<int:notif_id>/read", methods=["PUT"])
def mark_notification_read(notif_id):
    """Mark a single notification as read (soft delete)."""
    conn = db.get_db_connection()
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Notification #{notif_id} marked as read."})


@app.route("/api/notifications/read-all", methods=["PUT"])
def mark_all_notifications_read():
    """Mark all notifications as read. Optionally filter by student_id."""
    data = request.get_json() or {}
    student_id = data.get("student_id")
    conn = db.get_db_connection()
    if student_id:
        conn.execute("UPDATE notifications SET read = 1 WHERE student_id = ?", (student_id,))
    else:
        conn.execute("UPDATE notifications SET read = 1")
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "All notifications marked as read."})


@app.route("/api/notifications/<int:notif_id>", methods=["DELETE"])
def delete_notification(notif_id):
    """Hard delete a single notification."""
    conn = db.get_db_connection()
    conn.execute("DELETE FROM notifications WHERE id = ?", (notif_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Notification #{notif_id} deleted."})


@app.route("/api/notifications/delete-all", methods=["DELETE"])
def delete_all_notifications():
    """Hard delete all notifications. Optionally filter by student_id."""
    student_id = request.args.get("student_id")
    conn = db.get_db_connection()
    if student_id:
        conn.execute("DELETE FROM notifications WHERE student_id = ?", (student_id,))
    else:
        conn.execute("DELETE FROM notifications")
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "All notifications deleted."})


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
                "attendance": st.get("attendance", 0),
                "cgpa": st.get("cgpa", 0.0),
                "lms_score": st.get("lms_score", st.get("attendance", 0)),
                "course": st.get("course", "CSE"),
                "year": st.get("year", "2nd Year"),
                "risk": st.get("risk", 0),
                "anomalies": detected
            })
    conn.close()
    return jsonify(anomalies_list)


# =====================================================
# 9. BULK CSV IMPORT
# =====================================================

@app.route("/api/students/import", methods=["POST"])
def import_students_csv():
    """Bulk import students from CSV. Expects multipart/form-data with 'file' field.
    Required columns: id, name. Optional: gender, course, year, cgpa, credits, attendance, lms_score,
    father, mother, mother_tongue, place, region, country.
    Missing optional fields get sensible defaults."""
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded."}), 400

    file = request.files['file']
    filename = file.filename.lower()

    try:
        if filename.endswith('.csv'):
            content = file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(file.read()), read_only=True)
                ws = wb.active
                headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
                rows = []
                for row in ws.iter_rows(min_row=2):
                    row_dict = {}
                    for i, cell in enumerate(row):
                        if i < len(headers) and headers[i]:
                            row_dict[str(headers[i]).strip()] = cell.value
                    rows.append(row_dict)
            except ImportError:
                return jsonify({"success": False, "message": "Excel support requires openpyxl. Please use CSV format."}), 400
        else:
            return jsonify({"success": False, "message": "Unsupported file format. Use .csv or .xlsx"}), 400

        if not rows:
            return jsonify({"success": False, "message": "File is empty or has no data rows."}), 400

        thresholds = _get_thresholds()
        conn = db.get_db_connection()
        imported = 0
        skipped = 0
        errors = []

        for i, row in enumerate(rows):
            row = {k.strip().lower().replace(' ', '_'): (str(v).strip() if v is not None else '') for k, v in row.items()}
            student_id = row.get('id', row.get('student_id', '')).strip()
            name = row.get('name', row.get('full_name', row.get('student_name', ''))).strip()

            if not student_id or not name:
                skipped += 1
                errors.append(f"Row {i+2}: Missing required field 'id' or 'name'")
                continue

            gender = row.get('gender', 'Male') or 'Male'
            course = row.get('course', 'CSE') or 'CSE'
            year = row.get('year', '2nd Year') or '2nd Year'
            try:
                cgpa = float(row.get('cgpa', 7.5) or 7.5)
            except (ValueError, TypeError):
                cgpa = 7.5
            try:
                credits = int(float(row.get('credits', 24) or 24))
            except (ValueError, TypeError):
                credits = 24
            try:
                attendance = int(float(row.get('attendance', 80) or 80))
            except (ValueError, TypeError):
                attendance = 80
            try:
                lms_score = int(float(row.get('lms_score', attendance) or attendance))
            except (ValueError, TypeError):
                lms_score = attendance

            father = row.get('father', row.get("father's_name", 'N/A')) or 'N/A'
            mother = row.get('mother', row.get("mother's_name", 'N/A')) or 'N/A'
            mother_tongue = row.get('mother_tongue', row.get('mothertongue', 'Telugu')) or 'Telugu'
            place = row.get('place', row.get('city', 'Hyderabad')) or 'Hyderabad'
            region = row.get('region', 'South India') or 'South India'
            country = row.get('country', 'India') or 'India'

            risk_info = ai_engine.calculate_risk_score(attendance, cgpa, lms_score, **thresholds)
            risk_score = risk_info["risk_score"]

            try:
                conn.execute("""
                    INSERT OR IGNORE INTO students (id, name, gender, course, year, cgpa, credits, attendance, lms_score, risk, father, mother, mother_tongue, place, region, country)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (student_id, name, gender, course, year, cgpa, credits, attendance, lms_score, risk_score, father, mother, mother_tongue, place, region, country))
                # Create student user account
                conn.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?,?)", (
                    student_id, student_id, "student", name, student_id, None, None
                ))
                imported += 1
            except Exception as e:
                skipped += 1
                errors.append(f"Row {i+2} ({student_id}): {str(e)}")

        conn.commit()
        conn.close()
        return jsonify({
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "total": len(rows),
            "errors": errors[:10],
            "message": f"Imported {imported} students. {skipped} skipped."
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Import failed: {str(e)}"}), 500


@app.route("/api/users/import", methods=["POST"])
def import_users_csv():
    """Bulk import faculty/mentors from CSV. Admin only.
    Required columns: id, role. Optional: display_name, subjects, extra_roles."""
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded."}), 400

    file = request.files['file']
    filename = file.filename.lower()

    try:
        if filename.endswith('.csv'):
            content = file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(file.read()), read_only=True)
                ws = wb.active
                headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
                rows = []
                for row in ws.iter_rows(min_row=2):
                    row_dict = {}
                    for i, cell in enumerate(row):
                        if i < len(headers) and headers[i]:
                            row_dict[str(headers[i]).strip()] = cell.value
                    rows.append(row_dict)
            except ImportError:
                return jsonify({"success": False, "message": "Excel support requires openpyxl. Please use CSV format."}), 400
        else:
            return jsonify({"success": False, "message": "Unsupported file format. Use .csv or .xlsx"}), 400

        if not rows:
            return jsonify({"success": False, "message": "File is empty."}), 400

        conn = db.get_db_connection()
        imported = 0
        skipped = 0
        errors = []

        for i, row in enumerate(rows):
            row = {k.strip().lower().replace(' ', '_'): (str(v).strip() if v is not None else '') for k, v in row.items()}
            user_id = row.get('id', row.get('user_id', '')).strip()
            role = row.get('role', 'mentor').strip().lower()

            if not user_id:
                skipped += 1
                errors.append(f"Row {i+2}: Missing 'id'")
                continue

            if role not in ('faculty', 'mentor', 'admin'):
                role = 'mentor'

            display_name = row.get('display_name', row.get('name', user_id)) or user_id
            password = row.get('password', user_id) or user_id
            subjects = row.get('subjects', row.get('assigned_subjects', '')) or ''
            extra_roles = row.get('extra_roles', row.get('responsibilities', '')) or ''

            try:
                conn.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?,?)", (
                    user_id, password, role, display_name, None, subjects, extra_roles
                ))
                imported += 1
            except Exception as e:
                skipped += 1
                errors.append(f"Row {i+2} ({user_id}): {str(e)}")

        conn.commit()
        conn.close()
        return jsonify({
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "total": len(rows),
            "errors": errors[:10],
            "message": f"Imported {imported} users. {skipped} skipped."
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Import failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
