# =====================================================
# AGENT.PY
# Truly Autonomous Academic Engagement & Intervention Agent
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
1. Domain Scope: Combine Attendance %, CGPA, LMS platform activity streaks, and assignment completion into a holistic academic review.
2. Tone & Style: Be encouraging, objective, professional, and structured. Use Markdown formatting (bullet points, bold highlights).
3. Context Awareness: You are actively connected to the real-time student cohort database. Reference specific students and metrics directly.
4. Actionability: Suggest supportive faculty mentoring tools (e.g. Schedule 1-on-1 Mentoring, Assign Peer Tutor, Send Attendance Reminder).
"""

class AcademicInterventionAgent:
    def __init__(self):
        self.tools = {
            "schedule_mentor": agent_tools.tool_schedule_mentor_session,
            "generate_study_plan": agent_tools.tool_generate_personalized_study_plan,
            "dispatch_attendance_alert": agent_tools.tool_dispatch_attendance_alert,
            "assign_peer_tutor": agent_tools.tool_assign_peer_tutor
        }

    def run_autonomous_cycle(self):
        """
        Runs full perception-reasoning-action loop over all students in database.
        """
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

                # Phrased pedagogically to avoid small model RLHF safety false-positives
                prompt = (
                    f"Student Academic Review: {student['name']} (ID: {student['id']})\n"
                    f"Academic Indicators: Class Attendance = {attd}%, CGPA = {cgpa}, LMS Activity Score = {lms}%, Priority Index = {risk}%.\n\n"
                    "Task: Summarize academic areas needing attention and recommend supportive faculty mentoring steps in 2 bullet points."
                )
                system_prompt = (
                    f"{BASE_AGENT_RULES}\n"
                    "Provide a concise 2-bullet academic progress review and suggest supportive mentor actions."
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
                """, (
                    student["id"],
                    student["name"],
                    today,
                    trace["reasoning"],
                    json.dumps(trace["tools_called"])
                ))
                log_conn.commit()
                log_conn.close()

                execution_traces.append(trace)

        return execution_traces

    def chat_query(self, user_query, history=None, provider_override=None):
        """
        Answers interactive queries with current student dataset context and multi-turn history.
        """
        if history is None:
            history = []

        conn = db.get_db_connection()
        settings = db.get_system_settings()
        students = conn.execute("SELECT id, name, course, attendance, cgpa, risk FROM students").fetchall()
        conn.close()

        if provider_override:
            settings["ai_provider"] = provider_override

        students_summary = "\n".join([f"- {s['name']} (ID: {s['id']}): Attendance={s['attendance']}%, CGPA={s['cgpa']}, Risk Score={s['risk']}%" for s in students])
        
        system_prompt = (
            f"{BASE_AGENT_RULES}\n"
            f"[LIVE STUDENT ROSTER DATA IN DATABASE]\n{students_summary}\n\n"
            "Provide insightful, structured, and helpful answers for faculty mentors."
        )

        return LLMProvider.call_ai(user_query, system_prompt, settings, history)
