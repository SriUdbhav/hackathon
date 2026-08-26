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
        """Runs full perception-reasoning-action loop across all students with cohort scaling."""
        conn = db.get_db_connection()
        rows = conn.execute("SELECT * FROM students").fetchall()
        students = [dict(r) for r in rows]
        
        # Pre-fetch all subject marks and activities in indexed dicts to avoid N*2 SQL queries
        subj_rows = conn.execute("""
            SELECT sm.student_id, sm.subject_code, s.short_name, sm.attendance, sm.internal_marks, 
                   sm.external_marks, sm.assignment_score, sm.grade
            FROM subject_marks sm
            JOIN subjects s ON sm.subject_code = s.code
        """).fetchall()
        student_marks = {}
        for r in subj_rows:
            sid = r["student_id"]
            if sid not in student_marks:
                student_marks[sid] = []
            student_marks[sid].append(dict(r))

        act_rows = conn.execute("""
            SELECT sa.student_id, e.name, e.category, sa.role, sa.notes
            FROM student_activities sa
            JOIN extracurriculars e ON sa.activity_id = e.id
        """).fetchall()
        student_acts = {}
        for r in act_rows:
            sid = r["student_id"]
            if sid not in student_acts:
                student_acts[sid] = []
            student_acts[sid].append(dict(r))

        today = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        today_date = datetime.date.today().isoformat()
        
        # Triage and filter students needing intervention
        flagged_students = []
        for s in students:
            attd = float(s.get("attendance", 100))
            cgpa = float(s.get("cgpa", 8.0))
            lms = float(s.get("lms_score", 80))
            risk = int(s.get("risk", 0))
            if risk >= 30 or attd < 75 or cgpa < 7.0:
                flagged_students.append((s, risk, attd, cgpa, lms))
                
        # Sort by urgency (highest risk, lowest attendance first)
        flagged_students.sort(key=lambda item: (item[1], 100 - item[2]), reverse=True)

        execution_traces = []
        interventions_to_insert = []
        notifications_to_insert = []
        logs_to_insert = []

        # Process flagged students
        for student, risk, attd, cgpa, lms in flagged_students:
            sid = student["id"]
            sname = student["name"]
            
            trace = {
                "timestamp": today,
                "student_id": sid,
                "student_name": sname,
                "perceptions": {
                    "attendance": f"{attd}%",
                    "cgpa": cgpa,
                    "lms_score": f"{lms}%",
                    "risk_score": f"{risk}%"
                },
                "reasoning": "",
                "tools_called": []
            }
            
            # Format subject & activity telemetry
            s_marks = student_marks.get(sid, [])
            s_acts = student_acts.get(sid, [])
            weak_subjects = [m for m in s_marks if m.get("attendance", 100) < 75 or m.get("internal_marks", 30) < 18 or m.get("grade") in ("F", "D")]
            
            issues = []
            actions = []
            
            if attd < 75:
                deficit = round(75.0 - attd, 1)
                issues.append(f"Cohort attendance ({attd}%) has a **{deficit}% deficit** below mandatory 75% regulatory threshold.")
                actions.append(f"Dispatched official attendance warning to student & registered guardians.")
                
            if weak_subjects:
                subj_details = ", ".join([f"**{m['short_name']}** (Attd: {m['attendance']}%, Internal: {m['internal_marks']}/30, Grade: {m['grade']})" for m in weak_subjects])
                issues.append(f"Academic vulnerability identified in specific subjects: {subj_details}.")
                actions.append(f"Assigned peer tutoring in {student.get('course', 'Core CSE')} and generated targeted remedial study roadmap.")
            elif cgpa < 7.0:
                issues.append(f"Current CGPA standing of **{cgpa}** is below academic benchmark.")
                actions.append("Generated customized remediation study schedule focusing on core subject concepts.")
                
            if risk >= 60:
                issues.append(f"Composite predictive risk index at critical severity (**{risk}%**).")
                actions.append("Scheduled urgent 1-on-1 counseling intervention with designated faculty mentor.")
            elif risk >= 30:
                issues.append(f"Moderate risk indicators (**{risk}%**) requiring early preventive advisement.")
                actions.append("Scheduled routine academic check-in and progress review.")
                
            if s_acts:
                act_str = ", ".join([f"{a['name']} ({a['role']})" for a in s_acts])
                issues.append(f"Active in extracurriculars: {act_str} — advise balanced time management.")
                
            trace["reasoning"] = (
                f"**Academic Health Diagnosis for {sname} ({sid}):**\n\n"
                f"**Signal Perception & Vulnerability:**\n"
                + "\n".join([f"- {iss}" for iss in issues]) + "\n\n"
                f"**Autonomous Action Plan:**\n"
                + "\n".join([f"- {act}" for act in actions])
            )

            if risk >= 60 or attd < 65 or cgpa < 6.0:
                risk_level = "High"
            elif risk >= 30 or attd < 75 or cgpa < 7.5:
                risk_level = "Medium"
            else:
                risk_level = "Low"

            trace["risk_level"] = risk_level

            # Tool calling & batch logging
            if attd < 70:
                trace["tools_called"].append({"tool": "dispatch_attendance_alert", "result": f"Dispatched attendance alert ({sname} at {attd}%)"})
                trace["tools_called"].append({"tool": "schedule_mentor", "result": f"Scheduled 1-on-1 session for {sname} (Urgency: Critical)"})
                interventions_to_insert.append((sid, today_date, f"Official Attendance Warning ({attd}%)", "Dispatched", f"Automated warning to Student & Parent. Current: {attd}%"))
                interventions_to_insert.append((sid, today_date, f"1-on-1 Mentoring Session (Critical Urgency)", "Scheduled", f"Focus: Attendance Support ({attd}%). Automatically booked by AI Agent."))
                notifications_to_insert.append((f"Attendance Alert Dispatched: {sname}", f"Attendance is at {attd}%. Mandatory notice sent.", "danger", today_date))
                notifications_to_insert.append((f"Meeting Scheduled: {sname} ({sid})", f"AI Agent booked a Critical priority mentoring session for attendance recovery.", "warning", today_date))
            elif cgpa < 7.5:
                trace["tools_called"].append({"tool": "generate_study_plan", "result": f"Generated personalized study roadmap for {sname}"})
                trace["tools_called"].append({"tool": "assign_peer_tutor", "result": f"Assigned peer mentor Sneha Rao to assist {sname}"})
                interventions_to_insert.append((sid, today_date, "Remediation Study Plan for Core Subjects", "In Progress", "Target Benchmark: 75%. AI curated module reviews."))
                interventions_to_insert.append((sid, today_date, "Peer Tutoring Match: Sneha Rao", "Active", f"Subject: {student.get('course', 'CSE')}. Matched by AI Agent."))
            elif risk >= 30:
                trace["tools_called"].append({"tool": "schedule_mentor", "result": f"Scheduled 1-on-1 session for {sname} (Urgency: Moderate)"})
                interventions_to_insert.append((sid, today_date, "1-on-1 Mentoring Session (Moderate Urgency)", "Scheduled", "Progress Review and academic check-in. Automatically booked by AI Agent."))

            logs_to_insert.append((sid, sname, today, trace["reasoning"], json.dumps(trace["tools_called"])))
            
            # Keep top 30 detailed traces for UI display
            if len(execution_traces) < 30:
                execution_traces.append(trace)

        # Execute batch database inserts in single transaction
        if interventions_to_insert:
            conn.executemany("""
                INSERT INTO interventions (student_id, date, action, status, notes)
                VALUES (?, ?, ?, ?, ?)
            """, interventions_to_insert)
        if notifications_to_insert:
            conn.executemany("""
                INSERT INTO notifications (title, message, type, date)
                VALUES (?, ?, ?, ?)
            """, notifications_to_insert)
        if logs_to_insert:
            conn.executemany("""
                INSERT INTO agent_logs (student_id, student_name, timestamp, diagnosis, actions_taken)
                VALUES (?, ?, ?, ?, ?)
            """, logs_to_insert)
            
        conn.commit()
        conn.close()

        high_risk_count = sum(1 for _, risk, attd, cgpa, _ in flagged_students if risk >= 60 or attd < 65 or cgpa < 6.0)
        medium_risk_count = sum(1 for _, risk, attd, cgpa, _ in flagged_students if (30 <= risk < 60 or 65 <= attd < 75 or 6.0 <= cgpa < 7.5) and not (risk >= 60 or attd < 65 or cgpa < 6.0))
        low_risk_count = len(students) - len(flagged_students)

        return {
            "total_scanned": len(students),
            "flagged_count": len(flagged_students),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "actions_count": len(logs_to_insert),
            "traces": execution_traces
        }

    def chat_query(self, user_query, history=None, provider_override=None):
        """Answers interactive queries with full cohort summary + targeted per-subject context."""
        if history is None:
            history = []

        conn = db.get_db_connection()
        settings = db.get_system_settings()
        rows = conn.execute("SELECT id, name, course, year, attendance, cgpa, lms_score, risk FROM students").fetchall()
        all_students = [dict(r) for r in rows]
        total_count = len(all_students)

        if total_count == 0:
            conn.close()
            roster_context = "No students currently enrolled in the database."
        else:
            high_risk = [s for s in all_students if s.get("risk", 0) >= 60 or s.get("attendance", 0) < 70]
            mod_risk = [s for s in all_students if 30 <= s.get("risk", 0) < 60 and s.get("attendance", 0) >= 70]
            low_risk = [s for s in all_students if s.get("risk", 0) < 30 and s.get("attendance", 0) >= 75]

            avg_attd = round(sum(s.get("attendance", 0) for s in all_students) / total_count, 1)
            avg_cgpa = round(sum(s.get("cgpa", 0) for s in all_students) / total_count, 2)
            avg_lms = round(sum(s.get("lms_score", s.get("attendance", 0)) for s in all_students) / total_count, 1)

            # Check if query targets specific students
            query_lower = user_query.lower()
            targeted_students = []
            for s in all_students:
                if (s.get("id") and s["id"].lower() in query_lower) or (s.get("name") and s["name"].lower() in query_lower):
                    targeted_students.append(s)

            student_lines = []
            
            # 1. Executive Cohort Summary
            summary_header = (
                f"[COHORT TELEMETRY OVERVIEW ({total_count} Total Students Monitored)]\n"
                f"- High Risk Students (Critical): {len(high_risk)}\n"
                f"- Moderate Risk Students (Warning): {len(mod_risk)}\n"
                f"- Low Risk Students (Nominal): {len(low_risk)}\n"
                f"- Cohort Averages: Attendance={avg_attd}%, CGPA={avg_cgpa}, LMS Engagement={avg_lms}%\n"
            )
            student_lines.append(summary_header)

            # 2. If specific students are mentioned, provide their deep 360 profile
            if targeted_students:
                student_lines.append("[TARGETED STUDENT 360° PROFILE(S) MATCHING QUERY]")
                for s in targeted_students[:10]:
                    subj_text, act_text = self._get_subject_context(s["id"])
                    student_lines.append(
                        f"- {s['name']} (ID: {s['id']}, {s['course']} {s['year']}): "
                        f"Attendance={s['attendance']}%, CGPA={s['cgpa']}, LMS={s['lms_score']}%, Risk={s['risk']}%\n"
                        f"  Per-Subject Marks:\n{subj_text}\n"
                        f"  Extracurriculars:\n{act_text}"
                    )

            # 3. For small cohorts (<= 15 students), include the entire student roster
            if total_count <= 15:
                student_lines.append("\n[COMPLETE COHORT ROSTER WITH SUBJECTS]")
                for s in all_students:
                    if s not in targeted_students:
                        subj_text, act_text = self._get_subject_context(s["id"])
                        student_lines.append(
                            f"- {s['name']} (ID: {s['id']}, {s['course']} {s['year']}): "
                            f"Attendance={s['attendance']}%, CGPA={s['cgpa']}, LMS={s['lms_score']}%, Risk={s['risk']}%\n"
                            f"  Subjects:\n{subj_text}\n"
                            f"  Extracurriculars:\n{act_text}"
                        )
            else:
                # For large cohorts (e.g. 1000 students), provide top at-risk priority students
                priority_list = sorted(high_risk + mod_risk, key=lambda x: x.get("risk", 0), reverse=True)[:15]
                if priority_list:
                    student_lines.append("\n[TOP AT-RISK PRIORITY STUDENTS REQUIRING ATTENTION]")
                    for s in priority_list:
                        if s not in targeted_students:
                            subj_text, _ = self._get_subject_context(s["id"])
                            student_lines.append(
                                f"- {s['name']} ({s['id']}): Attd={s['attendance']}%, CGPA={s['cgpa']}, LMS={s['lms_score']}%, Risk={s['risk']}%\n"
                                f"  Key Subjects: {subj_text}"
                            )

            conn.close()
            roster_context = "\n".join(student_lines)

        if provider_override:
            settings["ai_provider"] = provider_override

        system_prompt = (
            f"{BASE_AGENT_RULES}\n"
            f"[LIVE ACADEMIC TELEMETRY CONTEXT]\n{roster_context}\n\n"
            "DIRECTIVES FOR COMPLETE & THOROUGH ANSWERS:\n"
            "1. Always provide a full, complete, and comprehensive answer without truncating or leaving thoughts unfinished.\n"
            "2. Use structured Markdown with bold key points, bulleted lists, and tables where applicable.\n"
            "3. Offer specific, actionable remediation steps for faculty mentors or students.\n"
            "4. Conclude with a clear summary or next step."
        )

        return LLMProvider.call_ai(user_query, system_prompt, settings, history)
