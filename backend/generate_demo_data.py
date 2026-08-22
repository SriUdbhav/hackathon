#!/usr/bin/env python3
"""
GENERATE_DEMO_DATA.PY
Generates comprehensive demo CSV datasets for EduStudent Sight:
1. data/demo_students_1000.csv (1000 complete student profiles with credentials)
2. data/demo_faculty_and_mentors.csv (Faculty and mentor accounts with assigned subjects & roles)
3. data/demo_admins.csv (3 System Administrators)
4. data/demo_master_credentials.csv (Unified master access sheet)
"""

import os
import csv
import random

# Ensure output directory exists
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Random Seed for reproducible, realistic demo data
random.seed(42)

FIRST_NAMES_MALE = [
    "Aarav", "Arjun", "Aditya", "Sai", "Rahul", "Rohan", "Vikram", "Hemanth", "Karthik", "Varun",
    "Gautam", "Naveen", "Abhishek", "Pranav", "Siddharth", "Manish", "Gopi", "Srikanth", "Ankit", "Tarun",
    "Sanjay", "Deepak", "Rakesh", "Vishal", "Akash", "Suraj", "Ajay", "Harish", "Prakash", "Lokesh",
    "Yash", "Kunal", "Mayank", "Nikhil", "Shreyas", "Tanmay", "Dev", "Dhruv", "Ishan", "Samar"
]

FIRST_NAMES_FEMALE = [
    "Ananya", "Sneha", "Pooja", "Priya", "Divya", "Kavya", "Deepika", "Shreya", "Rhea", "Ishita",
    "Tanvi", "Meera", "Swati", "Neha", "Aishwarya", "Shruti", "Anushka", "Samyuktha", "Keerthi", "Harini",
    "Lavanya", "Bhavana", "Pallavi", "Preethi", "Ritu", "Aditi", "Simran", "Nandini", "Komal", "Vaishnavi",
    "Megha", "Ritika", "Payal", "Ankita", "Shalini", "Sunita", "Archana", "Rashmi", "Soundarya", "Pavitra"
]

LAST_NAMES = [
    "Reddy", "Patel", "Sharma", "Verma", "Rao", "Gupta", "Nair", "Iyer", "Kumar", "Singh",
    "Chowdary", "Mishra", "Joshi", "Menon", "Deshmukh", "Kulkarni", "Bose", "Das", "Chatterjee", "Banerjee",
    "Bhat", "Hegde", "Shetty", "Pillai", "Chauhan", "Agarwal", "Mehta", "Jain", "Shah", "Kapoor",
    "Malhotra", "Saxena", "Pandey", "Tripathi", "Dubey", "Yadav", "Sinha", "Ghosh", "Naidu", "Roy"
]

PLACES_DATA = [
    ("Hyderabad", "Telangana", "Telugu"),
    ("Visakhapatnam", "Andhra Pradesh", "Telugu"),
    ("Vijayawada", "Andhra Pradesh", "Telugu"),
    ("Warangal", "Telangana", "Telugu"),
    ("Bengaluru", "Karnataka", "Kannada"),
    ("Mysuru", "Karnataka", "Kannada"),
    ("Chennai", "Tamil Nadu", "Tamil"),
    ("Coimbatore", "Tamil Nadu", "Tamil"),
    ("Madurai", "Tamil Nadu", "Tamil"),
    ("Kochi", "Kerala", "Malayalam"),
    ("Thiruvananthapuram", "Kerala", "Malayalam"),
    ("Mumbai", "Maharashtra", "Marathi"),
    ("Pune", "Maharashtra", "Marathi"),
    ("Nagpur", "Maharashtra", "Marathi"),
    ("Ahmedabad", "Gujarat", "Gujarati"),
    ("Surat", "Gujarat", "Gujarati"),
    ("Jaipur", "Rajasthan", "Hindi"),
    ("Delhi", "Delhi NCR", "Hindi"),
    ("Noida", "Uttar Pradesh", "Hindi"),
    ("Lucknow", "Uttar Pradesh", "Hindi"),
    ("Kolkata", "West Bengal", "Bengali"),
    ("Bhubaneswar", "Odisha", "Odia"),
    ("Patna", "Bihar", "Hindi"),
    ("Chandigarh", "Punjab", "Punjabi"),
    ("Indore", "Madhya Pradesh", "Hindi")
]

COURSES = [
    ("Computer Science & Engineering", "B.Tech CSE", ["2nd Year", "3rd Year", "4th Year"]),
    ("Information Technology", "B.Tech IT", ["2nd Year", "3rd Year"]),
    ("Electronics & Communication", "B.Tech ECE", ["2nd Year", "3rd Year"]),
    ("Artificial Intelligence & Data Science", "B.Tech AI&DS", ["2nd Year", "3rd Year"]),
    ("Electrical & Electronics", "B.Tech EEE", ["2nd Year", "3rd Year"])
]


def generate_students(count=1000):
    students = []
    
    for i in range(1, count + 1):
        is_male = random.random() < 0.55
        first_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)
        full_name = f"{first_name} {last_name}"
        gender = "Male" if is_male else "Female"

        # Unique Student ID formatted realistically
        course_name, course_short, years = random.choice(COURSES)
        year = random.choice(years)
        year_prefix = "24" if year == "2nd Year" else ("23" if year == "3rd Year" else "22")
        dept_code = "CS" if "CS" in course_short else ("IT" if "IT" in course_short else ("EC" if "ECE" in course_short else ("AI" if "AI" in course_short else "EE")))
        student_id = f"{year_prefix}{dept_code}{str(i).zfill(4)}"

        # Realistic Demographic Background
        place_info = random.choice(PLACES_DATA)
        place, region, mother_tongue = place_info
        country = "India"

        # Parents
        father_first = random.choice(FIRST_NAMES_MALE)
        mother_first = random.choice(FIRST_NAMES_FEMALE)
        father = f"{father_first} {last_name}"
        mother = f"{mother_first} {last_name}"

        # Risk distribution: 12% High Risk, 28% Moderate Risk, 60% Low Risk
        cohort_tier = random.choices(["high_risk", "moderate", "healthy"], weights=[12, 28, 60])[0]

        if cohort_tier == "high_risk":
            attendance = random.randint(42, 68)
            cgpa = round(random.uniform(4.5, 6.4), 2)
            lms_score = random.randint(30, 55)
            credits = random.randint(18, 22)
        elif cohort_tier == "moderate":
            attendance = random.randint(69, 78)
            cgpa = round(random.uniform(6.5, 7.7), 2)
            lms_score = random.randint(58, 76)
            credits = random.randint(22, 24)
        else:
            attendance = random.randint(79, 98)
            cgpa = round(random.uniform(7.8, 9.8), 2)
            lms_score = random.randint(78, 98)
            credits = 24

        # Explainable calculated risk score
        engagement = (attendance * 0.40) + (cgpa * 10 * 0.35) + (lms_score * 0.25)
        risk_score = round(max(0, min(100, 100.0 - engagement)))

        # Contact & Credentials
        clean_name = f"{first_name.lower()}.{last_name.lower()}"
        email = f"{clean_name}.{student_id.lower()}@univ.edu"
        phone = f"+91 {random.randint(9000000000, 9999999999)}"
        password = f"{first_name}@{student_id[-4:]}"

        students.append({
            "id": student_id,
            "name": full_name,
            "gender": gender,
            "course": course_short,
            "year": year,
            "cgpa": cgpa,
            "credits": credits,
            "attendance": attendance,
            "lms_score": lms_score,
            "risk": risk_score,
            "father": father,
            "mother": mother,
            "mother_tongue": mother_tongue,
            "place": place,
            "region": region,
            "country": country,
            "email": email,
            "phone": phone,
            "password": password
        })

    return students


def generate_faculty():
    faculty_members = [
        ("FAC101", "Dr. Rajeshwar Sharma", "Male", "faculty", "Prof & Head, CSE", "CS201, CS202", "HOD, Academic Council", "r.sharma@univ.edu", "+91 9848011221", "Sharma@2026"),
        ("FAC102", "Dr. Ananya Mukhopadhyay", "Female", "faculty", "Associate Prof, CSE", "CS201, CS203", "Class Advisor (2nd Yr)", "a.mukherjee@univ.edu", "+91 9848011222", "Ananya@2026"),
        ("FAC103", "Prof. K. Venkatesh Rao", "Male", "faculty", "Assistant Prof, CSE", "CS202, CS204", "Lab Incharge - Systems", "k.venkatesh@univ.edu", "+91 9848011223", "Venkat@2026"),
        ("FAC104", "Dr. Preethi Sundaram", "Female", "faculty", "Associate Prof, Math", "MA201", "Exam Coordinator", "p.sundaram@univ.edu", "+91 9848011224", "Preethi@2026"),
        ("FAC105", "Prof. S. Ranganathan", "Male", "faculty", "Assistant Prof, CSE", "CS203, CS204", "Placement Faculty Lead", "s.rangan@univ.edu", "+91 9848011225", "Ranga@2026"),
        ("FAC106", "Dr. Kavita Joshi", "Female", "faculty", "Assistant Prof, AI&DS", "AI201, CS201", "AI Club Faculty Lead", "k.joshi@univ.edu", "+91 9848011226", "Kavita@2026"),
        ("FAC107", "Prof. Amit Verma", "Male", "faculty", "Assistant Prof, IT", "CS202, CS203", "Cybersecurity Cell Lead", "a.verma@univ.edu", "+91 9848011227", "Verma@2026"),
        ("FAC108", "Dr. Sunita Deshmukh", "Female", "faculty", "Professor, ECE", "EC201, EC202", "Dean Student Affairs Committee", "s.deshmukh@univ.edu", "+91 9848011228", "Sunita@2026"),
        ("FAC109", "Prof. G. Nageshwar Rao", "Male", "faculty", "Assistant Prof, CSE", "CS201, CS204", "Attendance Nodal Officer", "g.nageshwar@univ.edu", "+91 9848011229", "Nagesh@2026"),
        ("FAC110", "Dr. B. Radhika Reddy", "Female", "faculty", "Associate Prof, CSE", "CS202, MA201", "Curriculum Committee", "b.radhika@univ.edu", "+91 9848011230", "Radhika@2026")
    ]
    return faculty_members


def generate_mentors():
    mentors = [
        ("MEN201", "Dr. Snehalatha Devi", "Female", "mentor", "Lead Academic Counselor", "CS201, CS202, MA201", "Senior Counselor, Wellness Cell", "s.devi.counselor@univ.edu", "+91 9700011101", "Mentor@2026"),
        ("MEN202", "Prof. Vikramaditya Sen", "Male", "mentor", "Faculty Mentor & Advisor", "CS201, CS203", "Hostel 1 Warden, Peer Tutoring Lead", "v.sen.mentor@univ.edu", "+91 9700011102", "Vikram@2026"),
        ("MEN203", "Dr. M. Gayatri Rao", "Female", "mentor", "Retention & Remedial Mentor", "MA201, CS204", "Remedial Clinic Incharge", "m.gayatri@univ.edu", "+91 9700011103", "Gayatri@2026"),
        ("MEN204", "Prof. Sandeep Kulkarni", "Male", "mentor", "Student Career Mentor", "CS202, CS204", "Industry Mentorship Liaison", "s.kulkarni@univ.edu", "+91 9700011104", "Sandeep@2026"),
        ("MEN205", "Dr. P. Shobha Rani", "Female", "mentor", "First-Generation Scholar Mentor", "CS201, MA201", "Special Support Cell", "p.shobha@univ.edu", "+91 9700011105", "Shobha@2026")
    ]
    return mentors


def generate_admins():
    admins = [
        ("admin", "System Administrator", "Male", "admin", "Chief IT & Campus Systems Officer", "ALL", "Super Admin, Data Officer", "admin@univ.edu", "+91 9800000001", "admin123"),
        ("dean_academics", "Dr. M. Srinivasa Murthy", "Male", "admin", "Dean of Academic Affairs", "ALL", "Academic Head, Senate Chair", "dean.academics@univ.edu", "+91 9800000002", "Dean@2026"),
        ("coe_admin", "Dr. T. Hemalatha", "Female", "admin", "Controller of Examinations", "ALL", "Examination Controller, Results Head", "coe@univ.edu", "+91 9800000003", "ExamAdmin@2026")
    ]
    return admins


def main():
    print("[1/4] Generating 1,000 realistic student records...")
    students = generate_students(1000)
    student_csv_path = os.path.join(OUTPUT_DIR, "demo_students_1000.csv")
    with open(student_csv_path, mode="w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "id", "name", "gender", "course", "year", "cgpa", "credits",
            "attendance", "lms_score", "risk", "father", "mother",
            "mother_tongue", "place", "region", "country", "email", "phone", "password"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for s in students:
            writer.writerow(s)
    print(f" -> Successfully saved: {student_csv_path} ({len(students)} rows)")

    print("[2/4] Generating Faculty & Mentor records...")
    faculty_list = generate_faculty()
    mentor_list = generate_mentors()
    fac_mentor_csv_path = os.path.join(OUTPUT_DIR, "demo_faculty_and_mentors.csv")
    with open(fac_mentor_csv_path, mode="w", newline="", encoding="utf-8") as f:
        fieldnames = ["id", "display_name", "gender", "role", "designation", "subjects", "extra_roles", "email", "phone", "password"]
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        for row in faculty_list:
            writer.writerow(row)
        for row in mentor_list:
            writer.writerow(row)
    print(f" -> Successfully saved: {fac_mentor_csv_path} ({len(faculty_list) + len(mentor_list)} accounts)")

    print("[3/4] Generating 3 Administrator accounts...")
    admins_list = generate_admins()
    admins_csv_path = os.path.join(OUTPUT_DIR, "demo_admins.csv")
    with open(admins_csv_path, mode="w", newline="", encoding="utf-8") as f:
        fieldnames = ["id", "display_name", "gender", "role", "designation", "subjects", "extra_roles", "email", "phone", "password"]
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        for row in admins_list:
            writer.writerow(row)
    print(f" -> Successfully saved: {admins_csv_path} (3 accounts)")

    print("[4/4] Generating Master Credentials sheet (All Roles)...")
    master_csv_path = os.path.join(OUTPUT_DIR, "demo_master_credentials.csv")
    with open(master_csv_path, mode="w", newline="", encoding="utf-8") as f:
        fieldnames = ["user_id", "password", "role", "display_name", "email", "phone", "notes_or_context"]
        writer = csv.writer(f)
        writer.writerow(fieldnames)

        # 1. Admins
        for a in admins_list:
            writer.writerow([a[0], a[9], a[3], a[1], a[7], a[8], f"Admin Account — {a[4]}"])

        # 2. Faculty
        for fac in faculty_list:
            writer.writerow([fac[0], fac[9], fac[3], fac[1], fac[7], fac[8], f"Faculty ({fac[4]}) — Subjects: {fac[5]}"])

        # 3. Mentors
        for men in mentor_list:
            writer.writerow([men[0], men[9], men[3], men[1], men[7], men[8], f"Mentor ({men[4]}) — Focus: {men[5]}"])

        # 4. Students
        for s in students:
            writer.writerow([s["id"], s["password"], "student", s["name"], s["email"], s["phone"], f"{s['course']} {s['year']} | Risk: {s['risk']}% | Attd: {s['attendance']}%"])

    print(f" -> Successfully saved: {master_csv_path}")
    print("\n[COMPLETE] All demo CSV datasets have been generated successfully in 'data/'!")


if __name__ == "__main__":
    main()
