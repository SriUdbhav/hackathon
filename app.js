/* =====================================================
   EDUPULSE AI
   Student Attendance, Engagement & Intervention Agent
===================================================== */


/* ================= SAMPLE STUDENTS ================= */

let students = JSON.parse(
    localStorage.getItem("edupulse_students")
) || [

    {
        id: "STU001",
        name: "Rahul Kumar",
        email: "rahul@college.edu",
        phone: "9876543210",
        department: "CSE",
        year: "1st Year",
        section: "A",
        attendance: 64,
        marks: 48,
        assignments: 3,
        totalAssignments: 6,
        lms: 32,
        mentor: "Dr. Priya",
        trend: "down"
    },

    {
        id: "STU002",
        name: "Ananya Reddy",
        email: "ananya@college.edu",
        phone: "9876501234",
        department: "CSE",
        year: "1st Year",
        section: "A",
        attendance: 82,
        marks: 74,
        assignments: 5,
        totalAssignments: 6,
        lms: 78,
        mentor: "Dr. Priya",
        trend: "up"
    },

    {
        id: "STU003",
        name: "Kiran Varma",
        email: "kiran@college.edu",
        phone: "9876512345",
        department: "ECE",
        year: "2nd Year",
        section: "B",
        attendance: 71,
        marks: 56,
        assignments: 4,
        totalAssignments: 6,
        lms: 49,
        mentor: "Dr. Suresh",
        trend: "down"
    },

    {
        id: "STU004",
        name: "Sneha Rao",
        email: "sneha@college.edu",
        phone: "9876523456",
        department: "IT",
        year: "2nd Year",
        section: "A",
        attendance: 91,
        marks: 88,
        assignments: 6,
        totalAssignments: 6,
        lms: 94,
        mentor: "Dr. Suresh",
        trend: "up"
    },

    {
        id: "STU005",
        name: "Arjun Sai",
        email: "arjun@college.edu",
        phone: "9876534567",
        department: "CSE",
        year: "1st Year",
        section: "B",
        attendance: 76,
        marks: 62,
        assignments: 4,
        totalAssignments: 6,
        lms: 61,
        mentor: "Dr. Priya",
        trend: "stable"
    }

];


let completedInterventions =
    JSON.parse(
        localStorage.getItem(
            "edupulse_completed"
        )
    ) || [];


/* ================= LOGIN ================= */

const loginForm =
    document.getElementById("loginForm");

loginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const email =
            document.getElementById(
                "loginEmail"
            ).value;

        const password =
            document.getElementById(
                "loginPassword"
            ).value;

        if (!email || !password) {

            showToast(
                "Please enter email and password"
            );

            return;
        }

        localStorage.setItem(
            "edupulse_logged_in",
            "true"
        );

        document
            .getElementById("loginPage")
            .classList.add("hidden");

        document
            .getElementById("app")
            .classList.remove("hidden");

        initializeApp();

    }
);


/* ================= SHOW PASSWORD ================= */

document
    .getElementById("showPassword")
    .addEventListener(
        "click",
        function () {

            const input =
                document.getElementById(
                    "loginPassword"
                );

            if (input.type === "password") {

                input.type = "text";

                this.textContent = "Hide";

            } else {

                input.type = "password";

                this.textContent = "Show";

            }

        }
    );


/* ================= SSO ================= */

document
    .getElementById("ssoButton")
    .addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "edupulse_logged_in",
                "true"
            );

            document
                .getElementById("loginPage")
                .classList.add("hidden");

            document
                .getElementById("app")
                .classList.remove("hidden");

            initializeApp();

        }
    );


/* ================= LOGOUT ================= */

function logout() {

    localStorage.removeItem(
        "edupulse_logged_in"
    );

    location.reload();

}


/* ================= NAVIGATION ================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const page =
                    this.dataset.page;

                showPage(page);

            }
        );

    });


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active-page"
            );

        });


    const selectedPage =
        document.getElementById(page);

    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

            if (
                button.dataset.page === page
            ) {

                button.classList.add(
                    "active"
                );

            }

        });


    updatePageTitle(page);

    renderPage(page);

}


/* ================= PAGE TITLE ================= */

function updatePageTitle(page) {

    const titles = {

        dashboard:
            "Good morning, Mentor 👋",

        students:
            "Student Directory",

        analytics:
            "Risk Analytics",

        interventions:
            "Intervention Center",

        ai:
            "EduPulse AI Agent",

        reports:
            "Reports",

        settings:
            "Settings"

    };


    const names = {

        dashboard:
            "Dashboard",

        students:
            "Students",

        analytics:
            "Risk Analytics",

        interventions:
            "Interventions",

        ai:
            "AI Agent",

        reports:
            "Reports",

        settings:
            "Settings"

    };


    document.getElementById(
        "pageTitle"
    ).textContent = titles[page];


    document.getElementById(
        "currentPageName"
    ).textContent = names[page];

}


/* ================= RISK CALCULATION ================= */

function calculateRisk(student) {

    const assignmentPercentage =
        (
            student.assignments /
            student.totalAssignments
        ) * 100;


    const score =
        (
            student.attendance * 0.35
        ) +
        (
            student.marks * 0.35
        ) +
        (
            student.lms * 0.15
        ) +
        (
            assignmentPercentage * 0.15
        );


    if (score < 55) {

        return "High";

    }


    if (score < 72) {

        return "Medium";

    }


    return "Low";

}


/* ================= RISK EXPLANATION ================= */

function explainRisk(student) {

    const reasons = [];


    if (student.attendance < 75) {

        reasons.push(
            `attendance is ${student.attendance}%`
        );

    }


    if (student.marks < 60) {

        reasons.push(
            `average marks are ${student.marks}%`
        );

    }


    const assignmentPercentage =
        (
            student.assignments /
            student.totalAssignments
        ) * 100;


    if (assignmentPercentage < 75) {

        reasons.push(
            `assignment completion is ${Math.round(
                assignmentPercentage
            )}%`
        );

    }


    if (student.lms < 60) {

        reasons.push(
            `LMS activity is ${student.lms}%`
        );

    }


    if (reasons.length === 0) {

        return "No significant negative signals detected.";

    }


    return reasons.join(", ") + ".";

}


/* ================= INITIALIZE ================= */

function initializeApp() {

    updateStudentRisks();

    updateDashboard();

    renderStudents();

    renderAnalytics();

    renderInterventions();

    renderReports();

    updateAIContext();

}


/* ================= UPDATE RISK ================= */

function updateStudentRisks() {

    students.forEach(student => {

        student.risk =
            calculateRisk(student);

    });

    saveStudents();

}


/* ================= SAVE ================= */

function saveStudents() {

    localStorage.setItem(
        "edupulse_students",
        JSON.stringify(students)
    );

}


/* ================= DASHBOARD ================= */

function updateDashboard() {

    const total =
        students.length;


    const high =
        students.filter(
            s => s.risk === "High"
        ).length;


    const medium =
        students.filter(
            s => s.risk === "Medium"
        ).length;


    const low =
        students.filter(
            s => s.risk === "Low"
        ).length;


    const averageAttendance =
        students.length
            ? Math.round(
                students.reduce(
                    (sum, s) =>
                        sum + Number(
                            s.attendance
                        ),
                    0
                ) / students.length
            )
            : 0;


    document.getElementById(
        "totalStudents"
    ).textContent = total;


    document.getElementById(
        "highRisk"
    ).textContent = high;


    document.getElementById(
        "mediumRisk"
    ).textContent = medium;


    document.getElementById(
        "averageAttendance"
    ).textContent =
        averageAttendance + "%";


    document.getElementById(
        "studentCountBadge"
    ).textContent = total;


    document.getElementById(
        "lowRisk"
    ).textContent = low;


    document.getElementById(
        "mediumRiskLegend"
    ).textContent = medium;


    document.getElementById(
        "highRiskLegend"
    ).textContent = high;


    const lowPercentage =
        total
            ? Math.round(
                (low / total) * 100
            )
            : 0;


    document.getElementById(
        "lowRiskPercent"
    ).textContent =
        lowPercentage + "%";


    document.getElementById(
        "dashboardInsight"
    ).textContent =
        high > 0
            ? `${high} students show signals that may require mentor follow-up this week.`
            : "No high-risk students detected this week.";


    renderAttentionStudents();

    renderRecentStudents();

}


/* ================= ATTENTION ================= */

function renderAttentionStudents() {

    const container =
        document.getElementById(
            "attentionStudents"
        );


    const attention =
        students
            .filter(
                s => s.risk !== "Low"
            )
            .sort(
                (a, b) =>
                    riskValue(b.risk) -
                    riskValue(a.risk)
            );


    if (!attention.length) {

        container.innerHTML =
            `<p>No students currently need attention.</p>`;

        return;

    }


    container.innerHTML =
        attention
            .slice(0, 5)
            .map(student => `

                <button
                    class="student-row"
                    onclick="openStudentDetails('${student.id}')"
                >

                    <div class="avatar">
                        ${initials(student.name)}
                    </div>

                    <div class="student-info">

                        <strong>
                            ${student.name}
                        </strong>

                        <small>
                            ${student.id} •
                            ${student.department} •
                            ${student.section}
                        </small>

                    </div>

                    <span
                        class="risk ${student.risk.toLowerCase()}"
                    >
                        ${student.risk}
                    </span>

                </button>

            `)
            .join("");

}


/* ================= RECENT STUDENTS ================= */

function renderRecentStudents() {

    const tbody =
        document.getElementById(
            "recentStudents"
        );


    tbody.innerHTML =
        students
            .slice(0, 6)
            .map(student => `

                <tr
                    onclick="openStudentDetails('${student.id}')"
                >

                    <td>

                        <div class="table-person">

                            <div class="avatar">
                                ${initials(student.name)}
                            </div>

                            <div>
                                <strong>
                                    ${student.name}
                                </strong>

                                <small>
                                    ${student.id}
                                </small>
                            </div>

                        </div>

                    </td>


                    <td>

                        <div class="meter">

                            ${student.attendance}%

                            <div class="meter-bar">

                                <div
                                    class="meter-fill"
                                    style="
                                    width:${student.attendance}%
                                    "
                                ></div>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${student.marks}%
                    </td>


                    <td>
                        ${student.assignments}/${student.totalAssignments}
                    </td>


                    <td>
                        ${student.lms}%
                    </td>


                    <td>

                        <span
                            class="risk ${student.risk.toLowerCase()}"
                        >
                            ${student.risk}
                        </span>

                    </td>


                    <td>

                        ${trendText(student.trend)}

                    </td>

                </tr>

            `)
            .join("");

}


/* ================= STUDENT PAGE ================= */

function renderStudents() {

    const search =
        document
            .getElementById(
                "studentSearch"
            )
            .value
            .toLowerCase();


    const risk =
        document
            .getElementById(
                "riskFilter"
            )
            .value;


    const filtered =
        students.filter(student => {

            const matchesSearch =
                student.name
                    .toLowerCase()
                    .includes(search) ||

                student.id
                    .toLowerCase()
                    .includes(search) ||

                student.department
                    .toLowerCase()
                    .includes(search);


            const matchesRisk =
                risk === "All" ||
                student.risk === risk;


            return (
                matchesSearch &&
                matchesRisk
            );

        });


    const tbody =
        document.getElementById(
            "studentTable"
        );


    tbody.innerHTML =
        filtered.map(student => `

            <tr>

                <td>

                    <div class="table-person">

                        <div class="avatar">
                            ${initials(student.name)}
                        </div>

                        <div>

                            <strong>
                                ${student.name}
                            </strong>

                            <small>
                                ${student.id} •
                                ${student.email}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    ${student.department}

                    <small>
                        ${student.year} •
                        ${student.section}
                    </small>

                </td>


                <td>
                    ${student.attendance}%
                </td>


                <td>
                    ${student.marks}%
                </td>


                <td>
                    ${student.assignments}/
                    ${student.totalAssignments}
                </td>


                <td>
                    ${student.lms}%
                </td>


                <td>

                    <span
                        class="risk ${student.risk.toLowerCase()}"
                    >
                        ${student.risk}
                    </span>

                </td>


                <td>

                    <button
                        class="text-button"
                        onclick="
                        openStudentDetails('${student.id}')
                        "
                    >
                        View
                    </button>

                </td>

            </tr>

        `).join("");

}


/* ================= SEARCH ================= */

document
    .getElementById(
        "studentSearch"
    )
    .addEventListener(
        "input",
        renderStudents
    );


document
    .getElementById(
        "riskFilter"
    )
    .addEventListener(
        "change",
        renderStudents
    );


/* ================= ADD STUDENT MODAL ================= */

function openAddStudentModal() {

    document
        .getElementById(
            "addStudentModal"
        )
        .classList.remove(
            "hidden"
        );

}


function closeAddStudentModal() {

    document
        .getElementById(
            "addStudentModal"
        )
        .classList.add(
            "hidden"
        );

}


/* ================= ADD STUDENT ================= */

document
    .getElementById(
        "studentForm"
    )
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const student = {

                id:
                    "STU" +
                    String(
                        students.length + 1
                    ).padStart(3, "0"),

                name:
                    value("studentName"),

                email:
                    value("studentEmail"),

                phone:
                    value("studentPhone"),

                department:
                    value("studentDepartment"),

                year:
                    value("studentYear"),

                section:
                    value("studentSection"),

                attendance:
                    Number(
                        value(
                            "studentAttendance"
                        )
                    ),

                marks:
                    Number(
                        value(
                            "studentMarks"
                        )
                    ),

                assignments:
                    Number(
                        value(
                            "studentAssignments"
                        )
                    ),

                totalAssignments:
                    Number(
                        value(
                            "studentTotalAssignments"
                        )
                    ),

                lms:
                    Number(
                        value(
                            "studentLMS"
                        )
                    ),

                mentor:
                    value("studentMentor"),

                trend: "stable"

            };


            student.risk =
                calculateRisk(student);


            students.unshift(student);


            saveStudents();


            closeAddStudentModal();


            this.reset();


            initializeApp();


            showToast(
                `${student.name} added successfully`
            );


            showPage("students");

        }
    );


/* ================= STUDENT DETAILS ================= */

function openStudentDetails(id) {

    const student =
        students.find(
            s => s.id === id
        );


    if (!student) return;


    const modal =
        document.getElementById(
            "studentModal"
        );


    const container =
        document.getElementById(
            "studentDetails"
        );


    container.innerHTML = `

        <div class="student-details">

            <div class="modal-header">

                <div class="detail-header">

                    <div class="avatar">
                        ${initials(student.name)}
                    </div>

                    <div>

                        <h2>
                            ${student.name}
                        </h2>

                        <p>
                            ${student.id} •
                            ${student.department} •
                            ${student.year} •
                            Section ${student.section}
                        </p>

                    </div>

                </div>

                <button
                    class="close-button"
                    onclick="closeStudentDetails()"
                >
                    ×
                </button>

            </div>


            <span
                class="risk ${student.risk.toLowerCase()}"
            >
                ${student.risk} Risk
            </span>


            <div class="metric-grid">

                <div class="metric">

                    <span>Attendance</span>

                    <strong>
                        ${student.attendance}%
                    </strong>

                    <small>
                        ${
                            student.attendance >= 75
                                ? "Healthy"
                                : "Needs Review"
                        }
                    </small>

                </div>


                <div class="metric">

                    <span>Average Marks</span>

                    <strong>
                        ${student.marks}%
                    </strong>

                    <small>
                        ${
                            student.marks >= 60
                                ? "Healthy"
                                : "Needs Review"
                        }
                    </small>

                </div>


                <div class="metric">

                    <span>Assignments</span>

                    <strong>
                        ${student.assignments}/
                        ${student.totalAssignments}
                    </strong>

                    <small>
                        Completion
                    </small>

                </div>


                <div class="metric">

                    <span>LMS Activity</span>

                    <strong>
                        ${student.lms}%
                    </strong>

                    <small>
                        Engagement
                    </small>

                </div>

            </div>


            <div class="ai-explanation">

                <strong>
                    ✦ Why AI flagged this student
                </strong>

                <p>
                    ${explainRisk(student)}
                </p>

            </div>


            <div class="detail-actions">

                <button
                    class="secondary-button"
                    onclick="showPage('analytics');closeStudentDetails()"
                >
                    View Full Analytics
                </button>

                <button
                    class="primary-button"
                    onclick="createIntervention('${student.id}')"
                >
                    Create Intervention
                </button>

            </div>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


function closeStudentDetails() {

    document
        .getElementById(
            "studentModal"
        )
        .classList.add(
            "hidden"
        );

}


/* ================= ANALYTICS ================= */

function renderAnalytics() {

    const attendance =
        average(
            students.map(
                s => s.attendance
            )
        );


    const marks =
        average(
            students.map(
                s => s.marks
            )
        );


    const assignments =
        average(
            students.map(
                s =>
                    (
                        s.assignments /
                        s.totalAssignments
                    ) * 100
            )
        );


    const lms =
        average(
            students.map(
                s => s.lms
            )
        );


    const signals = [

        ["Attendance", attendance],

        ["Marks", marks],

        ["Assignments", assignments],

        ["LMS Activity", lms]

    ];


    document.getElementById(
        "signalBars"
    ).innerHTML = signals.map(
        signal => `

            <div class="signal-row">

                <span>
                    ${signal[0]}
                </span>

                <div class="signal-bar">

                    <div
                        class="signal-fill"
                        style="
                        width:${signal[1]}%
                        "
                    ></div>

                </div>

                <b>
                    ${Math.round(signal[1])}%
                </b>

            </div>

        `
    ).join("");


    const high =
        students.filter(
            s => s.risk === "High"
        ).length;


    const medium =
        students.filter(
            s => s.risk === "Medium"
        ).length;


    const low =
        students.filter(
            s => s.risk === "Low"
        ).length;


    document.getElementById(
        "analyticsHigh"
    ).textContent = high;


    document.getElementById(
        "analyticsMedium"
    ).textContent = medium;


    document.getElementById(
        "analyticsLow"
    ).textContent = low;


    document.getElementById(
        "riskReasons"
    ).innerHTML =
        students
            .filter(
                s => s.risk !== "Low"
            )
            .map(
                student => `

                <div class="reason-row">

                    <div class="avatar">
                        ${initials(student.name)}
                    </div>

                    <div class="reason-content">

                        <strong>
                            ${student.name}
                        </strong>

                        <p>
                            ${explainRisk(student)}
                        </p>

                    </div>

                    <span
                        class="risk ${student.risk.toLowerCase()}"
                    >
                        ${student.risk}
                    </span>

                </div>

            `
            )
            .join("");

}


/* ================= INTERVENTIONS ================= */

function renderInterventions() {

    const studentsAtRisk =
        students.filter(
            s => s.risk !== "Low"
        );


    const container =
        document.getElementById(
            "interventionList"
        );


    container.innerHTML =
        studentsAtRisk
            .map(student => {

                const completed =
                    completedInterventions
                        .includes(student.id);


                return `

                    <div
                        class="
                        intervention-row
                        ${completed ? "completed" : ""}
                        "
                    >

                        <div class="avatar">
                            ${initials(student.name)}
                        </div>


                        <div class="intervention-content">

                            <strong>
                                ${student.name}
                            </strong>

                            <span
                                class="
                                risk
                                ${student.risk.toLowerCase()}
                                "
                            >
                                ${student.risk}
                            </span>

                            <p>
                                ${recommendedAction(student)}
                            </p>

                            <small>
                                AI Reason:
                                ${explainRisk(student)}
                            </small>

                        </div>


                        <button
                            class="done-button"
                            onclick="
                            toggleIntervention('${student.id}')
                            "
                        >

                            ${
                                completed
                                    ? "✓ Completed"
                                    : "Mark Done"
                            }

                        </button>

                    </div>

                `;

            })
            .join("");


    const completed =
        completedInterventions.length;


    document.getElementById(
        "openInterventions"
    ).textContent =
        studentsAtRisk.length;


    document.getElementById(
        "completedInterventions"
    ).textContent =
        completed;


    document.getElementById(
        "followupInterventions"
    ).textContent =
        Math.max(
            studentsAtRisk.length -
            completed,
            0
        );

}


function recommendedAction(student) {

    if (
        student.attendance < 70
    ) {

        return `
            Schedule a mentor meeting and
            discuss attendance barriers.
        `;

    }


    if (
        student.assignments <
        student.totalAssignments
    ) {

        return `
            Create an assignment recovery plan
            and schedule a 7-day follow-up.
        `;

    }


    if (
        student.marks < 60
    ) {

        return `
            Recommend subject-specific
            doubt clearing and reassessment.
        `;

    }


    return `
        Monitor the student and review
        engagement after two weeks.
    `;

}


function toggleIntervention(id) {

    const index =
        completedInterventions
            .indexOf(id);


    if (index === -1) {

        completedInterventions.push(id);

        showToast(
            "Intervention marked completed"
        );

    } else {

        completedInterventions.splice(
            index,
            1
        );

        showToast(
            "Intervention reopened"
        );

    }


    localStorage.setItem(
        "edupulse_completed",
        JSON.stringify(
            completedInterventions
        )
    );


    renderInterventions();

}


function createIntervention(id) {

    if (
        !completedInterventions
            .includes(id)
    ) {

        completedInterventions.push(id);

    }


    localStorage.setItem(
        "edupulse_completed",
        JSON.stringify(
            completedInterventions
        )
    );


    closeStudentDetails();


    showPage(
        "interventions"
    );


    showToast(
        "Intervention created"
    );

}


/* ================= AI AGENT ================= */

document
    .getElementById(
        "aiForm"
    )
    .addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const input =
                document.getElementById(
                    "aiInput"
                );


            const message =
                input.value.trim();


            if (!message) return;


            addChatMessage(
                message,
                "user"
            );


            input.value = "";


            setTimeout(
                () => {

                    const response =
                        generateAIResponse(
                            message
                        );


                    addChatMessage(
                        response,
                        "ai"
                    );

                },
                500
            );

        }
    );


function askAI(question) {

    addChatMessage(
        question,
        "user"
    );


    setTimeout(
        () => {

            addChatMessage(
                generateAIResponse(
                    question
                ),
                "ai"
            );

        },
        400
    );

}


function addChatMessage(
    message,
    type
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        type === "user"
            ? "message user-message"
            : "message ai-message";


    div.innerHTML = `

        <div class="message-icon">

            ${
                type === "ai"
                    ? "✦"
                    : "U"
            }

        </div>

        <div class="message-bubble">

            ${message}

        </div>

    `;


    container.appendChild(div);


    container.scrollTop =
        container.scrollHeight;

}


/* ================= AI RESPONSE ================= */

function generateAIResponse(
    question
) {

    const q =
        question.toLowerCase();


    const high =
        students.filter(
            s => s.risk === "High"
        );


    const medium =
        students.filter(
            s => s.risk === "Medium"
        );


    if (
        q.includes("who") ||
        q.includes("attention")
    ) {

        if (!high.length) {

            return `
                There are currently no high-risk
                students. I recommend continuing
                regular monitoring.
            `;

        }


        return `
            <strong>
                ${high.length}
                student(s) need priority attention.
            </strong>

            <br><br>

            ${high.map(
                s =>
                    `• ${s.name} —
                    ${explainRisk(s)}`
            ).join("<br>")}

            <br><br>

            I recommend reviewing these students
            first in the Intervention Center.
        `;

    }


    if (
        q.includes("rahul")
    ) {

        const rahul =
            students.find(
                s =>
                    s.name
                        .toLowerCase()
                        .includes("rahul")
            );


        if (!rahul) {

            return `
                Rahul is not currently present
                in the student database.
            `;

        }


        return `
            <strong>
                ${rahul.name}
            </strong>
            is currently
            <strong>
                ${rahul.risk} Risk.
            </strong>

            <br><br>

            Main contributing factors:

            <br><br>

            • ${explainRisk(rahul)}

            <br><br>

            <strong>
                Recommended intervention:
            </strong>

            Schedule a mentor meeting focused
            on attendance and assignment recovery.
        `;

    }


    if (
        q.includes("intervention")
    ) {

        return `
            Based on current student signals,
            I recommend:

            <br><br>

            1. Students with attendance below
            70% → Mentor meeting.

            <br>

            2. Students missing assignments →
            Assignment recovery plan.

            <br>

            3. Students with marks below 60% →
            Subject-specific academic support.

            <br>

            4. Reassess outcomes after 2 weeks.
        `;

    }


    if (
        q.includes("summary") ||
        q.includes("week")
    ) {

        return `
            <strong>Weekly AI Summary</strong>

            <br><br>

            Total students:
            ${students.length}

            <br>

            High risk:
            ${high.length}

            <br>

            Medium risk:
            ${medium.length}

            <br>

            Low risk:
            ${
                students.filter(
                    s => s.risk === "Low"
                ).length
            }

            <br><br>

            The main factors requiring attention
            are attendance, assignment completion,
            academic performance and LMS engagement.
        `;

    }


    return `
        I can help you analyze:

        <br><br>

        • Student risk

        <br>

        • Attendance trends

        <br>

        • Academic performance

        <br>

        • Assignment completion

        <br>

        • LMS engagement

        <br>

        • Intervention recommendations

        <br><br>

        Try asking:
        <strong>
        "Who needs attention today?"
        </strong>
    `;

}


/* ================= AI CONTEXT ================= */

function updateAIContext() {

    const high =
        students.filter(
            s => s.risk === "High"
        ).length;


    const medium =
        students.filter(
            s => s.risk === "Medium"
        ).length;


    const low =
        students.filter(
            s => s.risk === "Low"
        ).length;


    document.getElementById(
        "aiContext"
    ).textContent = `
        ${students.length} students •
        ${high} high risk •
        ${medium} medium risk •
        ${low} low risk
    `;

}


/* ================= REPORTS ================= */

function renderReports() {

    const total =
        students.length;


    const averageMarks =
        average(
            students.map(
                s => s.marks
            )
        );


    const high =
        students.filter(
            s => s.risk === "High"
        ).length;


    document.getElementById(
        "reportStudents"
    ).textContent =
        total;


    document.getElementById(
        "reportAverageMarks"
    ).textContent =
        Math.round(
            averageMarks
        ) +
        "% Average Marks";


    document.getElementById(
        "weeklyReport"
    ).textContent =
        `${high} high-risk students require immediate attention. Average attendance is ${Math.round(
            average(
                students.map(
                    s => s.attendance
                )
            )
        )}%.`;

}


function generateReport() {

    showToast(
        "Report generated successfully"
    );

}


/* ================= EXPORT ================= */

function exportStudents() {

    let csv =
        "ID,Name,Email,Department,Year,Section,Attendance,Marks,Assignments,LMS,Risk\n";


    students.forEach(student => {

        csv +=
            `${student.id},` +
            `${student.name},` +
            `${student.email},` +
            `${student.department},` +
            `${student.year},` +
            `${student.section},` +
            `${student.attendance},` +
            `${student.marks},` +
            `${student.assignments}/${student.totalAssignments},` +
            `${student.lms},` +
            `${student.risk}\n`;

    });


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "students-report.csv";

    link.click();


    URL.revokeObjectURL(
        url
    );

}


/* ================= UTILITIES ================= */

function value(id) {

    return document
        .getElementById(id)
        .value;

}


function initials(name) {

    return name
        .split(" ")
        .map(
            word => word[0]
        )
        .join("")
        .slice(0, 2)
        .toUpperCase();

}


function riskValue(risk) {

    if (risk === "High")
        return 3;

    if (risk === "Medium")
        return 2;

    return 1;

}


function average(numbers) {

    if (!numbers.length)
        return 0;


    return (
        numbers.reduce(
            (a, b) => a + Number(b),
            0
        ) / numbers.length
    );

}


function trendText(trend) {

    if (trend === "down") {

        return `
            <span style="color:#d64545">
                ↘ Declining
            </span>
        `;

    }


    if (trend === "up") {

        return `
            <span style="color:#218451">
                ↗ Improving
            </span>
        `;

    }


    return "→ Stable";

}


/* ================= TOAST ================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            toast.classList.add(
                "hidden"
            );

        },
        2500
    );

}


/* ================= RENDER PAGE ================= */

function renderPage(page) {

    if (page === "dashboard") {

        updateDashboard();

    }


    if (page === "students") {

        renderStudents();

    }


    if (page === "analytics") {

        renderAnalytics();

    }


    if (page === "interventions") {

        renderInterventions();

    }


    if (page === "ai") {

        updateAIContext();

    }


    if (page === "reports") {

        renderReports();

    }

}


/* ================= AUTO LOGIN ================= */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        const loggedIn =
            localStorage.getItem(
                "edupulse_logged_in"
            );


        if (loggedIn === "true") {

            document
                .getElementById(
                    "loginPage"
                )
                .classList.add(
                    "hidden"
                );

            document
                .getElementById(
                    "app"
                )
                .classList.remove(
                    "hidden"
                );

            initializeApp();

        }

    }
);