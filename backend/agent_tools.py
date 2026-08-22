# =====================================================
# AGENT_TOOLS.PY
# Discrete Backend Tools that the AI Agent can Autonomously Call
# =====================================================

import datetime
import db

def tool_schedule_mentor_session(student_id, student_name, mentor_name="Faculty Mentor", urgency="High", proposed_topics="Academic Support"):
    """
    Tool 1: Autonomously books a 1-on-1 mentoring intervention in the system.
    """
    conn = db.get_db_connection()
    today = datetime.date.today().isoformat()
    action = f"1-on-1 Mentoring Session with {mentor_name} ({urgency} Urgency)"
    notes = f"Topics: {proposed_topics}. Automatically scheduled by AI Agent."

    conn.execute("""
        INSERT INTO interventions (student_id, date, action, status, notes)
        VALUES (?, ?, ?, 'Scheduled', ?)
    """, (student_id, today, action, notes))

    # Also log a notification for faculty
    conn.execute("""
        INSERT INTO notifications (title, message, type, date)
        VALUES (?, ?, 'warning', ?)
    """, (
        f"Meeting Scheduled: {student_name} ({student_id})",
        f"AI Agent booked a {urgency} priority mentoring session. Focus: {proposed_topics}.",
        today
    ))

    conn.commit()
    conn.close()
    return f"Successfully scheduled 1-on-1 session for {student_name} (Urgency: {urgency})"

def tool_generate_personalized_study_plan(student_id, student_name, weak_areas="Core Subjects", target_score="75%"):
    """
    Tool 2: Autonomously drafts and logs a customized remediation learning plan.
    """
    conn = db.get_db_connection()
    today = datetime.date.today().isoformat()
    action = f"Remediation Study Plan for {weak_areas}"
    notes = f"Target Benchmark: {target_score}. AI curated module reviews and practice sets."

    conn.execute("""
        INSERT INTO interventions (student_id, date, action, status, notes)
        VALUES (?, ?, ?, 'In Progress', ?)
    """, (student_id, today, action, notes))
    conn.commit()
    conn.close()
    return f"Generated personalized study roadmap for {student_name} focusing on {weak_areas}"

def tool_dispatch_attendance_alert(student_id, student_name, attendance_pct, recipient="Student & Parent"):
    """
    Tool 3: Dispatches official academic warning and logs notification.
    """
    conn = db.get_db_connection()
    today = datetime.date.today().isoformat()
    action = f"Official Attendance Warning ({attendance_pct}%)"
    notes = f"Dispatched via automated communication channel to {recipient}."

    conn.execute("""
        INSERT INTO interventions (student_id, date, action, status, notes)
        VALUES (?, ?, ?, 'Dispatched', ?)
    """, (student_id, today, action, notes))

    conn.execute("""
        INSERT INTO notifications (title, message, type, date)
        VALUES (?, ?, 'danger', ?)
    """, (
        f"Attendance Alert Dispatched: {student_name}",
        f"Attendance is at {attendance_pct}%. Mandatory notice sent.",
        today
    ))
    conn.commit()
    conn.close()
    return f"Dispatched attendance alert to {recipient} ({student_name} at {attendance_pct}%)"

def tool_assign_peer_tutor(struggling_student_id, student_name, tutor_name="Sneha Rao", subject="Core CSE"):
    """
    Tool 4: Matches a struggling student with a high-performing peer tutor.
    """
    conn = db.get_db_connection()
    today = datetime.date.today().isoformat()
    action = f"Peer Tutoring Match: {tutor_name}"
    notes = f"Subject: {subject}. Matched based on academic strengths."

    conn.execute("""
        INSERT INTO interventions (student_id, date, action, status, notes)
        VALUES (?, ?, ?, 'Active', ?)
    """, (struggling_student_id, today, action, notes))
    conn.commit()
    conn.close()
    return f"Assigned peer mentor {tutor_name} to assist {student_name} in {subject}"
