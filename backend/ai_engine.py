# =====================================================
# AI_ENGINE.PY
# Explainable Academic Risk Calculation & Anomaly Detection
# =====================================================

def calculate_risk_score(attendance, cgpa, lms_score):
    """
    Computes an explainable academic risk score based on multi-signal indicators.
    Formula:
      Engagement = (Attendance * 0.40) + (CGPA_scaled * 0.35) + (LMS_Score * 0.25)
      Risk Score = 100 - Engagement
    """
    attendance = float(attendance or 0)
    cgpa = float(cgpa or 0)
    lms_score = float(lms_score or 0)

    # Scale CGPA from 0-10 scale to 0-100 scale
    cgpa_scaled = cgpa * 10.0

    # Calculate weighted engagement index
    engagement_index = (attendance * 0.40) + (cgpa_scaled * 0.35) + (lms_score * 0.25)

    # Risk is inverse of engagement
    risk_score = round(max(0, min(100, 100.0 - engagement_index)))

    # Determine risk category
    if risk_score >= 60:
        risk_level = "High Risk"
    elif risk_score >= 30:
        risk_level = "Moderate Warning"
    else:
        risk_level = "Low Risk"

    # Generate explainable reasons list
    reasons = []
    if attendance < 75:
        reasons.append(f"Attendance ({attendance}%) is below mandatory 75% cutoff.")
    if cgpa < 7.5:
        reasons.append(f"Academic performance (CGPA: {cgpa}) indicates learning gap.")
    if lms_score < 60:
        reasons.append(f"Low online LMS engagement score ({lms_score}%).")
    if not reasons:
        reasons.append("Academic signals are healthy with good engagement.")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons
    }

def detect_student_anomalies(student_dict):
    """
    Checks if a student has any engagement anomaly triggers.
    """
    anomalies = []
    attd = float(student_dict.get("attendance", 0))
    lms = float(student_dict.get("lms_score", 0))

    if attd < 70:
        anomalies.append({
            "type": "Critical Attendance Drop",
            "message": f"Attendance is severely low at {attd}%. Immediate mentor call needed.",
            "severity": "High"
        })

    if lms < 55:
        anomalies.append({
            "type": "LMS Inactivity",
            "message": f"Inactivity streak detected on LMS (Score: {lms}%).",
            "severity": "Medium"
        })

    return anomalies
