/* =====================================================
   EDU STUDENT SIGHT
   COMPLETE JAVASCRIPT
===================================================== */


/* =====================================================
   STUDENT DATA
===================================================== */

let students = JSON.parse(
    localStorage.getItem("eduStudents")
) || [

    {
        id: "25CS001",
        name: "V.Sri Udbhav",
        gender: "Male",
        course: "CSE",
        year: "2nd Year",
        cgpa: 8.2,
        credits: 24,
        attendance: 82,

        dob: "2007-06-15",

        father: "Ramesh Kumar",
        mother: "Lakshmi Kumar",

        motherTongue: "Telugu",

        region: "South India",
        place: "Hyderabad",
        country: "India",

        risk: 18
    },


    {
        id: "25CS002",
        name: "Y.Hemanth Reddy",
        gender: "Male",
        course: "CSE",
        year: "2nd Year",
        cgpa: 7.4,
        credits: 23,
        attendance: 68,

        dob: "2007-03-12",

        father: "Reddy Kumar",
        mother: "Padma",

        motherTongue: "Telugu",

        region: "South India",
        place: "Vijayawada",
        country: "India",

        risk: 55
    },


    {
        id: "25CS003",
        name: "T.Gopi",
        gender: "Male",
        course: "CSE",
        year: "2nd Year",
        cgpa: 7.8,
        credits: 22,
        attendance: 73,

        dob: "2007-09-20",

        father: "Srinivas",
        mother: "Anitha",

        motherTongue: "Telugu",

        region: "South India",
        place: "Guntur",
        country: "India",

        risk: 42
    },


    {
        id: "25CS004",
        name: "Sneha Rao",
        gender: "Female",
        course: "CSE",
        year: "2nd Year",
        cgpa: 8.7,
        credits: 25,
        attendance: 91,

        dob: "2007-11-03",

        father: "Rao Kumar",
        mother: "Sunitha",

        motherTongue: "Telugu",

        region: "South India",
        place: "Hyderabad",
        country: "India",

        risk: 8
    },


    {
        id: "25CS005",
        name: "Arjun Patel",
        gender: "Male",
        course: "CSE",
        year: "2nd Year",
        cgpa: 6.9,
        credits: 20,
        attendance: 61,

        dob: "2007-01-28",

        father: "Mahesh Patel",
        mother: "Kavitha",

        motherTongue: "Hindi",

        region: "West India",
        place: "Mumbai",
        country: "India",

        risk: 72
    }

];


function saveStudents() {

    localStorage.setItem(
        "eduStudents",
        JSON.stringify(students)
    );

}


/* =====================================================
   DOM
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const app =
    document.getElementById("app");

const pageContent =
    document.getElementById("pageContent");

const sidebar =
    document.getElementById("sidebar");


/* =====================================================
   LOGIN
===================================================== */

const loginForm =
    document.getElementById("loginForm");


function showApp() {

    loginPage.classList.add("d-none");

    app.classList.remove("d-none");

    renderPage("dashboard");

}


function logout() {

    localStorage.removeItem("eduLoggedIn");

    location.reload();

}


if (
    localStorage.getItem("eduLoggedIn") === "true"
) {

    showApp();

}


loginForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const email =
            document.getElementById(
                "loginEmail"
            ).value.trim();

        const password =
            document.getElementById(
                "loginPassword"
            ).value;

        const remember =
            document.getElementById(
                "rememberMe"
            ).checked;

        const error =
            document.getElementById(
                "loginError"
            );


        if (
            email === "info@vignan.ac.in" &&
            password === "vucse"
        ) {

            if (remember) {

                localStorage.setItem(
                    "eduLoggedIn",
                    "true"
                );

            } else {

                sessionStorage.setItem(
                    "eduLoggedIn",
                    "true"
                );

            }

            showApp();

        } else {

            error.textContent =
                "Invalid email or password.";

        }

    }
);


/* =====================================================
   PASSWORD TOGGLE
===================================================== */

document
    .getElementById("passwordToggle")
    .addEventListener(
        "click",
        function() {

            const password =
                document.getElementById(
                    "loginPassword"
                );

            const icon =
                this.querySelector("i");


            if (
                password.type === "password"
            ) {

                password.type = "text";

                icon.className =
                    "bi bi-eye-slash";

            } else {

                password.type = "password";

                icon.className =
                    "bi bi-eye";

            }

        }
    );


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        logout
    );


/* =====================================================
   SIDEBAR TOGGLE
===================================================== */

document
    .getElementById("sidebarToggle")
    .addEventListener(
        "click",
        function() {

            if (
                window.innerWidth <= 750
            ) {

                sidebar.classList.toggle(
                    "mobile-open"
                );

            } else {

                sidebar.classList.toggle(
                    "collapsed"
                );

            }

        }
    );


/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-item")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    this.classList.add(
                        "active"
                    );


                    const page =
                        this.dataset.page;

                    renderPage(page);


                    if (
                        window.innerWidth <= 750
                    ) {

                        sidebar.classList.remove(
                            "mobile-open"
                        );

                    }

                }
            );

        }
    );


/* =====================================================
   PAGE RENDERER
===================================================== */

function renderPage(page) {

    switch(page) {

        case "dashboard":
            renderDashboard();
            break;

        case "students":
            renderStudents();
            break;

        case "analytics":
            renderAnalytics();
            break;

        case "engagement":
            renderEngagement();
            break;

        case "mentor":
            renderMentor();
            break;

        case "anomalies":
            renderAnomalies();
            break;

        case "student360":
            renderStudent360();
            break;

        case "aiagent":
            renderAIAgent();
            break;

        case "notifications":
            renderNotifications();
            break;

        case "reports":
            renderReports();
            break;

        case "settings":
            renderSettings();
            break;

        default:
            renderDashboard();

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {

    const male =
        students.filter(
            s => s.gender === "Male"
        ).length;

    const female =
        students.filter(
            s => s.gender === "Female"
        ).length;

    const total =
        students.length;


    const avgCGPA =
        students.reduce(
            (sum,s) =>
                sum + Number(s.cgpa),
            0
        ) / (total || 1);


    const avgAttendance =
        students.reduce(
            (sum,s) =>
                sum + Number(s.attendance),
            0
        ) / (total || 1);


    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                ACADEMIC OVERVIEW
            </span>

            <h1>
                Dashboard
            </h1>

            <p>
                AI-powered view of student academic
                health, engagement and intervention.
            </p>

        </div>


        <div class="stat-grid">

            <div class="stat-card">

                <div class="stat-icon">
                    <i class="bi bi-people"></i>
                </div>

                <span>Total Students</span>

                <h2>${total}</h2>

                <small>
                    Active student population
                </small>

            </div>


            <div class="stat-card">

                <div class="stat-icon">
                    <i class="bi bi-mortarboard"></i>
                </div>

                <span>Average CGPA</span>

                <h2>
                    ${avgCGPA.toFixed(2)}
                </h2>

                <small>
                    Academic performance
                </small>

            </div>


            <div class="stat-card">

                <div class="stat-icon">
                    <i class="bi bi-calendar-check"></i>
                </div>

                <span>Average Attendance</span>

                <h2>
                    ${Math.round(avgAttendance)}%
                </h2>

                <small>
                    Across all students
                </small>

            </div>


            <div class="stat-card">

                <div class="stat-icon">
                    <i class="bi bi-stars"></i>
                </div>

                <span>AI Risk Alerts</span>

                <h2>
                    ${students.filter(s => s.risk >= 40).length}
                </h2>

                <small>
                    Requires attention
                </small>

            </div>

        </div>


        <div class="two-column">

            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Student performance
                        </h2>

                        <p>
                            AI calculated academic health
                        </p>

                    </div>

                </div>


                <div class="circular-score">

                    <strong>
                        ${Math.round(avgAttendance)}%
                    </strong>

                </div>


                <div class="health-label">

                    <h3>
                        Overall academic health
                    </h3>

                    <p>
                        Combined attendance and
                        academic performance indicator.
                    </p>

                </div>

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Student Gender
                        </h2>

                        <p>
                            Current student population
                        </p>

                    </div>

                </div>


                <div class="gender-cards">

                    <div class="gender-card male-card">

                        <div class="gender-avatar male-avatar">
                            👨🏻‍🎓
                        </div>

                        <div>

                            <span class="gender-number">
                                ${male}
                            </span>

                            <span class="gender-name">
                                Male
                            </span>

                        </div>

                    </div>


                    <div class="gender-card female-card">

                        <div class="gender-avatar female-avatar">
                            👩🏻‍🎓
                        </div>

                        <div>

                            <span class="gender-number">
                                ${female}
                            </span>

                            <span class="gender-name">
                                Female
                            </span>

                        </div>

                    </div>

                </div>


                <div class="gender-insights">

                    <div class="insight-heading">

                        <div>

                            <span class="eyebrow">
                                GENDER INSIGHTS
                            </span>

                            <h3>
                                Population analysis
                            </h3>

                        </div>

                        <p>
                            Total: ${total}
                        </p>

                    </div>


                    <div class="gender-statistics">

                        <div class="gender-stat">

                            <div class="stat-top">

                                <span>
                                    Male students
                                </span>

                                <strong>
                                    ${
                                        total
                                        ? Math.round(
                                            male /
                                            total *
                                            100
                                        )
                                        : 0
                                    }%
                                </strong>

                            </div>

                            <div class="progress-bar-custom">

                                <div
                                    class="progress-fill male-progress"
                                    style="
                                        width:${
                                            total
                                            ? male /
                                            total *
                                            100
                                            : 0
                                        }%
                                    "
                                ></div>

                            </div>

                        </div>


                        <div class="gender-stat">

                            <div class="stat-top">

                                <span>
                                    Female students
                                </span>

                                <strong>
                                    ${
                                        total
                                        ? Math.round(
                                            female /
                                            total *
                                            100
                                        )
                                        : 0
                                    }%
                                </strong>

                            </div>

                            <div class="progress-bar-custom">

                                <div
                                    class="progress-fill female-progress"
                                    style="
                                        width:${
                                            total
                                            ? female /
                                            total *
                                            100
                                            : 0
                                        }%
                                    "
                                ></div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>


        <div class="two-column">

            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Engagement trend
                        </h2>

                        <p>
                            Student engagement over
                            the last eight weeks
                        </p>

                    </div>

                </div>


                ${engagementGraph()}

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Mentor priority
                        </h2>

                        <p>
                            Students requiring attention
                        </p>

                    </div>

                </div>


                ${priorityList()}

            </div>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        AI anomaly detection
                    </h2>

                    <p>
                        Meaningful changes detected
                        in academic engagement.
                    </p>

                </div>

                <button
                    class="secondary-btn"
                    onclick="navigateTo('anomalies')"
                >
                    View all
                </button>

            </div>


            <div class="anomaly-list">

                ${getAnomalies()
                    .slice(0,3)
                    .map(
                        anomaly => `

                        <div class="anomaly-item">

                            <div class="anomaly-icon">

                                <i class="bi bi-activity"></i>

                            </div>

                            <div>

                                <h4>
                                    ${anomaly.name}
                                </h4>

                                <p>
                                    ${anomaly.reason}
                                </p>

                            </div>

                        </div>

                    `
                    )
                    .join("")}

            </div>

        </div>

    `;

}


/* =====================================================
   ENGAGEMENT GRAPH
===================================================== */

function engagementGraph() {

    const values =
        [64,68,66,72,75,71,78,82];


    const max = 100;


    return `

        <div
            style="
                height:220px;
                display:flex;
                align-items:flex-end;
                gap:14px;
                padding:20px 5px 5px;
            "
        >

            ${values.map(
                (value,index) => `

                <div
                    style="
                        flex:1;
                        height:100%;
                        display:flex;
                        flex-direction:column;
                        justify-content:flex-end;
                        align-items:center;
                        gap:8px;
                    "
                >

                    <span
                        style="
                            font-size:9px;
                            color:#8b93a5;
                        "
                    >
                        ${value}%
                    </span>

                    <div
                        style="
                            width:100%;
                            max-width:34px;
                            height:${
                                value/max*150
                            }px;
                            border-radius:7px 7px 3px 3px;
                            background:#3159c9;
                        "
                    ></div>

                    <small
                        style="
                            color:#9aa1b0;
                            font-size:9px;
                        "
                    >
                        W${index+1}
                    </small>

                </div>

            `).join("")}

        </div>

    `;

}


/* =====================================================
   PRIORITY
===================================================== */

function priorityList() {

    return students
        .sort(
            (a,b) =>
                b.risk - a.risk
        )
        .slice(0,4)
        .map(
            student => `

            <div class="priority-item">

                <div class="priority-top">

                    <span class="priority-name">
                        ${student.name}
                    </span>

                    <span class="${
                        student.risk >= 60
                        ? "risk-high"
                        : student.risk >= 35
                        ? "risk-medium"
                        : "risk-low"
                    }">

                        ${student.risk}% risk

                    </span>

                </div>

                <p>
                    Attendance ${student.attendance}%
                    · CGPA ${student.cgpa}
                </p>

            </div>

        `
        )
        .join("");

}


/* =====================================================
   STUDENTS
===================================================== */

function renderStudents() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                STUDENT MANAGEMENT
            </span>

            <h1>
                Students
            </h1>

            <p>
                Manage student records and academic
                information.
            </p>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        Student directory
                    </h2>

                    <p>
                        ${students.length}
                        registered students
                    </p>

                </div>

                <button
                    class="primary-btn"
                    onclick="openStudentModal()"
                >

                    <i class="bi bi-plus"></i>
                    Add Student

                </button>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>Student</th>
                            <th>ID</th>
                            <th>Gender</th>
                            <th>Attendance</th>
                            <th>CGPA</th>
                            <th>Credits</th>
                            <th>Risk</th>
                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody id="studentTableBody">

                        ${students.map(
                            student => `

                            <tr>

                                <td>

                                    <span class="student-name">
                                        ${student.name}
                                    </span>

                                    <span class="student-sub">
                                        ${student.course}
                                        ·
                                        ${student.year}
                                    </span>

                                </td>


                                <td>
                                    ${student.id}
                                </td>


                                <td>
                                    ${student.gender}
                                </td>


                                <td>
                                    ${student.attendance}%
                                </td>


                                <td>
                                    ${student.cgpa}
                                </td>


                                <td>
                                    ${student.credits}
                                </td>


                                <td>

                                    <span class="
                                        status-pill
                                        ${
                                            student.risk >= 60
                                            ? "status-danger"
                                            : student.risk >= 35
                                            ? "status-warning"
                                            : "status-good"
                                        }
                                    ">

                                        ${student.risk}%

                                    </span>

                                </td>


                                <td>

                                    <button
                                        class="secondary-btn"
                                        onclick="
                                            viewStudent(
                                                '${student.id}'
                                            )
                                        "
                                    >
                                        View
                                    </button>


                                    <button
                                        class="secondary-btn"
                                        onclick="
                                            deleteStudent(
                                                '${student.id}'
                                            )
                                        "
                                    >
                                        <i class="bi bi-trash"></i>
                                    </button>

                                </td>

                            </tr>

                        `
                        ).join("")}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}


/* =====================================================
   STUDENT 360
===================================================== */

let currentStudentIndex = 0;


function renderStudent360() {

    if (!students.length) {

        pageContent.innerHTML = `
            <div class="panel">
                No students available.
            </div>
        `;

        return;

    }


    const student =
        students[currentStudentIndex];


    const avatar =
        student.gender === "Female"
        ? "👩🏻‍🎓"
        : "👨🏻‍🎓";


    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                COMPLETE STUDENT INTELLIGENCE
            </span>

            <h1>
                Student 360°
            </h1>

            <p>
                Academic, personal and engagement
                intelligence.
            </p>

        </div>


        <div class="profile-card">

            <div class="profile-top">

                <div class="profile-avatar">
                    ${avatar}
                </div>


                <div>

                    <h2>
                        ${student.name}
                    </h2>

                    <p>
                        ${student.id}
                        ·
                        ${student.course}
                        ·
                        ${student.year}
                    </p>

                    <span class="
                        status-pill
                        ${
                            student.risk >= 60
                            ? "status-danger"
                            : student.risk >= 35
                            ? "status-warning"
                            : "status-good"
                        }
                    ">

                        ${student.risk}% AI risk

                    </span>

                </div>


                <div class="profile-actions">

                    <button
                        class="secondary-btn"
                        onclick="previousStudent()"
                    >
                        ← Previous
                    </button>

                    <button
                        class="primary-btn"
                        onclick="nextStudent()"
                    >
                        Next →
                    </button>

                </div>

            </div>


            <div class="profile-details">

                <div class="detail-item">

                    <span>Student ID</span>

                    <strong>
                        ${student.id}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Gender</span>

                    <strong>
                        ${student.gender}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Date of Birth</span>

                    <strong>
                        ${student.dob}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>CGPA</span>

                    <strong>
                        ${student.cgpa}
                    </strong>

                </div>

            </div>

        </div>


        <div class="two-column">

            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Personal information
                        </h2>

                        <p>
                            Complete student details
                        </p>

                    </div>

                </div>


                <div class="profile-details">

                    <div class="detail-item">

                        <span>Father's Name</span>

                        <strong>
                            ${student.father}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>Mother's Name</span>

                        <strong>
                            ${student.mother}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>Mother Tongue</span>

                        <strong>
                            ${student.motherTongue}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>Region</span>

                        <strong>
                            ${student.region}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>Place</span>

                        <strong>
                            ${student.place}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span>Country</span>

                        <strong>
                            ${student.country}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Academic health
                        </h2>

                        <p>
                            AI-generated academic indicators
                        </p>

                    </div>

                </div>


                <div class="attendance-row">

                    <div class="attendance-head">

                        <span>
                            Overall attendance
                        </span>

                        <strong>
                            ${student.attendance}%
                        </strong>

                    </div>

                    <div class="attendance-track">

                        <div
                            class="attendance-fill"
                            style="
                                width:${student.attendance}%
                            "
                        ></div>

                    </div>

                </div>


                <div class="attendance-row">

                    <div class="attendance-head">

                        <span>
                            CGPA
                        </span>

                        <strong>
                            ${student.cgpa}/10
                        </strong>

                    </div>

                    <div class="attendance-track">

                        <div
                            class="attendance-fill"
                            style="
                                width:${student.cgpa*10}%
                            "
                        ></div>

                    </div>

                </div>


                <div class="attendance-row">

                    <div class="attendance-head">

                        <span>
                            Credits completed
                        </span>

                        <strong>
                            ${student.credits}
                        </strong>

                    </div>

                </div>

            </div>

        </div>


        <div class="two-column">

            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Subject-wise attendance
                        </h2>

                        <p>
                            Current semester attendance
                        </p>

                    </div>

                </div>


                ${subjectAttendance(student)}

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Assessment data
                        </h2>

                        <p>
                            Subject performance
                        </p>

                    </div>

                </div>


                ${assessmentData(student)}

            </div>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        LMS activity
                    </h2>

                    <p>
                        Authorized learning engagement
                    </p>

                </div>

            </div>


            <div class="three-column">

                <div class="stat-card">

                    <span>
                        LMS logins
                    </span>

                    <h2>
                        34
                    </h2>

                    <small>
                        +8 this week
                    </small>

                </div>


                <div class="stat-card">

                    <span>
                        Assignments
                    </span>

                    <h2>
                        12/14
                    </h2>

                    <small>
                        86% completion
                    </small>

                </div>


                <div class="stat-card">

                    <span>
                        Learning hours
                    </span>

                    <h2>
                        18.4h
                    </h2>

                    <small>
                        +2.1h this week
                    </small>

                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   SUBJECT ATTENDANCE
===================================================== */

function subjectAttendance(student) {

    const subjects = [

        ["Data Structures", 88],
        ["Database Systems", 79],
        ["Java Programming", 84],
        ["Mathematics", 76],
        ["Communication", student.attendance]

    ];


    return subjects.map(
        subject => `

        <div class="attendance-row">

            <div class="attendance-head">

                <span>
                    ${subject[0]}
                </span>

                <strong>
                    ${subject[1]}%
                </strong>

            </div>

            <div class="attendance-track">

                <div
                    class="attendance-fill"
                    style="
                        width:${subject[1]}%;
                        background:
                        ${
                            subject[1] < 75
                            ? "#dc5a68"
                            : "#3159c9"
                        };
                    "
                ></div>

            </div>

        </div>

    `).join("");

}


/* =====================================================
   ASSESSMENT DATA
===================================================== */

function assessmentData(student) {

    const subjects = [

        ["Data Structures", 82],
        ["Database Systems", 76],
        ["Java Programming", 88],
        ["Mathematics", 79],
        ["Communication", 91]

    ];


    return subjects.map(
        subject => `

        <div class="attendance-row">

            <div class="attendance-head">

                <span>
                    ${subject[0]}
                </span>

                <strong>
                    ${subject[1]}/100
                </strong>

            </div>

            <div class="attendance-track">

                <div
                    class="attendance-fill"
                    style="
                        width:${subject[1]}%;
                    "
                ></div>

            </div>

        </div>

    `).join("");

}


/* =====================================================
   NEXT STUDENT
===================================================== */

function nextStudent() {

    currentStudentIndex++;

    if (
        currentStudentIndex >=
        students.length
    ) {

        currentStudentIndex = 0;

    }

    renderStudent360();

}


/* =====================================================
   PREVIOUS STUDENT
===================================================== */

function previousStudent() {

    currentStudentIndex--;

    if (
        currentStudentIndex < 0
    ) {

        currentStudentIndex =
            students.length - 1;

    }

    renderStudent360();

}


/* =====================================================
   VIEW STUDENT
===================================================== */

function viewStudent(id) {

    const index =
        students.findIndex(
            s => s.id === id
        );


    if (index !== -1) {

        currentStudentIndex = index;

        navigateTo("student360");

    }

}


/* =====================================================
   NAVIGATE
===================================================== */

function navigateTo(page) {

    document
        .querySelectorAll(".nav-item")
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

                if (
                    item.dataset.page === page
                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );


    renderPage(page);

}


/* =====================================================
   ANALYTICS
===================================================== */

function renderAnalytics() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                DATA INTELLIGENCE
            </span>

            <h1>
                Academic Analytics
            </h1>

            <p>
                Understand academic performance
                across the student population.
            </p>

        </div>


        <div class="stat-grid">

            <div class="stat-card">

                <span>
                    Average CGPA
                </span>

                <h2>
                    7.80
                </h2>

                <small>
                    +0.30 improvement
                </small>

            </div>


            <div class="stat-card">

                <span>
                    Assignment completion
                </span>

                <h2>
                    87%
                </h2>

                <small>
                    +5% this month
                </small>

            </div>


            <div class="stat-card">

                <span>
                    Average attendance
                </span>

                <h2>
                    78%
                </h2>

                <small>
                    Stable
                </small>

            </div>


            <div class="stat-card">

                <span>
                    Engagement
                </span>

                <h2>
                    82%
                </h2>

                <small>
                    +6% this month
                </small>

            </div>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        Academic performance trend
                    </h2>

                    <p>
                        Weekly student performance
                    </p>

                </div>

            </div>


            ${engagementGraph()}

        </div>

    `;

}


/* =====================================================
   ENGAGEMENT
===================================================== */

function renderEngagement() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                STUDENT ENGAGEMENT
            </span>

            <h1>
                Engagement Intelligence
            </h1>

            <p>
                Attendance, LMS and assignment
                engagement signals.
            </p>

        </div>


        <div class="two-column">

            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Engagement trend
                        </h2>

                        <p>
                            Last eight weeks
                        </p>

                    </div>

                </div>

                ${engagementGraph()}

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Engagement signals
                        </h2>

                    </div>

                </div>


                <div class="priority-item">

                    <div class="priority-top">

                        <span class="priority-name">
                            LMS activity
                        </span>

                        <span class="risk-low">
                            Healthy
                        </span>

                    </div>

                    <p>
                        84% students actively using LMS.
                    </p>

                </div>


                <div class="priority-item">

                    <div class="priority-top">

                        <span class="priority-name">
                            Assignment activity
                        </span>

                        <span class="risk-medium">
                            Watch
                        </span>

                    </div>

                    <p>
                        13 students missed recent submissions.
                    </p>

                </div>


                <div class="priority-item">

                    <div class="priority-top">

                        <span class="priority-name">
                            Attendance
                        </span>

                        <span class="risk-medium">
                            Watch
                        </span>

                    </div>

                    <p>
                        8 students below attendance threshold.
                    </p>

                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   MENTOR PRIORITY
===================================================== */

function renderMentor() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                FACULTY INTELLIGENCE
            </span>

            <h1>
                Mentor Priority
            </h1>

            <p>
                Prioritized students based on
                academic and engagement risk.
            </p>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        Priority list
                    </h2>

                    <p>
                        AI-ranked intervention queue
                    </p>

                </div>

            </div>


            ${priorityList()}

        </div>

    `;

}


/* =====================================================
   ANOMALIES
===================================================== */

function getAnomalies() {

    return students
        .filter(
            s =>
                s.attendance < 75 ||
                s.cgpa < 7.5
        )
        .map(
            s => ({

                name:
                    s.name,

                reason:
                    s.attendance < 75
                    ? `Attendance is ${s.attendance}%, below the recommended threshold.`
                    : "Academic performance has decreased compared with previous assessments."

            })
        );

}


function renderAnomalies() {

    const anomalies =
        getAnomalies();


    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                PREDICTIVE AI
            </span>

            <h1>
                AI Anomaly Detection
            </h1>

            <p>
                Detect meaningful changes in student
                engagement signals.
            </p>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        Meaningful engagement changes
                    </h2>

                    <p>
                        AI-generated anomaly signals
                    </p>

                </div>

            </div>


            <div class="anomaly-list">

                ${
                    anomalies.length
                    ? anomalies.map(
                        anomaly => `

                        <div class="anomaly-item">

                            <div class="anomaly-icon">

                                <i class="bi bi-activity"></i>

                            </div>

                            <div>

                                <h4>
                                    ${anomaly.name}
                                </h4>

                                <p>
                                    ${anomaly.reason}
                                </p>

                            </div>

                        </div>

                    `
                    ).join("")
                    : `
                        <p>
                            No significant anomalies detected.
                        </p>
                    `
                }

            </div>

        </div>

    `;

}


/* =====================================================
   AI AGENT
===================================================== */

function renderAIAgent() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                AGENTIC AI
            </span>

            <h1>
                AI Intervention Agent
            </h1>

            <p>
                Analyze signals, explain risk and
                recommend mentor interventions.
            </p>

        </div>


        <div class="ai-box">

            <h2>
                EduStudent AI Agent
            </h2>

            <p>
                The agent combines attendance,
                assessments, assignments and
                LMS engagement to generate
                explainable intervention recommendations.
            </p>


            <div class="ai-response">

                <strong>
                    Recommended action
                </strong>

                <p>
                    Prioritize students with attendance
                    below 75%, declining assessment
                    performance and reduced LMS activity.
                    Schedule a mentor interaction and
                    track the outcome.
                </p>

            </div>


            <div class="ai-response">

                <strong>
                    Intervention workflow
                </strong>

                <p>
                    Detect → Explain → Prioritize →
                    Recommend → Track → Measure outcome.
                </p>

            </div>

        </div>

    `;

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

let notifications = [

    {
        title:
            "Attendance anomaly detected",

        message:
            "Arjun Patel has attendance below 65%."
    },

    {
        title:
            "Assessment performance changed",

        message:
            "A significant performance change was detected."
    },

    {
        title:
            "Mentor action required",

        message:
            "Three students require intervention."
    }

];


function renderNotifications() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                ALERT CENTER
            </span>

            <h1>
                Notifications
            </h1>

            <p>
                Important AI-generated alerts.
            </p>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        Recent notifications
                    </h2>

                </div>


                <button
                    class="clear-btn"
                    onclick="clearNotifications()"
                >

                    <i class="bi bi-trash"></i>

                    Clear all

                </button>

            </div>


            <div>

                ${
                    notifications.length
                    ? notifications.map(
                        notification => `

                        <div class="notification-item">

                            <div class="notification-icon">

                                <i class="bi bi-bell"></i>

                            </div>

                            <div>

                                <h4>
                                    ${notification.title}
                                </h4>

                                <p>
                                    ${notification.message}
                                </p>

                            </div>

                        </div>

                    `
                    ).join("")
                    : `
                        <div style="
                            padding:30px;
                            text-align:center;
                            color:#8b93a5;
                        ">
                            No notifications
                        </div>
                    `
                }

            </div>

        </div>

    `;

}


/* =====================================================
   CLEAR NOTIFICATIONS
===================================================== */

function clearNotifications() {

    notifications = [];

    renderNotifications();

}


/* =====================================================
   REPORTS
===================================================== */

function renderReports() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                REPORTING
            </span>

            <h1>
                Reports
            </h1>

            <p>
                Academic and intervention summaries.
            </p>

        </div>


        <div class="three-column">

            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Academic report
                        </h2>

                        <p>
                            CGPA and assessment overview
                        </p>

                    </div>

                </div>

                <button
                    class="primary-btn"
                    onclick="alert('Academic report generated.')"
                >
                    Generate report
                </button>

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Attendance report
                        </h2>

                        <p>
                            Subject-wise attendance
                        </p>

                    </div>

                </div>

                <button
                    class="primary-btn"
                    onclick="alert('Attendance report generated.')"
                >
                    Generate report
                </button>

            </div>


            <div class="panel">

                <div class="panel-title">

                    <div>

                        <h2>
                            Intervention report
                        </h2>

                        <p>
                            Mentor action summary
                        </p>

                    </div>

                </div>

                <button
                    class="primary-btn"
                    onclick="alert('Intervention report generated.')"
                >
                    Generate report
                </button>

            </div>

        </div>

    `;

}


/* =====================================================
   SETTINGS
===================================================== */

function renderSettings() {

    pageContent.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                SYSTEM
            </span>

            <h1>
                Settings
            </h1>

            <p>
                Configure your academic intelligence
                dashboard.
            </p>

        </div>


        <div class="panel">

            <div class="panel-title">

                <div>

                    <h2>
                        AI thresholds
                    </h2>

                    <p>
                        Configure academic risk detection.
                    </p>

                </div>

            </div>


            <div class="form-grid">

                <div class="form-group">

                    <label>
                        Attendance threshold
                    </label>

                    <input
                        value="75%"
                    >

                </div>


                <div class="form-group">

                    <label>
                        CGPA warning threshold
                    </label>

                    <input
                        value="7.0"
                    >

                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   ADD STUDENT MODAL
===================================================== */

const studentModal =
    document.getElementById(
        "studentModal"
    );


function openStudentModal() {

    studentModal.classList.add(
        "show"
    );

}


function closeStudentModal() {

    studentModal.classList.remove(
        "show"
    );

}


document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeStudentModal
    );


document
    .getElementById("cancelModal")
    .addEventListener(
        "click",
        closeStudentModal
    );


/* =====================================================
   ADD STUDENT
===================================================== */

document
    .getElementById("studentForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const student = {

                id:
                    document.getElementById(
                        "studentId"
                    ).value.trim(),

                name:
                    document.getElementById(
                        "studentName"
                    ).value.trim(),

                gender:
                    document.getElementById(
                        "studentGender"
                    ).value,

                course:
                    document.getElementById(
                        "studentCourse"
                    ).value,

                year:
                    document.getElementById(
                        "studentYear"
                    ).value,

                cgpa:
                    Number(
                        document.getElementById(
                            "studentCGPA"
                        ).value
                    ),

                credits:
                    Number(
                        document.getElementById(
                            "studentCredits"
                        ).value
                    ),

                attendance:
                    Number(
                        document.getElementById(
                            "studentAttendance"
                        ).value
                    ),

                dob: "Not provided",

                father:
                    document.getElementById(
                        "fatherName"
                    ).value || "Not provided",

                mother:
                    document.getElementById(
                        "motherName"
                    ).value || "Not provided",

                motherTongue:
                    document.getElementById(
                        "motherTongue"
                    ).value || "Not provided",

                region:
                    document.getElementById(
                        "studentRegion"
                    ).value || "Not provided",

                place:
                    document.getElementById(
                        "studentPlace"
                    ).value || "Not provided",

                country:
                    document.getElementById(
                        "studentCountry"
                    ).value || "India",

                risk:
                    calculateRisk(
                        Number(
                            document.getElementById(
                                "studentAttendance"
                            ).value
                        ),
                        Number(
                            document.getElementById(
                                "studentCGPA"
                            ).value
                        )
                    )

            };


            const duplicate =
                students.some(
                    s =>
                        s.id.toLowerCase() ===
                        student.id.toLowerCase()
                );


            if (duplicate) {

                alert(
                    "Student ID already exists."
                );

                return;

            }


            students.push(student);

            saveStudents();

            closeStudentModal();

            renderStudents();

        }
    );


/* =====================================================
   RISK CALCULATION
===================================================== */

function calculateRisk(
    attendance,
    cgpa
) {

    let risk = 0;


    if (attendance < 75) {

        risk +=
            (75 - attendance) * 1.4;

    }


    if (cgpa < 7.5) {

        risk +=
            (7.5 - cgpa) * 12;

    }


    return Math.min(
        100,
        Math.round(risk)
    );

}


/* =====================================================
   DELETE STUDENT
===================================================== */

function deleteStudent(id) {

    const student =
        students.find(
            s => s.id === id
        );


    if (!student) return;


    const confirmed =
        confirm(
            `Delete ${student.name}?`
        );


    if (!confirmed) return;


    students =
        students.filter(
            s => s.id !== id
        );


    saveStudents();

    renderStudents();

}


/* =====================================================
   GLOBAL SEARCH
===================================================== */

document
    .getElementById("globalSearch")
    .addEventListener(
        "input",
        function() {

            const query =
                this.value
                    .toLowerCase()
                    .trim();


            if (!query) {

                renderPage(
                    "students"
                );

                return;

            }


            const results =
                students.filter(
                    student =>
                        student.name
                            .toLowerCase()
                            .includes(query)
                        ||
                        student.id
                            .toLowerCase()
                            .includes(query)
                        ||
                        student.course
                            .toLowerCase()
                            .includes(query)
                        ||
                        student.gender
                            .toLowerCase()
                            .includes(query)
                );


            pageContent.innerHTML = `

                <div class="page-header">

                    <span class="eyebrow">
                        SEARCH
                    </span>

                    <h1>
                        Search results
                    </h1>

                    <p>
                        ${results.length}
                        student(s) found for
                        "${query}"
                    </p>

                </div>


                <div class="panel">

                    <div class="table-wrap">

                        <table>

                            <thead>

                                <tr>

                                    <th>Student</th>
                                    <th>ID</th>
                                    <th>Gender</th>
                                    <th>Attendance</th>
                                    <th>CGPA</th>
                                    <th>Action</th>

                                </tr>

                            </thead>


                            <tbody>

                                ${
                                    results.length
                                    ? results.map(
                                        student => `

                                        <tr>

                                            <td>
                                                <span class="student-name">
                                                    ${student.name}
                                                </span>

                                                <span class="student-sub">
                                                    ${student.course}
                                                    ·
                                                    ${student.year}
                                                </span>
                                            </td>

                                            <td>
                                                ${student.id}
                                            </td>

                                            <td>
                                                ${student.gender}
                                            </td>

                                            <td>
                                                ${student.attendance}%
                                            </td>

                                            <td>
                                                ${student.cgpa}
                                            </td>

                                            <td>

                                                <button
                                                    class="primary-btn"
                                                    onclick="
                                                        viewStudent(
                                                            '${student.id}'
                                                        )
                                                    "
                                                >
                                                    Open 360°
                                                </button>

                                            </td>

                                        </tr>

                                    `
                                    ).join("")
                                    : `
                                        <tr>

                                            <td
                                                colspan="6"
                                                style="
                                                    text-align:center;
                                                    padding:40px;
                                                    color:#8b93a5;
                                                "
                                            >
                                                No students found.
                                            </td>

                                        </tr>
                                    `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            `;

        }
    );


/* =====================================================
   NOTIFICATION BUTTON
===================================================== */

document
    .getElementById(
        "notificationButton"
    )
    .addEventListener(
        "click",
        function() {

            navigateTo(
                "notifications"
            );

        }
    );


/* =====================================================
   KEYBOARD SEARCH
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            document
                .getElementById(
                    "globalSearch"
                )
                .focus();

        }

    }
);


/* =====================================================
   INITIAL SAVE
===================================================== */

saveStudents();