# =====================================================
# AGENT.PY
# Truly Autonomous Academic Engagement & Intervention Agent
# With per-subject academic context for precise diagnosis
# =====================================================

import datetime
import json
import db
import agent_tools
from llm_provider import LLMProvider

BASE_AGENT_RULES = """
[CORE IDENTITY & OPERATING DIRECTIVES]
You are the AI Academic Mentoring & Intervention Agent for "EduStudent Sight" (College & Education Platform).
Your mission is to empower faculty mentors and department heads by analyzing student engagement indicators and recommending supportive, personalized academic guidance.

[SYSTEM BEHAVIOR RULES]
1. Domain Scope: Analyze BOTH overall metrics AND per-subject data (attendance per subject, internal marks, external marks, assignment scores, grades).
2. Subject-Specific Diagnosis: When a student is struggling, identify WHICH SPECIFIC SUBJECTS are causing the issue. Example: "Arjun needs DBMS tutoring — Internal: 8/30, Subject Attendance: 55%."
3. Tone & Style: Be encouraging, objective, professional, and structured. Use Markdown formatting.
4. Context Awareness: You have access to the real-time student cohort database including per-subject breakdowns and extracurricular activities.
5. Actionability: Recommend subject-specific mentoring, peer tutoring, and targeted study plans.
6. Extracurricular Awareness: Consider student clubs, sports, hackathons when assessing engagement and suggesting balanced interventions.
"""

class AcademicInterventionAgent:
    def __init__(self):
        self.tools = {
            "schedule_mentor": agent_tools.tool_schedule_mentor_session,
            "generate_study_plan": agent_tools.tool_generate_personalized_study_plan,
            "dispatch_attendance_alert": agent_tools.tool_dispatch_attendance_alert,
            "assign_peer_tutor": agent_tools.tool_assign_peer_tutor
        }

    def _get_subject_context(self, student_id):
        """Fetches per-subject marks for a student and formats them as readable text."""
        conn = db.get_db_connection()
        marks = conn.execute("""
            SELECT sm.subject_code, s.short_name, sm.attendance, sm.internal_marks, 
                   sm.external_marks, sm.assignment_score, sm.grade
            FROM subject_marks sm
            JOIN subjects s ON sm.subject_code = s.code
            WHERE sm.student_id = ?
        """, (student_id,)).fetchall()
        activities = conn.execute("""
            SELECT e.name, e.category, sa.role, sa.notes
            FROM student_activities sa
            JOIN extracurriculars e ON sa.activity_id = e.id
            WHERE sa.student_id = ?
        """, (student_id,)).fetchall()
        conn.close()

        lines = []
        for m in marks:
            lines.append(f"  {m['short_name']}: Attd={m['attendance']}%, Internal={m['internal_marks']}/30, External={m['external_marks']}/70, Assignment={m['assignment_score']}%, Grade={m['grade']}")

        act_lines = []
        for a in activities:
            note = f" ({a['notes']})" if a['notes'] else ""
            act_lines.append(f"  {a['category']}: {a['name']} — Role: {a['role']}{note}")

        subject_text = "\n".join(lines) if lines else "  No subject data available."
        activity_text = "\n".join(act_lines) if act_lines else "  No extracurricular activities."
        return subject_text, activity_text

    def run_autonomous_cycle(self):
        """Runs full perception-reasoning-action loop over all students."""
        conn = db.get_db_connection()
        settings = db.get_system_settings()
        rows = conn.execute("SELECT * FROM students").fetchall()
        students = [dict(r) for r in rows]
        conn.close()

        execution_traces = []
        today = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for student in students:
            attd = float(student.get("attendance", 100))
            cgpa = float(student.get("cgpa", 8.0))
            lms = float(student.get("lms_score", 80))
            risk = int(student.get("risk", 0))

            if risk >= 30 or attd < 75 or cgpa < 7.0:
                trace = {
                    "timestamp": today,
                    "student_id": student["id"],
                    "student_name": student["name"],
                    "perceptions": {
                        "attendance": f"{attd}%",
                        "cgpa": cgpa,
                        "lms_score": f"{lms}%",
                        "risk_score": f"{risk}%"
                    },
                    "reasoning": "",
                    "tools_called": []
                }

                # Get per-subject context
                subject_text, activity_text = self._get_subject_context(student["id"])

                prompt = (
                    f"Student Academic Review: {student['name']} (ID: {student['id']})\n"
                    f"Overall: Attendance={attd}%, CGPA={cgpa}, LMS={lms}%, Risk={risk}%\n\n"
                    f"Per-Subject Breakdown:\n{subject_text}\n\n"
                    f"Extracurricular Activities:\n{activity_text}\n\n"
                    "Task: Identify which specific subjects need attention and recommend supportive faculty mentoring in 2-3 bullet points."
                )
                system_prompt = (
                    f"{BASE_AGENT_RULES}\n"
                    "Provide a concise subject-specific academic review and suggest targeted mentor actions."
                )

                diagnosis = LLMProvider.call_ai(prompt, system_prompt, settings)
                trace["reasoning"] = diagnosis

                # Autonomous Tool Calls
                if attd < 70:
                    res = self.tools["dispatch_attendance_alert"](student["id"], student["name"], attd)
                    trace["tools_called"].append({"tool": "dispatch_attendance_alert", "result": res})
                    res_meet = self.tools["schedule_mentor"](student["id"], student["name"], urgency="Critical", proposed_topics="Attendance Support")
                    trace["tools_called"].append({"tool": "schedule_mentor", "result": res_meet})
                elif cgpa < 7.5:
                    res_plan = self.tools["generate_study_plan"](student["id"], student["name"], weak_areas="Core Academic Subjects")
                    trace["tools_called"].append({"tool": "generate_study_plan", "result": res_plan})
                    res_tutor = self.tools["assign_peer_tutor"](student["id"], student["name"], tutor_name="Sneha Rao", subject=student["course"])
                    trace["tools_called"].append({"tool": "assign_peer_tutor", "result": res_tutor})
                elif risk >= 30:
                    res_meet = self.tools["schedule_mentor"](student["id"], student["name"], urgency="Moderate", proposed_topics="Progress Review")
                    trace["tools_called"].append({"tool": "schedule_mentor", "result": res_meet})

                log_conn = db.get_db_connection()
                log_conn.execute("""
                    INSERT INTO agent_logs (student_id, student_name, timestamp, diagnosis, actions_taken)
                    VALUES (?, ?, ?, ?, ?)
                """, (student["id"], student["name"], today, trace["reasoning"], json.dumps(trace["tools_called"])))
                log_conn.commit()
                log_conn.close()

                execution_traces.append(trace)

        return execution_traces

    def chat_query(self, user_query, history=None, provider_override=None):
        """Answers interactive queries with full cohort + per-subject context."""
        if history is None:
            history = []

        conn = db.get_db_connection()
        settings = db.get_system_settings()
        students = conn.execute("SELECT id, name, course, year, attendance, cgpa, lms_score, risk FROM students").fetchall()

        # Build rich context with per-subject data
        student_lines = []
        for s in students:
            subj_text, act_text = self._get_subject_context(s["id"])
            student_lines.append(
                f"- {s['name']} (ID: {s['id']}, {s['course']} {s['year']}): "
                f"Attendance={s['attendance']}%, CGPA={s['cgpa']}, LMS={s['lms_score']}%, Risk={s['risk']}%\n"
                f"  Subjects:\n{subj_text}\n"
                f"  Activities:\n{act_text}"
            )
        conn.close()

        if provider_override:
            settings["ai_provider"] = provider_override

        roster_context = "\n".join(student_lines)

        system_prompt = (
            f"{BASE_AGENT_RULES}\n"
            f"[LIVE STUDENT ROSTER WITH PER-SUBJECT DATA]\n{roster_context}\n\n"
            "Provide insightful, subject-specific answers for faculty mentors."
        )

        return LLMProvider.call_ai(user_query, system_prompt, settings, history)
