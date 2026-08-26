/* =====================================================
   AIAGENT.JS
   Autonomous Agent Studio, In-Chat Model Switcher,
   Persistent Context & Multi-turn Chat
   UAC: Students locked to own data, no model switching
        Faculty can use AI but not change settings
===================================================== */

// Persistent chat conversation history across renders and model switches
function getChatStorageKey() {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const uid = user ? (user.id || user.username || "user") : "user";
    return "eduAiChatHistory_" + uid;
}

function loadChatConversationHistory() {
    try {
        const key = getChatStorageKey();
        const stored = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (stored) {
            window.chatConversationHistory = JSON.parse(stored);
            return;
        }
    } catch (e) {
        console.error("Error loading chat history from storage:", e);
    }
    if (!window.chatConversationHistory) {
        window.chatConversationHistory = [];
    }
}

function saveChatConversationHistory() {
    try {
        const key = getChatStorageKey();
        const data = JSON.stringify(window.chatConversationHistory || []);
        sessionStorage.setItem(key, data);
        localStorage.setItem(key, data);
    } catch (e) {
        console.error("Error saving chat history to storage:", e);
    }
}

// Initial load
loadChatConversationHistory();

if (!window.activeChatEngine) {
    window.activeChatEngine = null;
}

function renderAIAgent() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    // Load any saved conversation for active user
    loadChatConversationHistory();

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const isAdmin = role === "admin";
    const isStudent = role === "student";
    const isMentor = role === "mentor";

    // Faculty, Mentor, and Admin can run the autonomous intervention loop; Students get the personalized assistant
    const showAutonomousLoop = !isStudent;
    const showModelSwitcher = isAdmin;
    
    // Assistant title per role
    let assistantTitle = "Faculty AI Assistant";
    let assistantSubtitle = "Multi-Signal Perception, Reasoning Engine & Academic Diagnostics";
    if (isStudent) {
        assistantTitle = "My AI Academic Assistant";
        assistantSubtitle = "Personalized academic performance insights, exam prep, and study plans";
    } else if (isMentor) {
        assistantTitle = "Mentor AI Advisory Assistant";
        assistantSubtitle = "At-risk student diagnostic radar, counseling strategies, and recovery plans";
    } else if (isAdmin) {
        assistantTitle = "Autonomous AI Agent Studio";
        assistantSubtitle = "Multi-Signal Perception, Reasoning Engine & Autonomous Tool Execution";
    }

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
                <h1 class="h3 fw-bold mb-1">${assistantTitle}</h1>
                <p class="text-muted small mb-0">${assistantSubtitle}</p>
            </div>
            ${showAutonomousLoop ? `
                <button type="button" class="primary-btn bg-danger border-0 d-flex align-items-center gap-2" id="runAgentLoopBtn" onclick="triggerAutonomousAgentLoop(event)">
                    <i class="bi bi-play-circle-fill"></i> Run Autonomous Intervention Loop
                </button>
            ` : ''}
        </div>

        <div class="row g-4" id="aiAgentLayoutRow">
            <!-- AUTONOMOUS AGENT ACTION TRACE STREAM (Faculty, Mentor & Admin) -->
            ${!isStudent ? `
                <div class="${window._chatIsExpanded ? 'col-lg-6 d-none' : 'col-lg-6'}" id="aiAgentTraceCol">
                    <div class="card-box p-4 h-100">
                        <div class="card-head border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <h3 class="d-flex align-items-center gap-2 mb-1">
                                    <i class="bi bi-cpu-fill text-primary"></i> 
                                    Agent Perception & Tool Calling Stream
                                </h3>
                                <span class="text-muted small">Live trace of autonomous decisions and tool invocations</span>
                            </div>
                            <span class="badge bg-success" id="agentStatusBadge">Agent Idle & Ready</span>
                        </div>

                        <div id="agentTraceContainer" style="max-height: calc(100vh - 300px); min-height: 480px; overflow-y: auto;">
                            <div class="text-center py-5" style="color: var(--text-muted);">
                                <i class="bi bi-cpu fs-1 d-block mb-3 text-primary"></i>
                                <h5 style="color: var(--text);">Ready to Execute Autonomous Loop</h5>
                                <p class="small" style="max-width: 420px; margin: auto; color: var(--text-soft);">
                                    Click <strong>"Run Autonomous Intervention Loop"</strong> to make the AI Agent inspect all students, diagnose root causes, and autonomously execute tools.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- INTERACTIVE LLM CHAT ASSISTANT -->
            <div class="${isStudent || window._chatIsExpanded ? 'col-lg-12' : 'col-lg-6'}" id="aiAgentChatCol">
                <div class="card-box p-4 d-flex flex-column" id="aiAgentChatCard" style="height: calc(100vh - 200px); min-height: 680px;">
                    <!-- CHAT HEADER -->
                    <div class="card-head border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div class="d-flex align-items-center gap-2">
                            <h3 class="d-flex align-items-center gap-2 mb-0">
                                <i class="bi bi-chat-left-text text-info"></i> ${assistantTitle}
                            </h3>
                            <span class="badge border small ms-1" id="activeProviderBadge" style="background: var(--bg-sunken); color: var(--text); font-size: 11px;">Model: Loading...</span>
                        </div>

                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            ${!isStudent ? `
                                <button type="button" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" id="btnToggleChatExpand" onclick="toggleChatExpand(event)" title="Toggle Wide Full View / Split View">
                                    <i class="bi ${window._chatIsExpanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'}" id="chatExpandIcon"></i> 
                                    <span id="chatExpandText" class="d-none d-sm-inline">${window._chatIsExpanded ? 'Split View' : 'Full View'}</span>
                                </button>
                            ` : ''}

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

                            <button type="button" class="btn btn-sm" style="background: var(--bg-sunken); color: var(--text-soft); border: 1px solid var(--border);" onclick="clearChatHistory()" title="Clear Conversation">
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
                        <input type="text" id="aiAgentInput" class="form-control" placeholder="${isStudent ? 'Ask about your performance, study tips, exam prep...' : (isMentor ? 'Ask mentor radar (e.g. \'List students with high risk and recommend 1-on-1 counseling steps\')...' : 'Ask AI (e.g. \'Provide a comprehensive intervention plan for at-risk students\')...')}" onkeydown="if(event.key==='Enter') sendAiQuery()" style="background: var(--bg-sunken); color: var(--text); border: 1px solid var(--border);">
                        <button class="primary-btn px-4" onclick="sendAiQuery()" id="sendAiBtn">
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

function setQuickAiPrompt(text) {
    const input = document.getElementById("aiAgentInput");
    if (input) {
        input.value = text;
        sendAiQuery();
    }
}
window.setQuickAiPrompt = setQuickAiPrompt;

function renderChatHistoryHtml() {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const isStudent = role === "student";
    const isMentor = role === "mentor";

    if (!window.chatConversationHistory || window.chatConversationHistory.length === 0) {
        let pills = [];
        if (isStudent) {
            pills = [
                "How is my attendance and exam eligibility?",
                "Provide a study plan to improve my CGPA",
                "Which of my subjects need the most attention?"
            ];
        } else if (isMentor) {
            pills = [
                "List all high-risk students needing priority outreach",
                "Recommend 1-on-1 counseling topics for at-risk students",
                "Draft an attendance recovery agreement template"
            ];
        } else {
            pills = [
                "Which students are at highest risk in our cohort?",
                "Analyze correlation between attendance and internal marks",
                "Draft a comprehensive remediation strategy for low-performing students"
            ];
        }

        return `
            <div class="d-flex justify-content-start mb-2">
                <div class="ai-bubble-bot">
                    <div class="fw-bold mb-2 text-primary small d-flex align-items-center gap-2">
                        <i class="bi bi-stars fs-6"></i> AI Academic Assistant
                    </div>
                    <div class="markdown-body small" style="color: var(--text);">
                        Hello! I am your <strong>AI Academic Assistant</strong> for EduStudent Sight.
                        ${isStudent 
                            ? 'You can ask me about your personalized academic performance, study strategies, attendance status, or subject-specific guidance.'
                            : (isMentor 
                                ? 'You can ask me to triage high-risk students, prepare 1-on-1 counseling plans, or formulate recovery pathways.'
                                : 'You can ask me to analyze cohort-wide at-risk signals, evaluate subject marks, or draft targeted remediation plans.'
                            )
                        }
                    </div>

                    <div class="mt-3 pt-2 border-top">
                        <div class="text-muted small mb-2"><i class="bi bi-lightning-charge text-warning me-1"></i> Quick Prompts (Click to Ask):</div>
                        <div class="d-flex flex-wrap gap-2">
                            ${pills.map(p => `
                                <button type="button" class="btn btn-sm" style="background: var(--bg-sunken); border: 1px solid var(--border); font-size: 11.5px; border-radius: 20px; color: var(--text);" onclick="setQuickAiPrompt('${p.replace(/'/g, "\\'")}')">
                                    <i class="bi bi-chat-quote me-1 text-primary"></i> ${p}
                                </button>
                            `).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    return window.chatConversationHistory.map((msg, idx) => {
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
            const encodedText = encodeURIComponent(msg.content || "");
            return `
                <div class="d-flex justify-content-start mb-3">
                    <div class="ai-bubble-bot">
                        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <div class="fw-bold text-primary small d-flex align-items-center gap-2">
                                <i class="bi bi-stars fs-6"></i> AI Academic Assistant 
                                <span class="badge border ms-1" style="font-size: 10px; background: var(--bg-sunken); color: var(--text);">${(msg.engine || 'AI').toUpperCase()}</span>
                            </div>
                            <button class="btn btn-sm btn-light border py-0 px-2 text-muted copy-ai-btn" onclick="copyAiBubbleText(this)" data-content="${encodedText}" style="font-size: 11px;" title="Copy complete generated answer to clipboard">
                                <i class="bi bi-clipboard me-1"></i> Copy Full Answer
                            </button>
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

function toggleChatExpand() {
    window._chatIsExpanded = !window._chatIsExpanded;
    const traceCol = document.getElementById("aiAgentTraceCol");
    const chatCol = document.getElementById("aiAgentChatCol");
    const chatCard = document.getElementById("aiAgentChatCard");
    const icon = document.getElementById("chatExpandIcon");
    const text = document.getElementById("chatExpandText");

    if (window._chatIsExpanded) {
        if (traceCol) traceCol.classList.add("d-none");
        if (chatCol) {
            chatCol.classList.remove("col-lg-5");
            chatCol.classList.add("col-lg-12");
        }
        if (chatCard) {
            chatCard.style.height = "calc(100vh - 200px)";
            chatCard.style.minHeight = "680px";
        }
        if (icon) icon.className = "bi bi-arrows-angle-contract";
        if (text) text.textContent = "Split View";
    } else {
        if (traceCol) traceCol.classList.remove("d-none");
        if (chatCol) {
            chatCol.classList.remove("col-lg-12");
            chatCol.classList.add("col-lg-5");
        }
        if (chatCard) {
            chatCard.style.height = "640px";
            chatCard.style.minHeight = "520px";
        }
        if (icon) icon.className = "bi bi-arrows-angle-expand";
        if (text) text.textContent = "Expand View";
    }
}

function copyAiBubbleText(btn) {
    try {
        const encoded = btn.getAttribute("data-content");
        const rawText = decodeURIComponent(encoded);
        navigator.clipboard.writeText(rawText).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = `<i class="bi bi-check2 text-success me-1"></i> Copied!`;
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        });
    } catch (e) {
        console.error("Clipboard copy failed:", e);
    }
}

function toggleChatExpand(e) {
    if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
        e.stopPropagation();
    }
    window._chatIsExpanded = !window._chatIsExpanded;
    const traceCol = document.getElementById("aiAgentTraceCol");
    const chatCol = document.getElementById("aiAgentChatCol");
    const btnText = document.getElementById("chatExpandText");
    const btnIcon = document.getElementById("chatExpandIcon");
    
    if (traceCol && chatCol) {
        if (window._chatIsExpanded) {
            traceCol.classList.add("d-none");
            chatCol.classList.remove("col-lg-6");
            chatCol.classList.add("col-lg-12");
            if (btnText) btnText.textContent = "Split View";
            if (btnIcon) btnIcon.className = "bi bi-arrows-angle-contract";
        } else {
            traceCol.classList.remove("d-none");
            chatCol.classList.remove("col-lg-12");
            chatCol.classList.add("col-lg-6");
            if (btnText) btnText.textContent = "Full View";
            if (btnIcon) btnIcon.className = "bi bi-arrows-angle-expand";
        }
    }
}
window.toggleChatExpand = toggleChatExpand;
window.copyAiBubbleText = copyAiBubbleText;

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
        try {
            const key = getChatStorageKey();
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        } catch (e) {}
        const historyEl = document.getElementById("chatHistory");
        if (historyEl) historyEl.innerHTML = renderChatHistoryHtml();
    }
}

// 1. Trigger Full Autonomous Cycle
async function triggerAutonomousAgentLoop(event) {
    if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
        event.stopPropagation();
    }
    const btn = document.getElementById("runAgentLoopBtn");
    const badge = document.getElementById("agentStatusBadge");
    const container = document.getElementById("agentTraceContainer");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Reasoning Across Cohort...`;
    }
    if (badge) {
        badge.className = "badge bg-warning text-dark";
        badge.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Agent Reasoning & Calling Tools...`;
    }

    container.innerHTML = `
        <div class="ai-trace-card p-3 mb-3 border rounded" style="background: var(--bg-sunken); border-color: var(--border) !important;">
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="spinner-border spinner-border-sm text-primary"></span>
                <h6 class="text-primary fw-bold mb-0">Multi-Signal Perception & Cohort Reasoning</h6>
            </div>
            <p class="small text-muted mb-0">Scanning attendance telemetry, LMS streaks, risk baseline, and subject failures across the full cohort...</p>
        </div>
    `;

    try {
        const result = await API.runAutonomousAgent();

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-play-circle-fill"></i> Run Autonomous Intervention Loop`;
        }

        if (!result || !result.traces || result.traces.length === 0) {
            if (badge) {
                badge.className = "badge bg-success";
                badge.textContent = "Cohort Healthy";
            }
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-check-circle me-2"></i> All student signals are currently healthy. No autonomous interventions required.
                </div>
            `;
            return;
        }

        const actionsCount = result.actions_count || result.traces.length;

        if (badge) {
            badge.className = "badge bg-success";
            badge.textContent = `Completed (${actionsCount} Actions Executed)`;
        }

        window._allTracesData = result.traces || [];
        window._renderedTraceCount = 0;
        renderNextTraceBatch(container, 15);

    } catch (err) {
        console.error("Autonomous Loop Error:", err);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-play-circle-fill"></i> Run Autonomous Intervention Loop`;
        }
        if (badge) {
            badge.className = "badge bg-danger";
            badge.textContent = "Error Occurred";
        }
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i> Encountered an issue running the autonomous loop. Please try again.
            </div>
        `;
    }
}

function renderNextTraceBatch(container, batchSize = 15) {
    if (!container) container = document.getElementById("agentTraceContainer");
    if (!container || !window._allTracesData) return;

    const traces = window._allTracesData;
    const start = window._renderedTraceCount || 0;
    const nextTraces = traces.slice(start, start + batchSize);
    if (nextTraces.length === 0) return;

    const existingMoreBtn = document.getElementById("agentLoadMoreTracesBtn");
    if (existingMoreBtn) existingMoreBtn.remove();

    const htmlChunks = nextTraces.map((trace) => {
        const reasoningHtml = window.marked ? marked.parse(trace.reasoning) : trace.reasoning.replace(/\n/g, '<br>');
        const isHigh = trace.risk_level === 'High' || parseFloat(trace.perceptions.risk_score) >= 60 || parseFloat(trace.perceptions.attendance) < 65;
        const isMed = !isHigh && (trace.risk_level === 'Medium' || parseFloat(trace.perceptions.risk_score) >= 30 || parseFloat(trace.perceptions.attendance) < 75);
        
        const cardAccent = isHigh ? 'accent-red' : (isMed ? 'accent-yellow' : 'accent-green');
        const riskBadgeClass = isHigh ? 'bg-danger' : (isMed ? 'bg-warning text-dark' : 'bg-success');
        const riskTierName = isHigh ? 'High Risk Tier' : (isMed ? 'Medium Risk Tier' : 'Low Risk Tier');

        return `
            <div class="stat-card-modern ${cardAccent} mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                    <div class="d-flex align-items-center gap-2">
                        <h5 class="fw-bold mb-0 text-dark">${trace.student_name}</h5>
                        <span class="badge bg-secondary fs-6">${trace.student_id}</span>
                        <span class="badge ${riskBadgeClass}">${riskTierName}</span>
                    </div>
                    <span class="badge bg-dark">${trace.timestamp}</span>
                </div>

                <!-- PERCEPTION SIGNALS -->
                <div class="d-flex gap-2 mb-2 flex-wrap">
                    <span class="badge bg-light text-dark border">Attd: ${trace.perceptions.attendance}</span>
                    <span class="badge bg-light text-dark border">CGPA: ${trace.perceptions.cgpa}</span>
                    <span class="badge bg-light text-dark border">LMS: ${trace.perceptions.lms_score}</span>
                    <span class="badge ${riskBadgeClass}">Risk: ${trace.perceptions.risk_score}</span>
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

    if (start === 0) {
        container.innerHTML = htmlChunks;
    } else {
        container.insertAdjacentHTML('beforeend', htmlChunks);
    }

    window._renderedTraceCount = start + nextTraces.length;

    if (window._renderedTraceCount < traces.length) {
        const remaining = traces.length - window._renderedTraceCount;
        const loadMoreHtml = `
            <div id="agentLoadMoreTracesBtn" class="text-center my-3">
                <button type="button" class="btn btn-sm btn-outline-primary px-4 py-2" onclick="renderNextTraceBatch(null, 25)">
                    <i class="bi bi-plus-circle me-1"></i> Load Next 25 Flagged Students (${remaining} Remaining)
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', loadMoreHtml);
    }

    window._latestTracesHtml = container.innerHTML;
    const badge = document.getElementById("agentStatusBadge");
    window._latestTracesBadge = badge ? badge.textContent : "";
}
window.renderNextTraceBatch = renderNextTraceBatch;

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
    saveChatConversationHistory();

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
    saveChatConversationHistory();

    const botBubble = document.createElement("div");
    botBubble.className = "ai-bubble-bot mb-2 align-self-start";
    
    const parsedHtml = window.marked ? marked.parse(responseContent) : responseContent.replace(/\n/g, '<br>');
    const encodedText = encodeURIComponent(responseContent || "");
    botBubble.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div class="fw-bold text-primary small d-flex align-items-center gap-2">
                <i class="bi bi-stars fs-6"></i> AI Academic Assistant 
                <span class="badge border ms-1" style="font-size: 10px; background: var(--bg-sunken); color: var(--text);">${currentEngine.toUpperCase()}</span>
            </div>
            <button class="btn btn-sm btn-light border py-0 px-2 text-muted copy-ai-btn" onclick="copyAiBubbleText(this)" data-content="${encodedText}" style="font-size: 11px;" title="Copy complete generated answer to clipboard">
                <i class="bi bi-clipboard me-1"></i> Copy Full Answer
            </button>
        </div>
        <div class="markdown-body small" style="color: var(--text);">
            ${parsedHtml}
        </div>
    `;
    historyEl.appendChild(botBubble);
    historyEl.scrollTop = historyEl.scrollHeight;
}
