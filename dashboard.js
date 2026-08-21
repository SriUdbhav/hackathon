/* ==========================================
   STUDENTIQ DASHBOARD ENGINE
========================================== */


/* ==========================================
   AUTH CHECK
========================================== */

const currentUser =
    JSON.parse(
        localStorage.getItem(
            "studentiq_current_user"
        )
    );


if (!currentUser) {

    window.location.href =
        "index.html";

}


/* ==========================================
   SAMPLE STUDENTS
========================================== */

let students =
    JSON.parse(
        localStorage.getItem(
            "studentiq_students"
        )
    ) || [

        {
            id: "STU001",
            name: "Rahul Kumar",
            email: "rahul@college.edu",
            department: "CSE",
            year: "1st Year",
            section: "A",
            cgpa: 6.2,
            credits: 24,
            attendance: 64,
            marks: 48,
            lms: 32,
            assignments: 3,
            totalAssignments: 6,
            trend: "down"
        },

        {
            id: "STU002",
            name: "Ananya Reddy",
            email: "ananya@college.edu",
            department: "CSE",
            year: "1st Year",
            section: "A",
            cgpa: 8.4,
            credits: 28,
            attendance: 86,
            marks: 78,
            lms: 89,
            assignments: 6,
            totalAssignments: 6,
            trend: "up"
        },

        {
            id: "STU003",
            name: "Kiran Varma",
            email: "kiran@college.edu",
            department: "ECE",
            year: "2nd Year",
            section: "B",
            cgpa: 6.8,
            credits: 42,
            attendance: 71,
            marks: 57,
            lms: 48,
            assignments: 4,
            totalAssignments: 6,
            trend: "down"
        },

        {
            id: "STU004",
            name: "Sneha Rao",
            email: "sneha@college.edu",
            department: "IT",
            year: "2nd Year",
            section: "A",
            cgpa: 9.1,
            credits: 46,
            attendance: 94,
            marks: 91,
            lms: 96,
            assignments: 6,
            totalAssignments: 6,
            trend: "up"
        },

        {
            id: "STU005",
            name: "Arjun Sai",
            email: "arjun@college.edu",
            department: "CSE",
            year: "1st Year",
            section: "B",
            cgpa: 7.3,
            credits: 26,
            attendance: 77,
            marks: 63,
            lms: 64,
            assignments: 5,
            totalAssignments: 6,
            trend: "stable"
        }

    ];


let completed =
    JSON.parse(
        localStorage.getItem(
            "studentiq_completed"
        )
    ) || [];


let notifications =
    JSON.parse(
        localStorage.getItem(
            "studentiq_notifications"
        )
    ) || [];


/* ==========================================
   SAVE
========================================== */

function saveData() {

    localStorage.setItem(
        "studentiq_students",
        JSON.stringify(students)
    );

    localStorage.setItem(
        "studentiq_completed",
        JSON.stringify(completed)
    );

    localStorage.setItem(
        "studentiq_notifications",
        JSON.stringify(notifications)
    );

}


/* ==========================================
   HELPERS
========================================== */

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


function average(values) {

    if (!values.length) {

        return 0;

    }

    return (
        values.reduce(
            (a, b) =>
                a + Number(b),
            0
        ) / values.length
    );

}


/* ==========================================
   AI RISK ENGINE
========================================== */

function riskScore(student) {

    const assignmentPercent =
        student.totalAssignments
            ? (
                student.assignments /
                student.totalAssignments
            ) * 100
            : 0;


    return (

        student.attendance * 0.30 +

        student.marks * 0.25 +

        student.lms * 0.15 +

        assignmentPercent * 0.10 +

        student.cgpa * 10 * 0.15 +

        Math.min(
            student.credits,
            100
        ) * 0.05

    );

}


function getRisk(student) {

    const score =
        riskScore(student);


    if (score < 55) {

        return "High";

    }


    if (score < 72) {

        return "Medium";

    }


    return "Low";

}


function analyzeStudent(student) {

    student.risk =
        getRisk(student);

}


function analyzeAll() {

    students.forEach(
        student =>
            analyzeStudent(student)
    );

}


/* ==========================================
   AI EXPLANATION
========================================== */

function explanation(student) {

    const reasons = [];


    if (
        student.attendance < 75
    ) {

        reasons.push(
            `attendance is ${student.attendance}%`
        );

    }


    if (
        student.cgpa < 7
    ) {

        reasons.push(
            `CGPA is ${student.cgpa.toFixed(2)}`
        );

    }


    if (
        student.marks < 60
    ) {

        reasons.push(
            `marks are ${student.marks}%`
        );

    }


    if (
        student.lms < 60
    ) {

        reasons.push(
            `LMS engagement is ${student.lms}%`
        );

    }


    const assignmentPercent =
        (
            student.assignments /
            student.totalAssignments
        ) * 100;


    if (
        assignmentPercent < 75
    ) {

        reasons.push(
            `assignment completion is ${Math.round(
                assignmentPercent
            )}%`
        );

    }


    if (!reasons.length) {

        return "No significant negative academic signals detected.";

    }


    return reasons.join(", ") + ".";

}


function recommendation(student) {

    if (
        student.attendance < 70
    ) {

        return "Schedule a mentor meeting and create an attendance recovery plan.";

    }


    if (
        student.cgpa < 7
    ) {

        return "Create a subject-wise academic recovery plan.";

    }


    if (
        student.marks < 60
    ) {

        return "Recommend subject-wise academic support.";

    }


    if (
        student.lms < 60
    ) {

        return "Encourage LMS engagement and monitor weekly activity.";

    }


    return "Continue monitoring the student.";

}


/* ==========================================
   RISK BADGE
========================================== */

function riskBadge(risk) {

    return `
        <span class="risk ${risk.toLowerCase()}">
            ${risk}
        </span>
    `;

}


/* ==========================================
   DASHBOARD
========================================== */

function renderDashboard() {

    analyzeAll();


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


    const cgpa =
        average(
            students.map(
                s => s.cgpa
            )
        );


    const credits =
        average(
            students.map(
                s => s.credits
            )
        );


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
        "averageCGPA"
    ).textContent =
        cgpa.toFixed(2);


    document.getElementById(
        "averageCredits"
    ).textContent =
        `${credits.toFixed(1)} average credits`;


    document.getElementById(
        "studentCountSide"
    ).textContent =
        total;


    document.getElementById(
        "lowRisk"
    ).textContent =
        low;


    document.getElementById(
        "mediumRisk2"
    ).textContent =
        medium;


    document.getElementById(
        "highRisk2"
    ).textContent =
        high;


    document.getElementById(
        "healthyPercent"
    ).textContent =
        total
            ? Math.round(
                low /
                total *
                100
            ) + "%"
            : "0%";


    document.getElementById(
        "dashboardInsight"
    ).textContent =
        high
            ? `${high} student(s) require immediate mentor attention.`
            : "Student population is currently stable.";


    renderPriority();

    renderDashboardTable();

}


/* ==========================================
   PRIORITY
========================================== */

function renderPriority() {

    const list =
        document.getElementById(
            "priorityList"
        );


    const priority =
        students
            .filter(
                s => s.risk !== "Low"
            )
            .sort(
                (a, b) =>
                    riskScore(a) -
                    riskScore(b)
            )
            .slice(0, 5);


    if (!priority.length) {

        list.innerHTML =
            `<p class="text-secondary">
                No students require immediate attention.
            </p>`;

        return;

    }


    list.innerHTML =
        priority
            .map(
                student => `

                <div class="priority-item">

                    <div class="avatar">
                        ${initials(student.name)}
                    </div>

                    <div class="person">

                        <b>
                            ${student.name}
                        </b>

                        <small>
                            ${student.id}
                            •
                            ${student.department}
                            •
                            ${student.year}
                        </small>

                    </div>

                    ${riskBadge(student.risk)}

                    <button
                        class="table-action"
                        onclick="
                            viewStudent('${student.id}')
                        "
                    >
                        View
                    </button>

                </div>

            `
            )
            .join("");

}


/* ==========================================
   DASHBOARD TABLE
========================================== */

function renderDashboardTable() {

    document.getElementById(
        "dashboardTable"
    ).innerHTML =

        students
            .slice(0, 7)
            .map(
                student => `

                <tr>

                    <td>

                        <div class="table-person">

                            <div class="avatar">
                                ${initials(student.name)}
                            </div>

                            <div>

                                <b>
                                    ${student.name}
                                </b>

                                <small>
                                    ${student.id}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${student.attendance}%
                    </td>


                    <td>
                        ${student.cgpa.toFixed(2)}
                    </td>


                    <td>
                        ${student.credits}
                    </td>


                    <td>
                        ${student.lms}%
                    </td>


                    <td>
                        ${riskBadge(student.risk)}
                    </td>


                    <td>

                        <button
                            class="table-action"
                            onclick="
                                viewStudent('${student.id}')
                            "
                        >
                            View
                        </button>

                    </td>

                </tr>

            `
            )
            .join("");

}


/* ==========================================
   STUDENT DIRECTORY
========================================== */

function renderStudents() {

    analyzeAll();


    const search =
        (
            document.getElementById(
                "studentSearch"
            )?.value || ""
        ).toLowerCase();


    const risk =
        document.getElementById(
            "riskFilter"
        )?.value ||
        "All Risk";


    const department =
        document.getElementById(
            "departmentFilter"
        )?.value ||
        "All Departments";


    const filtered =
        students.filter(
            student => {

                const searchMatch =
                    !search ||
                    (
                        student.name +
                        student.id +
                        student.department
                    )
                        .toLowerCase()
                        .includes(search);


                const riskMatch =
                    risk === "All Risk" ||
                    student.risk === risk;


                const departmentMatch =
                    department ===
                        "All Departments" ||
                    student.department ===
                        department;


                return (
                    searchMatch &&
                    riskMatch &&
                    departmentMatch
                );

            }
        );


    document.getElementById(
        "studentsTable"
    ).innerHTML =

        filtered
            .map(
                student => `

                <tr>

                    <td>

                        <div class="table-person">

                            <div class="avatar">
                                ${initials(student.name)}
                            </div>

                            <div>

                                <b>
                                    ${student.name}
                                </b>

                                <small>
                                    ${student.id}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>

                        ${student.department}

                        <br>

                        <small>
                            ${student.year}
                            •
                            Section ${student.section}
                        </small>

                    </td>


                    <td>
                        ${student.attendance}%
                    </td>


                    <td>
                        ${student.cgpa.toFixed(2)}
                    </td>


                    <td>
                        ${student.credits}
                    </td>


                    <td>
                        ${student.marks}%
                    </td>


                    <td>
                        ${student.lms}%
                    </td>


                    <td>
                        ${riskBadge(student.risk)}
                    </td>


                    <td>

                        <button
                            class="table-action"
                            onclick="
                                viewStudent('${student.id}')
                            "
                        >
                            View
                        </button>

                        <button
                            class="delete-action"
                            onclick="
                                deleteStudent('${student.id}')
                            "
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `
            )
            .join("");

}


/* ==========================================
   ANALYTICS
========================================== */

function renderAnalytics() {

    const signals = [

        [
            "Attendance",
            average(
                students.map(
                    s => s.attendance
                )
            )
        ],

        [
            "CGPA",
            average(
                students.map(
                    s => s.cgpa
                )
            ) * 10
        ],

        [
            "Marks",
            average(
                students.map(
                    s => s.marks
                )
            )
        ],

        [
            "LMS",
            average(
                students.map(
                    s => s.lms
                )
            )
        ]

    ];


    document.getElementById(
        "analyticsBars"
    ).innerHTML =

        signals
            .map(
                item => `

                <div class="analytics-row">

                    <span>
                        ${item[0]}
                    </span>

                    <div class="bar-track">

                        <div
                            class="bar-fill"
                            style="
                                width:
                                ${Math.round(
                                    item[1]
                                )}%;
                            "
                        ></div>

                    </div>

                    <b>
                        ${Math.round(item[1])}%
                    </b>

                </div>

            `
            )
            .join("");


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
            .sort(
                (a, b) =>
                    riskScore(a) -
                    riskScore(b)
            )
            .map(
                student => `

                <div class="reason-item">

                    <div class="avatar">
                        ${initials(student.name)}
                    </div>

                    <div>

                        <b>
                            ${student.name}
                        </b>

                        ${riskBadge(student.risk)}

                        <p>
                            ${explanation(student)}
                        </p>

                    </div>

                </div>

            `
            )
            .join("");

}


/* ==========================================
   INTERVENTIONS
========================================== */

function renderInterventions() {

    const risky =
        students.filter(
            s => s.risk !== "Low"
        );


    document.getElementById(
        "openInterventions"
    ).textContent =
        risky.length -
        completed.length >
        0
            ? risky.length -
              completed.length
            : 0;


    document.getElementById(
        "completedInterventions"
    ).textContent =
        completed.length;


    document.getElementById(
        "followUps"
    ).textContent =
        risky.length;


    document.getElementById(
        "successRate"
    ).textContent =
        risky.length
            ? Math.round(
                completed.length /
                risky.length *
                100
            ) + "%"
            : "0%";


    document.getElementById(
        "interventionList"
    ).innerHTML =

        risky
            .map(
                student => {

                    const done =
                        completed.includes(
                            student.id
                        );


                    return `

                    <div class="intervention-item">

                        <div class="avatar">
                            ${initials(student.name)}
                        </div>

                        <div class="intervention-main">

                            <b>
                                ${student.name}
                            </b>

                            ${riskBadge(student.risk)}

                            <p>
                                ${recommendation(student)}
                            </p>

                            <small>
                                AI evidence:
                                ${explanation(student)}
                            </small>

                        </div>

                        <button
                            class="done-button"
                            onclick="
                                toggleIntervention('${student.id}')
                            "
                        >
                            ${
                                done
                                    ? "✓ Done"
                                    : "Mark Done"
                            }
                        </button>

                    </div>

                    `;

                }
            )
            .join("");

}


/* ==========================================
   REPORTS
========================================== */

function renderReports() {

    document.getElementById(
        "reportStudents"
    ).textContent =
        students.length;


    document.getElementById(
        "reportCGPA"
    ).textContent =
        average(
            students.map(
                s => s.cgpa
            )
        ).toFixed(2);


    document.getElementById(
        "reportSuccess"
    ).textContent =
        students.length
            ? Math.round(
                completed.length /
                students.length *
                100
            ) + "%"
            : "0%";

}


/* ==========================================
   AGENT
========================================== */

function renderAgent() {

    document.getElementById(
        "agentContext"
    ).textContent =

        `${students.length} students monitored. ${
            students.filter(
                s => s.risk === "High"
            ).length
        } high risk. ${
            students.filter(
                s => s.risk === "Medium"
            ).length
        } medium risk.`;

}


function generateAIAnswer(question) {

    const q =
        question.toLowerCase();


    const high =
        students
            .filter(
                s => s.risk === "High"
            )
            .sort(
                (a, b) =>
                    riskScore(a) -
                    riskScore(b)
            );


    if (
        q.includes("who") ||
        q.includes("attention")
    ) {

        if (!high.length) {

            return `
                No high-risk students are currently detected.
            `;

        }


        return `

            I identified
            <b>${high.length} high-risk student(s)</b>.

            <br><br>

            ${high
                .map(
                    s =>
                        `• ${s.name} — ${s.risk} risk`
                )
                .join("<br>")}

            <br><br>

            <b>Top priority:</b>
            ${high[0].name}

            <br>

            ${explanation(high[0])}

            <br><br>

            <b>Recommended action:</b>
            ${recommendation(high[0])}

        `;

    }


    if (
        q.includes("highest") ||
        q.includes("risk")
    ) {

        const student =
            high[0] ||
            students[0];


        return `

            <b>${student.name}</b>
            is currently
            <b>${student.risk} risk</b>.

            <br><br>

            <b>AI evidence:</b>

            <br>

            ${explanation(student)}

            <br><br>

            <b>Recommendation:</b>

            <br>

            ${recommendation(student)}

        `;

    }


    if (
        q.includes("intervention")
    ) {

        return `

            <b>AI Intervention Plan</b>

            <br><br>

            1. Identify the student's strongest
            negative signal.

            <br>

            2. Assign a faculty mentor.

            <br>

            3. Create a personalized recovery plan.

            <br>

            4. Schedule a follow-up.

            <br>

            5. Recalculate risk after the intervention.

            <br><br>

            This creates the agentic loop:

            <br>

            <b>
                Observe → Reason → Act → Learn
            </b>

        `;

    }


    if (
        q.includes("summary") ||
        q.includes("weekly")
    ) {

        const avgCGPA =
            average(
                students.map(
                    s => s.cgpa
                )
            );


        const avgAttendance =
            average(
                students.map(
                    s => s.attendance
                )
            );


        return `

            <b>Weekly Academic Summary</b>

            <br><br>

            Students monitored:
            <b>${students.length}</b>

            <br>

            High risk:
            <b>${high.length}</b>

            <br>

            Average CGPA:
            <b>${avgCGPA.toFixed(2)}</b>

            <br>

            Average attendance:
            <b>${Math.round(
                avgAttendance
            )}%</b>

            <br><br>

            The AI recommends focusing first on
            high-risk students with attendance and
            CGPA deterioration.

        `;

    }


    return `

        I can analyze your student population.

        <br><br>

        Try:

        <br>

        • Who needs attention?

        <br>

        • Explain highest risk student

        <br>

        • Give intervention suggestions

        <br>

        • Give weekly summary

    `;

}


function askAI(question) {

    addChatMessage(
        question,
        "user"
    );


    setTimeout(
        () => {

            addChatMessage(
                generateAIAnswer(
                    question
                ),
                "ai"
            );

        },
        400
    );

}


function addChatMessage(
    text,
    type
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    const message =
        document.createElement(
            "div"
        );


    message.className =
        type === "user"
            ? "user-message"
            : "ai-message";


    if (type === "ai") {

        message.innerHTML = `

            <div class="chat-avatar">
                <i class="bi bi-stars"></i>
            </div>

            <div>
                <b>StudentIQ AI</b>
                <p>${text}</p>
            </div>

        `;

    } else {

        message.innerHTML = `

            <div class="chat-avatar">
                U
            </div>

            <div>
                ${text}
            </div>

        `;

    }


    container.appendChild(
        message
    );


    container.scrollTop =
        container.scrollHeight;

}


document
    .getElementById(
        "chatForm"
    )
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const input =
                document.getElementById(
                    "chatInput"
                );


            const value =
                input.value.trim();


            if (!value) {

                return;

            }


            askAI(value);

            input.value = "";

        }
    );


/* ==========================================
   NAVIGATION
========================================== */

const pageTitles = {

    dashboard:
        "Academic Intelligence Center",

    students:
        "Student Directory",

    analytics:
        "Risk Analytics",

    interventions:
        "AI Intervention Center",

    agent:
        "StudentIQ AI Agent",

    reports:
        "Academic Reports",

    settings:
        "Workspace Settings"

};


function openPage(page) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            section =>
                section.classList.remove(
                    "active"
                )
        );


    const section =
        document.getElementById(
            `page-${page}`
        );


    if (!section) {

        return;

    }


    section.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            ".side-link"
        )
        .forEach(
            link => {

                link.classList.toggle(
                    "active",
                    link.dataset.page ===
                        page
                );

            }
        );


    document.getElementById(
        "breadcrumb"
    ).textContent =
        page.charAt(0).toUpperCase() +
        page.slice(1);


    document.getElementById(
        "pageTitle"
    ).textContent =
        pageTitles[page];


    if (page === "students") {

        renderStudents();

    }

    if (page === "analytics") {

        renderAnalytics();

    }

    if (page === "interventions") {

        renderInterventions();

    }

    if (page === "reports") {

        renderReports();

    }

    if (page === "agent") {

        renderAgent();

    }

}


document
    .querySelectorAll(
        ".side-link"
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                function() {

                    openPage(
                        this.dataset.page
                    );

                }
            );

        }
    );


/* ==========================================
   ADD STUDENT
========================================== */

function openStudentModal() {

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "studentModal"
            )
        );


    modal.show();

}


document
    .getElementById(
        "studentForm"
    )
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const student = {

                id:
                    "STU" +
                    String(
                        students.length + 1
                    ).padStart(
                        3,
                        "0"
                    ),

                name:
                    document.getElementById(
                        "studentName"
                    ).value,

                email:
                    document.getElementById(
                        "studentEmail"
                    ).value,

                department:
                    document.getElementById(
                        "studentDepartment"
                    ).value,

                year:
                    document.getElementById(
                        "studentYear"
                    ).value,

                section:
                    document.getElementById(
                        "studentSection"
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

                marks:
                    Number(
                        document.getElementById(
                            "studentMarks"
                        ).value
                    ),

                lms:
                    Number(
                        document.getElementById(
                            "studentLMS"
                        ).value
                    ),

                assignments:
                    Number(
                        document.getElementById(
                            "studentAssignments"
                        ).value
                    ),

                totalAssignments:
                    Number(
                        document.getElementById(
                            "studentTotalAssignments"
                        ).value
                    ),

                trend:
                    "stable"

            };


            analyzeStudent(
                student
            );


            students.unshift(
                student
            );


            saveData();

            renderAll();


            bootstrap.Modal
                .getInstance(
                    document.getElementById(
                        "studentModal"
                    )
                )
                .hide();


            this.reset();


            addNotification(
                "Student Added",
                `${student.name} was analyzed by the AI engine.`
            );


            showToast(
                `${student.name} added successfully`
            );


            openPage(
                "students"
            );

        }
    );


/* ==========================================
   DELETE
========================================== */

function deleteStudent(id) {

    const student =
        students.find(
            s => s.id === id
        );


    if (!student) {

        return;

    }


    const confirmed =
        confirm(
            `Delete ${student.name}?`
        );


    if (!confirmed) {

        return;

    }


    students =
        students.filter(
            s => s.id !== id
        );


    completed =
        completed.filter(
            x => x !== id
        );


    saveData();

    renderAll();


    showToast(
        `${student.name} deleted`
    );


    addNotification(
        "Student Removed",
        `${student.name} was removed from monitoring.`
    );

}


/* ==========================================
   PROFILE
========================================== */

function viewStudent(id) {

    const student =
        students.find(
            s => s.id === id
        );


    if (!student) {

        return;

    }


    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "profileModal"
            )
        );


    document.getElementById(
        "profileContent"
    ).innerHTML = `

        <div class="modal-header">

            <div>

                <span>
                    STUDENT PROFILE
                </span>

                <h5>
                    ${student.name}
                </h5>

            </div>

            <button
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
            ></button>

        </div>


        <div class="modal-body">

            <div class="d-flex align-items-center gap-3">

                <div class="avatar">
                    ${initials(student.name)}
                </div>

                <div>

                    <strong>
                        ${student.id}
                    </strong>

                    <div class="text-secondary small">

                        ${student.department}
                        •
                        ${student.year}
                        •
                        Section ${student.section}

                    </div>

                </div>

                <div class="ms-auto">
                    ${riskBadge(student.risk)}
                </div>

            </div>


            <div class="row g-2 mt-3">

                <div class="col-md-3">

                    <div class="mini-stat">

                        <span>CGPA</span>

                        <strong>
                            ${student.cgpa.toFixed(2)}
                        </strong>

                    </div>

                </div>


                <div class="col-md-3">

                    <div class="mini-stat">

                        <span>Credits</span>

                        <strong>
                            ${student.credits}
                        </strong>

                    </div>

                </div>


                <div class="col-md-3">

                    <div class="mini-stat">

                        <span>Attendance</span>

                        <strong>
                            ${student.attendance}%
                        </strong>

                    </div>

                </div>


                <div class="col-md-3">

                    <div class="mini-stat">

                        <span>LMS</span>

                        <strong>
                            ${student.lms}%
                        </strong>

                    </div>

                </div>

            </div>


            <div class="ai-insight mt-3">

                <div>

                    <b>
                        ✦ AI EXPLANATION
                    </b>

                    <p>
                        ${explanation(student)}
                    </p>

                    <b>
                        ✦ RECOMMENDATION
                    </b>

                    <p>
                        ${recommendation(student)}
                    </p>

                </div>

            </div>

        </div>


        <div class="modal-footer">

            <button
                class="delete-action"
                onclick="
                    bootstrap.Modal
                    .getInstance(
                        document.getElementById(
                            'profileModal'
                        )
                    )
                    .hide();

                    deleteStudent(
                        '${student.id}'
                    );
                "
            >
                Delete Student
            </button>

            <button
                class="btn-secondary-custom"
                data-bs-dismiss="modal"
            >
                Close
            </button>

        </div>

    `;


    modal.show();

}


/* ==========================================
   INTERVENTIONS
========================================== */

function toggleIntervention(id) {

    if (
        completed.includes(id)
    ) {

        completed =
            completed.filter(
                x => x !== id
            );

    } else {

        completed.push(id);

        const student =
            students.find(
                s => s.id === id
            );


        addNotification(
            "Intervention Completed",
            `${student.name}'s intervention was completed.`
        );

    }


    saveData();

    renderAll();

}


/* ==========================================
   NOTIFICATIONS
========================================== */

function addNotification(
    title,
    message
) {

    notifications.unshift({

        title,

        message,

        time:
            new Date()
                .toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

    });


    notifications =
        notifications.slice(
            0,
            15
        );


    saveData();

    renderNotifications();

}


function renderNotifications() {

    document.getElementById(
        "notificationCount"
    ).textContent =
        notifications.length;


    const container =
        document.getElementById(
            "notificationList"
        );


    if (!notifications.length) {

        container.innerHTML =
            `
                <div class="p-3 text-secondary small">
                    No notifications.
                </div>
            `;

        return;

    }


    container.innerHTML =
        notifications
            .map(
                item => `

                <div class="notification-item">

                    <i
                        class="bi bi-stars"
                        style="
                            color:var(--cyan)
                        "
                    ></i>

                    <div>

                        <b>
                            ${item.title}
                        </b>

                        <p>
                            ${item.message}
                        </p>

                        <small>
                            ${item.time}
                        </small>

                    </div>

                </div>

            `
            )
            .join("");

}


function toggleNotifications() {

    document
        .getElementById(
            "notificationPanel"
        )
        .classList.toggle(
            "d-none"
        );

}


function clearNotifications() {

    notifications = [];

    saveData();

    renderNotifications();

}


/* ==========================================
   RANDOM AI NOTIFICATIONS
========================================== */

function randomNotification() {

    const messages = [

        "AI completed a new academic signal scan.",

        "Student engagement data was refreshed.",

        "Academic health score recalculated.",

        "AI priority queue updated.",

        "New attendance pattern detected.",

        "LMS engagement analysis completed."

    ];


    const high =
        students.filter(
            s => s.risk === "High"
        );


    if (high.length) {

        messages.push(
            `${high[0].name} requires mentor attention.`
        );

    }


    const message =
        messages[
            Math.floor(
                Math.random() *
                messages.length
            )
        ];


    addNotification(
        "StudentIQ AI",
        message
    );

}


setInterval(
    randomNotification,
    15000
);


/* ==========================================
   SEARCH
========================================== */

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


document
    .getElementById(
        "departmentFilter"
    )
    .addEventListener(
        "change",
        renderStudents
    );


/* ==========================================
   CSV
========================================== */

function exportCSV() {

    let csv =
        "ID,Name,Email,Department,Year,Section,CGPA,Credits,Attendance,Marks,LMS,Risk\n";


    students.forEach(
        student => {

            csv +=
                `${student.id},` +
                `"${student.name}",` +
                `${student.email},` +
                `${student.department},` +
                `${student.year},` +
                `${student.section},` +
                `${student.cgpa},` +
                `${student.credits},` +
                `${student.attendance},` +
                `${student.marks},` +
                `${student.lms},` +
                `${student.risk}\n`;

        }
    );


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
        "studentiq-report.csv";

    link.click();

    URL.revokeObjectURL(
        url
    );

}


/* ==========================================
   TOAST
========================================== */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.style.display =
        "block";


    setTimeout(
        () => {

            toast.style.display =
                "none";

        },
        2500
    );

}


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    localStorage.removeItem(
        "studentiq_current_user"
    );


    window.location.href =
        "index.html";

}


/* ==========================================
   USER
========================================== */

function loadUser() {

    if (!currentUser) {

        return;

    }


    document.getElementById(
        "userName"
    ).textContent =
        currentUser.name;


    document.getElementById(
        "userInitial"
    ).textContent =
        initials(
            currentUser.name
        );

}


/* ==========================================
   RENDER ALL
========================================== */

function renderAll() {

    analyzeAll();

    saveData();

    renderDashboard();

    renderStudents();

    renderAnalytics();

    renderInterventions();

    renderReports();

    renderAgent();

    renderNotifications();

}


/* ==========================================
   INITIALIZE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadUser();


        analyzeAll();


        if (!notifications.length) {

            addNotification(
                "StudentIQ AI Online",
                "Academic intelligence agent is ready."
            );

        }


        renderAll();

    }
);