/* =====================================================
   AIAGENT.JS
   Autonomous Agent Studio, In-Chat Model Switcher,
   Persistent Context & Multi-turn Chat
   UAC: Students locked to own data, no model switching
        Faculty can use AI but not change settings
===================================================== */

// Persistent chat conversation history across renders and model switches
if (!window.chatConversationHistory) {
    window.chatConversationHistory = [];
}
if (!window.activeChatEngine) {
    window.activeChatEngine = null;
}

function renderAIAgent() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const isAdmin = role === "admin";
    const isStudent = role === "student";

    // Students and faculty can use AI chat but not autonomous loop or model switching
    const showAutonomousLoop = isAdmin;
    const showModelSwitcher = isAdmin;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
                <h1 class="h3 fw-bold mb-1">${isStudent ? 'AI Academic Assistant' : 'Autonomous AI Agent Studio'}</h1>
                <p class="text-muted small mb-0">${isStudent ? 'Ask questions about your academic performance, study tips, and more' : 'Multi-Signal Perception, Reasoning Engine & Autonomous Tool Execution'}</p>
            </div>
            ${showAutonomousLoop ? `
                <button class="primary-btn bg-danger border-0" id="runAgentLoopBtn" onclick="triggerAutonomousAgentLoop()">
                    <i class="bi bi-play-circle-fill"></i> Run Autonomous Intervention Loop
                </button>
            ` : ''}
        </div>

        <div class="row g-4">
            <!-- AUTONOMOUS AGENT ACTION TRACE STREAM (hidden for students) -->
            ${!isStudent ? `
                <div class="col-lg-7">
                    <div class="card-box p-4 h-100">
                        <div class="card-head border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h3 class="d-flex align-items-center gap-2">
                                    <i class="bi bi-cpu-fill text-primary"></i> 
                                    Agent Perception & Tool Calling Stream
                                </h3>
                                <span class="text-muted small">Live trace of autonomous decisions and tool invocations</span>
                            </div>
                            <span class="badge bg-success" id="agentStatusBadge">Agent Idle & Ready</span>
                        </div>

                        <div id="agentTraceContainer" style="max-height: 520px; overflow-y: auto;">
                            <div class="text-center py-5" style="color: var(--text-muted);">
                                <i class="bi bi-cpu fs-1 d-block mb-3 text-primary"></i>
                                <h5 style="color: var(--text);">Ready to Execute Autonomous Loop</h5>
                                <p class="small" style="max-width: 420px; margin: auto; color: var(--text-soft);">
                                    ${isAdmin ? 'Click <strong>"Run Autonomous Intervention Loop"</strong> to make the AI Agent inspect all students, diagnose root causes, and autonomously execute tools.' : 'Only administrators can run the autonomous intervention loop. You can use the chat assistant to query student data.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- INTERACTIVE LLM CHAT ASSISTANT -->
            <div class="${isStudent ? 'col-lg-12' : 'col-lg-5'}">
                <div class="card-box p-4 d-flex flex-column" style="height: ${isStudent ? '560px' : '620px'};">
                    <!-- CHAT HEADER -->
                    <div class="card-head border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h3 class="d-flex align-items-center gap-2 mb-1">
                                <i class="bi bi-chat-left-text text-info"></i> ${isStudent ? 'My AI Assistant' : 'Faculty AI Assistant'}
                            </h3>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge border small" id="activeProviderBadge" style="background: var(--bg-sunken); color: var(--text);">Model: Loading...</span>
                            </div>
                        </div>

                        <div class="d-flex align-items-center gap-2">
                            ${showModelSwitcher ? `
                                <!-- IN-CHAT MODEL SELECTOR (Admin Only) -->
                                <select id="chatModelSelector" class="form-select form-select-sm" style="background: var(--bg-sunken); color: var(--text); border-color: var(--border); width: auto;" onchange="switchChatModel(this.value)">
                                    <option value="gemini">Google Gemini</option>
                                    <option value="ollama">Local Ollama (Offline LLM)</option>
                                    <option value="groq">Groq (Llama 3.1)</option>
                                    <option value="openai">OpenAI (GPT-4o)</option>
                                    <option value="local">Local Agent (Rule-Based)</option>
                                </select>
                            ` : ''}

                            <button class="btn btn-sm" style="background: var(--bg-sunken); color: var(--text-soft); border: 1px solid var(--border);" onclick="clearChatHistory()" title="Clear Conversation">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                    </div>

                    <!-- CHAT MESSAGES STREAM -->
                    <div class="ai-chat-stream flex-grow-1 mb-3" id="chatHistory" style="overflow-y: auto;">
                        ${renderChatHistoryHtml()}
                    </div>

                    <!-- INPUT BAR -->
                    <div class="chat-input-bar d-flex gap-2">
                        <input type="text" id="aiAgentInput" class="form-control" placeholder="${isStudent ? 'Ask about your performance, study tips...' : 'Ask AI (e.g. \'Summarize students needing urgent tutoring\')...'}" onkeydown="if(event.key==='Enter') sendAiQuery()" style="background: var(--bg-sunken); color: var(--text); border: 1px solid var(--border);">
                        <button class="primary-btn px-3" onclick="sendAiQuery()" id="sendAiBtn">
                            <i class="bi bi-send-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Sync Model Selector cleanly with database settings
    API.getSettings().then(settings => {
        const selector = document.getElementById("chatModelSelector");
        const badge = document.getElementById("activeProviderBadge");
        const prov = (settings && settings.ai_provider) ? settings.ai_provider : (window.activeChatEngine || "gemini");
        window.activeChatEngine = prov;
        if (selector) selector.value = prov;
        if (badge) badge.textContent = `Model: ${prov.toUpperCase()}`;
    });
}

function renderChatHistoryHtml() {
    const user = getCurrentUser();
    const isStudent = (user?.role || "").toLowerCase() === "student";

    if (!window.chatConversationHistory || window.chatConversationHistory.length === 0) {
        return `
            <div class="d-flex justify-content-start mb-2">
                <div class="ai-bubble-bot">
                    <div class="fw-bold mb-2 text-primary small d-flex align-items-center gap-2">
                        <i class="bi bi-stars fs-6"></i> AI Academic Assistant
                    </div>
                    <div class="markdown-body small" style="color: var(--text);">
                        Hello! I am your <strong>AI Academic Assistant</strong> for EduStudent Sight.
                        ${isStudent 
                            ? 'You can ask me about your academic performance, study strategies, attendance status, or career guidance.'
                            : 'You can ask me to analyze at-risk students, suggest customized intervention plans, or review attendance patterns.'
                        }
                        <br><br>
                        <em style="color: var(--text-soft);">Try asking: "${isStudent ? 'How is my attendance this semester?' : 'Which students need urgent intervention?'}"</em>
                    </div>
                </div>
            </div>
        `;
    }

    return window.chatConversationHistory.map(msg => {
        if (msg.role === "user") {
            return `
                <div class="d-flex justify-content-end mb-3">
                    <div class="ai-bubble-user">
                        ${msg.content}
                    </div>
                </div>
            `;
        } else {
            const parsed = window.marked ? marked.parse(msg.content) : msg.content.replace(/\n/g, '<br>');
            return `
                <div class="d-flex justify-content-start mb-3">
                    <div class="ai-bubble-bot">
                        <div class="fw-bold mb-2 text-primary small d-flex align-items-center gap-2">
                            <i class="bi bi-stars fs-6"></i> AI Academic Assistant 
                            <span class="badge border ms-1" style="font-size: 10px; background: var(--bg-sunken); color: var(--text);">${(msg.engine || 'AI').toUpperCase()}</span>
                        </div>
                        <div class="markdown-body small" style="color: var(--text);">
                            ${parsed}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join("");
}

function switchChatModel(newModel) {
    window.activeChatEngine = newModel;
    const badge = document.getElementById("activeProviderBadge");
    if (badge) badge.textContent = `Model: ${newModel.toUpperCase()}`;
    
    // Save to settings in database so it persists across refreshes
    API.saveSettings({ ai_provider: newModel });
}

function clearChatHistory() {
    if (confirm("Clear current conversation history?")) {
        window.chatConversationHistory = [];
        const historyEl = document.getElementById("chatHistory");
        if (historyEl) historyEl.innerHTML = renderChatHistoryHtml();
    }
}

// 1. Trigger Full Autonomous Cycle
async function triggerAutonomousAgentLoop() {
    const btn = document.getElementById("runAgentLoopBtn");
    const badge = document.getElementById("agentStatusBadge");
    const container = document.getElementById("agentTraceContainer");

    if (btn) btn.disabled = true;
    if (badge) {
        badge.className = "badge bg-warning text-dark";
        badge.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Agent Reasoning & Calling Tools...`;
    }

    container.innerHTML = `
        <div class="ai-trace-card p-3 mb-3">
            <h6 class="text-primary fw-bold mb-1"><i class="bi bi-eye"></i> Step 1: Perceiving Academic Indicators</h6>
            <p class="small text-muted mb-0">Scanning attendance %, LMS streaks, assessment marks, and past risk baseline...</p>
        </div>
    `;

    const result = await API.runAutonomousAgent();

    if (badge) {
        badge.className = "badge bg-success";
        badge.textContent = `Completed (${result.actions_count || 0} Actions Executed)`;
    }
    if (btn) btn.disabled = false;

    if (!result || !result.traces || result.traces.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-check-circle me-2"></i> All student signals are currently healthy. No autonomous interventions required.
            </div>
        `;
        return;
    }

    container.innerHTML = result.traces.map((trace, idx) => {
        const reasoningHtml = window.marked ? marked.parse(trace.reasoning) : trace.reasoning.replace(/\n/g, '<br>');
        return `
            <div class="stat-card-modern ${trace.perceptions.risk_score.includes('7') || trace.perceptions.risk_score.includes('6') ? 'accent-red' : 'accent-yellow'} mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="fw-bold mb-0 text-dark">${trace.student_name} <span class="badge bg-secondary fs-6 ms-1">${trace.student_id}</span></h5>
                    <span class="badge bg-dark">${trace.timestamp}</span>
                </div>

                <!-- PERCEPTION SIGNALS -->
                <div class="d-flex gap-2 mb-2 flex-wrap">
                    <span class="badge bg-light text-dark border">Attd: ${trace.perceptions.attendance}</span>
                    <span class="badge bg-light text-dark border">CGPA: ${trace.perceptions.cgpa}</span>
                    <span class="badge bg-light text-dark border">LMS: ${trace.perceptions.lms_score}</span>
                    <span class="badge bg-danger">Risk: ${trace.perceptions.risk_score}</span>
                </div>

                <!-- AGENT REASONING -->
                <div class="p-3 mb-3 bg-light rounded small border markdown-body">
                    <strong class="d-block mb-1 text-dark"><i class="bi bi-lightbulb-fill text-warning me-1"></i> Agent Reasoning & Diagnosis:</strong>
                    ${reasoningHtml}
                </div>

                <!-- AUTONOMOUS TOOLS EXECUTED -->
                <h6 class="fw-bold small text-muted mb-2"><i class="bi bi-gear-wide-connected text-primary me-1"></i> Autonomous Tools Executed:</h6>
                <div class="d-flex flex-column gap-1">
                    ${trace.tools_called.map(t => `
                        <div class="p-2 bg-success bg-opacity-10 border border-success rounded text-success small d-flex align-items-center">
                            <i class="bi bi-check-circle-fill me-2 fs-6 flex-shrink-0"></i>
                            <div>
                                <strong>[Tool Call: ${t.tool}()]</strong> - ${t.result}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }).join("");

    loadLatestStudents();
}

// 2. Interactive Multi-turn Chat
async function sendAiQuery() {
    const input = document.getElementById("aiAgentInput");
    const historyEl = document.getElementById("chatHistory");
    const sendBtn = document.getElementById("sendAiBtn");
    if (!input || !historyEl || !input.value.trim()) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const isStudent = role === "student";

    let userText = input.value.trim();
    input.value = "";

    // UAC: For students, prefix queries with context so AI only reasons about their own data
    let queryToSend = userText;
    if (isStudent) {
        const studentId = user.linked_student_id || user.id;
        queryToSend = `[STUDENT CONTEXT: This query is from student ${studentId} (${user.display_name || studentId}). Only provide information about this specific student. Do not reveal other students' data.] ${userText}`;
    }

    // Append to conversation state
    window.chatConversationHistory.push({ role: "user", content: userText });

    // Render User message
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user mb-2 p-3 bg-primary text-white rounded shadow-sm text-end align-self-end";
    userBubble.textContent = userText;
    historyEl.appendChild(userBubble);
    historyEl.scrollTop = historyEl.scrollHeight;

    // Show typing placeholder
    const currentEngine = window.activeChatEngine || "gemini";
    const typingBubble = document.createElement("div");
    typingBubble.className = "ai-bubble-bot mb-2 p-2 small align-self-start";
    typingBubble.innerHTML = `<span class="spinner-border spinner-border-sm me-1" style="width: 14px; height: 14px;"></span> AI Assistant (${currentEngine.toUpperCase()}) is reasoning...`;
    historyEl.appendChild(typingBubble);
    historyEl.scrollTop = historyEl.scrollHeight;
    if (sendBtn) sendBtn.disabled = true;

    // Pass prior history (excluding current message)
    const historyPayload = window.chatConversationHistory.slice(0, -1);

    // Call Backend API
    const res = await API.sendAgentChat(queryToSend, historyPayload, currentEngine);
    typingBubble.remove();
    if (sendBtn) sendBtn.disabled = false;

    const responseContent = res.response || "No response received.";
    window.chatConversationHistory.push({ role: "assistant", content: responseContent, engine: currentEngine });

    const botBubble = document.createElement("div");
    botBubble.className = "ai-bubble-bot mb-2 align-self-start";
    
    const parsedHtml = window.marked ? marked.parse(responseContent) : responseContent.replace(/\n/g, '<br>');
    botBubble.innerHTML = `
        <div class="fw-bold mb-1 text-primary small d-flex align-items-center gap-1">
            <i class="bi bi-stars"></i> AI Academic Assistant <span class="badge border ms-1" style="font-size: 9px; background: var(--bg-sunken); color: var(--text);">${currentEngine.toUpperCase()}</span>
        </div>
        <div class="markdown-body small" style="color: var(--text);">
            ${parsedHtml}
        </div>
    `;
    historyEl.appendChild(botBubble);
    historyEl.scrollTop = historyEl.scrollHeight;
}
