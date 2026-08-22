/* =====================================================
   ANOMALIES.JS & AI AGENT & MISC PAGES
===================================================== */

function renderAnomalies() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">AI Detected Engagement Anomalies</h1>
            <p class="text-muted small mb-0">Automated signal detection flagging sudden drops in attendance or LMS streaks</p>
        </div>

        <div class="row g-3">
            <div class="col-md-12">
                <div class="card-box border-start border-4 border-danger p-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="fw-bold text-danger mb-0"><i class="bi bi-bell-fill me-2"></i> Attendance Drop Anomaly - Arjun Patel (25CS005)</h5>
                        <span class="badge bg-danger">Critical</span>
                    </div>
                    <p class="text-muted small mb-2">Attendance dropped by 18% over the last 14 days. LMS logins inactive for 6 consecutive days.</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="viewStudent360('25CS005')">Review Student Record</button>
                </div>
            </div>

            <div class="col-md-12">
                <div class="card-box border-start border-4 border-warning p-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="fw-bold text-warning mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i> Assignment Missed Streak - Y.Hemanth Reddy (25CS002)</h5>
                        <span class="badge bg-warning text-dark">Warning</span>
                    </div>
                    <p class="text-muted small mb-2">Missed last 2 lab assignment submissions. Midterm score trend shows 15% decline.</p>
                    <button class="btn btn-sm btn-outline-warning" onclick="viewStudent360('25CS002')">Review Student Record</button>
                </div>
            </div>
        </div>
    `;
}

function renderAIAgent() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="mb-3">
            <h1 class="h3 fw-bold mb-1">AI Student Intervention Assistant</h1>
            <p class="text-muted small mb-0">Ask questions about student engagement, generate summaries & action plans</p>
        </div>

        <div class="ai-agent-container">
            <div class="chat-history" id="chatHistory">
                <div class="chat-bubble bot">
                    Hello! I am your AI Student Intelligence Agent. You can ask me to summarize high-risk students, generate intervention lists, or check student attendance streaks.
                </div>
            </div>
            <div class="chat-input-bar">
                <input type="text" id="aiAgentInput" placeholder="Type your query (e.g., 'Which students need immediate mentoring?')...">
                <button class="primary-btn" onclick="sendAiQuery()">
                    <i class="bi bi-send-fill"></i> Ask AI
                </button>
            </div>
        </div>
    `;
}

function sendAiQuery() {
    const input = document.getElementById("aiAgentInput");
    const history = document.getElementById("chatHistory");
    if (!input || !history || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = "";

    // Append User Message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-bubble user";
    userMsg.textContent = userText;
    history.appendChild(userMsg);

    // Generate Intelligent Bot Response
    setTimeout(() => {
        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot";

        if (userText.toLowerCase().includes("risk") || userText.toLowerCase().includes("mentor")) {
            botMsg.innerHTML = "<strong>AI Analysis Summary:</strong><br>Found 2 students at High Academic Risk: <strong>Arjun Patel (72%)</strong> and <strong>Y.Hemanth Reddy (55%)</strong>. Recommended action: Schedule 1-on-1 counseling and assign a peer tutor.";
        } else if (userText.toLowerCase().includes("attendance")) {
            botMsg.innerHTML = "<strong>Attendance Report:</strong><br>Average batch attendance is <strong>75%</strong>. Arjun Patel is currently below mandatory cutoff at <strong>61%</strong>.";
        } else {
            botMsg.innerHTML = `<strong>AI Response:</strong><br>Analyzing signals for query: "${userText}". All system data synced with SQLite database.`;
        }

        history.appendChild(botMsg);
        history.scrollTop = history.scrollHeight;
    }, 600);
}

function renderNotifications() {
    const content = document.getElementById("pageContent");
    if (!content) return;
    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Intervention Alerts & Notifications</h1>
        </div>
        <div class="card-box p-4">
            <ul class="list-group list-group-flush">
                <li class="list-group-item">🚨 <strong>Attendance Alert:</strong> Arjun Patel missed 3 consecutive classes.</li>
                <li class="list-group-item">⚠️ <strong>Mentor Reminder:</strong> Mentoring session pending for Y.Hemanth Reddy.</li>
                <li class="list-group-item">✅ <strong>Intervention Complete:</strong> Mentoring logged for Sneha Rao.</li>
            </ul>
        </div>
    `;
}

function renderReports() {
    const content = document.getElementById("pageContent");
    if (!content) return;
    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Academic Reports & Exports</h1>
        </div>
        <div class="card-box p-4">
            <p>Generate downloadable PDF & Excel reports for department heads and faculty mentors.</p>
            <button class="primary-btn" onclick="alert('Exporting PDF Report...')"><i class="bi bi-file-earmark-pdf"></i> Download Risk Report (PDF)</button>
        </div>
    `;
}

function renderSettings() {
    const content = document.getElementById("pageContent");
    if (!content) return;
    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">System & Threshold Settings</h1>
        </div>
        <div class="card-box p-4">
            <div class="mb-3">
                <label class="form-label fw-bold">Attendance Warning Cutoff (%)</label>
                <input type="number" class="form-control" value="75" style="max-width: 200px;">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">High Risk Threshold Score</label>
                <input type="number" class="form-control" value="60" style="max-width: 200px;">
            </div>
            <button class="primary-btn" onclick="alert('Settings saved!')">Save Thresholds</button>
        </div>
    `;
}
