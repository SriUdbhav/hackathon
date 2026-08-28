# =====================================================
# AI_ENGINE.PY
# Explainable Academic Risk Calculation & Anomaly Detection
# Supports dynamic thresholds from Settings DB
# =====================================================

def calculate_risk_score(attendance, cgpa, lms_score,
                         attendance_threshold=75,
                         risk_cgpa_threshold=7.5,
                         lms_threshold=60,
                         assignment_threshold=70,
                         safe_risk_threshold=30,
                         high_risk_threshold=65,
                         critical_risk_threshold=80):
    """
    Computes an explainable academic risk score based on multi-signal indicators.
    Thresholds are fully dynamic and configurable in Settings.

    Formula:
      Engagement = (Attendance * 0.40) + (CGPA_scaled * 0.35) + (LMS_Score * 0.25)
      Risk Score = 100 - Engagement
    """
    attendance = float(attendance or 0)
    cgpa = float(cgpa or 0)
    lms_score = float(lms_score or 0)
    attendance_threshold = float(attendance_threshold)
    risk_cgpa_threshold = float(risk_cgpa_threshold)
    lms_threshold = float(lms_threshold)
    assignment_threshold = float(assignment_threshold)
    safe_risk_threshold = float(safe_risk_threshold)
    high_risk_threshold = float(high_risk_threshold)
    critical_risk_threshold = float(critical_risk_threshold)

    # Scale CGPA from 0-10 to 0-100
    cgpa_scaled = cgpa * 10.0

    # Weighted engagement index
    engagement_index = (attendance * 0.40) + (cgpa_scaled * 0.35) + (lms_score * 0.25)

    # Risk = inverse of engagement
    risk_score = round(max(0, min(100, 100.0 - engagement_index)))

    # Risk category based on configurable cutoffs
    if risk_score >= critical_risk_threshold:
        risk_level = "Critical Risk"
    elif risk_score >= high_risk_threshold:
        risk_level = "High Risk"
    elif risk_score > safe_risk_threshold:
        risk_level = "Moderate Warning"
    else:
        risk_level = "Low Risk (Safe)"

    # Explainable reasons (using dynamic thresholds)
    reasons = []
    if attendance < attendance_threshold:
        reasons.append(f"Attendance ({attendance}%) is below mandatory {attendance_threshold}% cutoff.")
    if cgpa < risk_cgpa_threshold:
        reasons.append(f"Academic performance (CGPA: {cgpa}) is below {risk_cgpa_threshold} benchmark.")
    if lms_score < lms_threshold:
        reasons.append(f"Online LMS engagement ({lms_score}%) is below {lms_threshold}% threshold.")
    if not reasons:
        reasons.append("Academic signals are healthy with good engagement.")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons
    }


def detect_student_anomalies(student_dict, subject_marks=None):
    """
    Checks if a student has engagement anomaly triggers.
    Now includes subject-level anomalies if subject_marks are provided.
    """
    anomalies = []
    attd = float(student_dict.get("attendance", 0))
    lms = float(student_dict.get("lms_score", 0))

    # Overall anomalies
    if attd < 70:
        anomalies.append({
            "type": "Critical Attendance Drop",
            "message": f"Overall attendance severely low at {attd}%. Immediate mentor action needed.",
            "severity": "High"
        })

    if lms < 55:
        anomalies.append({
            "type": "LMS Inactivity",
            "message": f"Inactivity streak detected on LMS platform (Score: {lms}%).",
            "severity": "Medium"
        })

    # Subject-level anomalies
    if subject_marks:
        for sm in subject_marks:
            sub_attd = int(sm.get("attendance", 0))
            internal = int(sm.get("internal_marks", 0))
            subject = sm.get("subject_code", "Unknown")

            if sub_attd < 60:
                anomalies.append({
                    "type": f"Subject Attendance Critical: {subject}",
                    "message": f"Attendance in {subject} is only {sub_attd}% — well below mandatory threshold.",
                    "severity": "High"
                })

            if internal < 12:  # Less than 40% of 30
                anomalies.append({
                    "type": f"Internal Exam Failure Risk: {subject}",
                    "message": f"Internal marks in {subject}: {internal}/30 — at risk of failing internal assessment.",
                    "severity": "High"
                })

    return anomalies
