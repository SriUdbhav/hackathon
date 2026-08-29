/* =====================================================
   AIAGENT.JS
   Autonomous Agent Studio, Multi-Session Chat History,
   In-Chat Model Switcher & Result Reset Tools
   UAC: Students locked to own data, no model switching
        Faculty/Mentor can use AI but not change settings
===================================================== */

// Session Storage Keys
function getChatSessionsKey() {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const uid = user ? (user.id || user.username || "user") : "user";
    return "eduAiSessions_" + uid;
}

function getActiveSessionIdKey() {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const uid = user ? (user.id || user.username || "user") : "user";
    return "eduAiActiveSessId_" + uid;
}

// 1. Session & History Store Helpers
function loadAllAiSessions() {
    try {
        const key = getChatSessionsKey();
        const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored) || [];
        }
    } catch (e) {
        console.error("Error reading AI sessions:", e);
    }
    return [];
}

function saveAllAiSessions(sessions) {
    try {
        const key = getChatSessionsKey();
        const data = JSON.stringify(sessions || []);
        localStorage.setItem(key, data);
        sessionStorage.setItem(key, data);
    } catch (e) {
        console.error("Error saving AI sessions:", e);
    }
}

function getActiveSessionId() {
    try {
        const key = getActiveSessionIdKey();
        return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
    } catch (e) {
        return null;
    }
}

function setActiveSessionId(id) {
    try {
        const key = getActiveSessionIdKey();
        if (id) {
            sessionStorage.setItem(key, id);
            localStorage.setItem(key, id);
        } else {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        }
    } catch (e) {}
}

function loadChatConversationHistory() {
    const sessions = loadAllAiSessions();
    let activeId = getActiveSessionId();
    
    let activeSession = sessions.find(s => s.id === activeId);
    if (!activeSession && sessions.length > 0) {
        activeSession = sessions[0];
        activeId = activeSession.id;
        setActiveSessionId(activeId);
    }

    if (activeSession && Array.isArray(activeSession.messages)) {
        window.chatConversationHistory = activeSession.messages;
        window.currentAiSessionId = activeSession.id;
    } else {
        window.chatConversationHistory = [];
        window.currentAiSessionId = null;
    }
}

function saveChatConversationHistory() {
    const messages = window.chatConversationHistory || [];
    let sessions = loadAllAiSessions();
    let activeId = window.currentAiSessionId || getActiveSessionId();

    if (messages.length === 0) {
        return;
    }

    // Auto-generate title from first user query
    let title = "New Conversation";
    const firstUserMsg = messages.find(m => m.role === "user");
    if (firstUserMsg && firstUserMsg.content) {
        title = firstUserMsg.content.trim().slice(0, 45) + (firstUserMsg.content.length > 45 ? "..." : "");
    }

    const currentEngine = window.activeChatEngine || "gemini";
    const now = new Date();
    const timeStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!activeId) {
        activeId = "sess_" + Date.now();
        window.currentAiSessionId = activeId;
        setActiveSessionId(activeId);
        sessions.unshift({
            id: activeId,
            title: title,
            timestamp: timeStr,
            engine: currentEngine,
            messages: messages
        });
    } else {
        const idx = sessions.findIndex(s => s.id === activeId);
        if (idx >= 0) {
            sessions[idx].messages = messages;
            sessions[idx].title = title;
            sessions[idx].timestamp = timeStr;
            sessions[idx].engine = currentEngine;
            // Move to top
            const updated = sessions.splice(idx, 1)[0];
            sessions.unshift(updated);
        } else {
            sessions.unshift({
                id: activeId,
                title: title,
                timestamp: timeStr,
                engine: currentEngine,
                messages: messages
            });
        }
    }

    // Keep max 30 sessions in storage
    if (sessions.length > 30) {
        sessions = sessions.slice(0, 30);
    }

    saveAllAiSessions(sessions);
    updateHistoryCountBadge();
}

function updateHistoryCountBadge() {
    const badge = document.getElementById("aiHistoryCountBadge");
    if (badge) {
        const sessions = loadAllAiSessions();
        badge.textContent = sessions.length;
    }
}

// Initial load
loadChatConversationHistory();

if (!window.activeChatEngine) {
    window.activeChatEngine = null;
}

// =====================================================
// 2. MAIN PAGE RENDER
// =====================================================

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

    const showAutonomousLoop = !isStudent;
    const showModelSwitcher = isAdmin;
    const sessions = loadAllAiSessions();
    
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
        <!-- AI CONVERSATION HISTORY DRAWER (OFF-CANVAS) -->
        <div id="aiHistoryBackdrop" class="ai-history-backdrop" onclick="toggleAiHistoryDrawer(false)"></div>
        <div id="aiHistoryDrawer" class="ai-history-drawer">
            <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-clock-history fs-5 text-primary"></i>
                    <h5 class="fw-bold mb-0 text-dark">Chat History</h5>
                    <span class="badge bg-primary" id="aiHistoryDrawerBadge">${sessions.length}</span>
                </div>
                <button type="button" class="btn-close" onclick="toggleAiHistoryDrawer(false)" title="Close History"></button>
            </div>
            
            <div class="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                <button type="button" class="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-2" onclick="startNewAiChatSession(); toggleAiHistoryDrawer(false);">
                    <i class="bi bi-plus-lg"></i> Start New Conversation
                </button>
            </div>

            <div class="flex-grow-1 p-3 overflow-y-auto" id="aiSessionsListContainer">
                ${renderAiSessionsListHtml()}
            </div>

            <div class="p-3 border-top bg-light d-flex justify-content-between align-items-center">
                <button type="button" class="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1" onclick="clearAllAiSessions()">
                    <i class="bi bi-trash3"></i> Delete All History
                </button>
            </div>
        </div>

        <!-- PAGE HEADER -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
                <h1 class="h3 fw-bold mb-1">${assistantTitle}</h1>
                <p class="text-muted small mb-0">${assistantSubtitle}</p>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <button type="button" class="secondary-btn" onclick="toggleAiHistoryDrawer(true)" title="View Past Conversations">
                    <i class="bi bi-clock-history me-1 text-primary"></i> History 
                    <span class="badge bg-secondary ms-1" id="aiHistoryCountBadge">${sessions.length}</span>
                </button>
                ${showAutonomousLoop ? `
                    <button type="button" class="primary-btn bg-danger border-0 d-flex align-items-center gap-2" id="runAgentLoopBtn" onclick="triggerAutonomousAgentLoop(event)">
                        <i class="bi bi-play-circle-fill"></i> Run Autonomous Loop
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="row g-4" id="aiAgentLayoutRow">
            <!-- AUTONOMOUS AGENT ACTION TRACE STREAM (Faculty, Mentor & Admin) -->
            ${!isStudent ? `
                <div class="${window._chatIsExpanded ? 'col-lg-6 d-none' : 'col-lg-6'}" id="aiAgentTraceCol">
                    <div class="card-box p-4 h-100 d-flex flex-column">
                        <div class="card-head border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h3 class="d-flex align-items-center gap-2 mb-1">
                                    <i class="bi bi-cpu-fill text-primary"></i> 
                                    Agent Perception & Tools Stream
                                </h3>
                                <span class="text-muted small">Live trace of autonomous decisions and tool invocations</span>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-success" id="agentStatusBadge">${window._latestTracesBadge || 'Agent Idle & Ready'}</span>
                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearAutonomousAgentResults()" title="Reset Results & Clear Stream" style="font-size: 11.5px; border-radius: 8px;">
                                    <i class="bi bi-arrow-counterclockwise"></i> Reset
                                </button>
                            </div>
                        </div>

                        <div id="agentTraceContainer" class="flex-grow-1" style="max-height: calc(100vh - 300px); min-height: 480px; overflow-y: auto;">
                            ${window._latestTracesHtml || `
                                <div class="text-center py-5" style="color: var(--text-muted);">
                                    <i class="bi bi-cpu fs-1 d-block mb-3 text-primary"></i>
                                    <h5 style="color: var(--text);">Ready to Execute Autonomous Loop</h5>
                                    <p class="small" style="max-width: 420px; margin: auto; color: var(--text-soft);">
                                        Click <strong>"Run Autonomous Loop"</strong> to make the AI Agent inspect all students, diagnose root causes, and autonomously execute remediation tools.
                                    </p>
                                </div>
                            `}
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
                            <!-- New Chat Button -->
                            <button type="button" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onclick="startNewAiChatSession()" title="Start a fresh conversation">
                                <i class="bi bi-plus-lg"></i> <span class="d-none d-sm-inline">New Chat</span>
                            </button>

                            <!-- Chat History Button -->
                            <button type="button" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onclick="toggleAiHistoryDrawer(true)" title="Open Conversation History">
                                <i class="bi bi-clock-history"></i> <span class="d-none d-sm-inline">History</span>
                            </button>

                            <!-- Clear Active Chat Button -->
                            <button type="button" class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onclick="clearCurrentChat()" title="Clear Current Chat Result">
                                <i class="bi bi-trash3"></i> <span class="d-none d-sm-inline">Clear</span>
                            </button>

                            ${!isStudent ? `
                                <button type="button" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" id="btnToggleChatExpand" onclick="toggleChatExpand(event)" title="Toggle Wide Full View / Split View">
                                    <i class="bi ${window._chatIsExpanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'}" id="chatExpandIcon"></i> 
                                    <span id="chatExpandText" class="d-none d-sm-inline">${window._chatIsExpanded ? 'Split View' : 'Full View'}</span>
                                </button>
                            ` : ''}

                            ${showModelSwitcher ? `
                                <!-- IN-CHAT MODEL SELECTOR (Admin Only) -->
                                <select id="chatModelSelector" class="form-select form-select-sm" style="background: var(--bg-sunken); color: var(--text); border-color: var(--border); width: auto;" onchange="switchChatModel(this.value)">
                                    <option value="gemini">Google Gemini & Gemma</option>
                                    <option value="groq">Groq Cloud (Compound / GPT-OSS)</option>
                                    <option value="openrouter">OpenRouter Free Hub</option>
                                    <option value="ollama">Ollama (Local / Tunnel)</option>
                                    <option value="deepseek">DeepSeek Official API</option>
                                    <option value="openai">OpenAI (GPT-4o)</option>
                                    <option value="local">Local Heuristic Engine</option>
                                </select>
                            ` : ''}
                        </div>
                    </div>

                    <!-- CHAT MESSAGES STREAM -->
                    <div class="ai-chat-stream flex-grow-1 mb-3" id="chatHistory" style="overflow-y: auto;">
                        ${renderChatHistoryHtml()}
                    </div>

                    <!-- INPUT BAR -->
                    <div class="chat-input-bar d-flex gap-2">
                        <input type="text" id="aiAgentInput" class="form-control" placeholder="${isStudent ? 'Ask about your performance, study tips, exam prep...' : (isMentor ? 'Ask mentor radar (e.g. \'List students with high risk and recommend 1-on-1 counseling steps\')...' : 'Ask AI (e.g. \'Provide a comprehensive intervention plan for at-risk students\')...')}" onkeydown="if(event.key==='Enter') sendAiQuery()" style="background: var(--bg-sunken); color: var(--text); border: 1px solid var(--border);">
                        <button class="primary-btn px-4" onclick="sendAiQuery()" id="sendAiBtn" title="Send Query">
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

    // Render LaTeX math formulas in chat history
    setTimeout(() => {
        renderLatexInElement(document.getElementById("chatHistory"));
    }, 60);
}
window.renderAIAgent = renderAIAgent;

function renderLatexInElement(element) {
    if (!element) return;
    if (window.renderMathInElement) {
        try {
            renderMathInElement(element, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false,
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
            });
        } catch (e) {
            console.warn("KaTeX rendering notice:", e);
        }
    }
}
window.renderLatexInElement = renderLatexInElement;

// =====================================================
// 3. HISTORY DRAWER CONTROLLERS
// =====================================================

function toggleAiHistoryDrawer(open) {
    const drawer = document.getElementById("aiHistoryDrawer");
    const backdrop = document.getElementById("aiHistoryBackdrop");
    if (!drawer) return;

    const willOpen = typeof open === "boolean" ? open : !drawer.classList.contains("active");
    if (willOpen) {
        const container = document.getElementById("aiSessionsListContainer");
        if (container) container.innerHTML = renderAiSessionsListHtml();
        const badge = document.getElementById("aiHistoryDrawerBadge");
        if (badge) badge.textContent = loadAllAiSessions().length;
        
        drawer.classList.add("active");
        backdrop?.classList.add("active");
    } else {
        drawer.classList.remove("active");
        backdrop?.classList.remove("active");
    }
}
window.toggleAiHistoryDrawer = toggleAiHistoryDrawer;

function renderAiSessionsListHtml() {
    const sessions = loadAllAiSessions();
    const activeId = window.currentAiSessionId || getActiveSessionId();

    if (!sessions || sessions.length === 0) {
        return `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-chat-square-dots fs-1 d-block mb-2 text-secondary"></i>
                <h6 class="fw-semibold">No Saved Conversations</h6>
                <p class="small text-muted mb-0">Your conversation history with the AI Assistant will appear here.</p>
            </div>
        `;
    }

    return sessions.map((s) => {
        const isActive = s.id === activeId;
        const msgCount = Array.isArray(s.messages) ? s.messages.length : 0;
        const lastMsg = msgCount > 0 ? s.messages[msgCount - 1].content : "No messages";
        const preview = lastMsg.replace(/[#*`_]/g, "").slice(0, 80) + (lastMsg.length > 80 ? "..." : "");

        return `
            <div class="ai-session-card mb-2 ${isActive ? 'active' : ''}" onclick="loadAiSession('${s.id}')">
                <div class="d-flex justify-content-between align-items-start mb-1 gap-2">
                    <h6 class="ai-session-title mb-0 flex-grow-1">${s.title || 'Conversation'}</h6>
                    <button type="button" class="btn btn-sm btn-link text-danger p-0 border-0" onclick="deleteAiSession('${s.id}', event)" title="Delete session">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="ai-session-preview mb-2">${preview}</div>
                <div class="d-flex justify-content-between align-items-center text-muted" style="font-size: 11px;">
                    <span><i class="bi bi-clock me-1"></i>${s.timestamp || 'Recent'}</span>
                    <div class="d-flex gap-1 align-items-center">
                        <span class="badge border" style="font-size: 9.5px; background: var(--bg-elevated); color: var(--text);">${(s.engine || 'AI').toUpperCase()}</span>
                        <span class="badge bg-secondary" style="font-size: 9.5px;">${msgCount} msg${msgCount === 1 ? '' : 's'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function loadAiSession(sessionId) {
    const sessions = loadAllAiSessions();
    const target = sessions.find(s => s.id === sessionId);
    if (!target) return;

    window.chatConversationHistory = target.messages || [];
    window.currentAiSessionId = target.id;
    setActiveSessionId(target.id);

    const historyEl = document.getElementById("chatHistory");
    if (historyEl) {
        historyEl.innerHTML = renderChatHistoryHtml();
        historyEl.scrollTop = historyEl.scrollHeight;
        renderLatexInElement(historyEl);
    }

    toggleAiHistoryDrawer(false);
}
window.loadAiSession = loadAiSession;

function deleteAiSession(sessionId, event) {
    if (event) {
        event.stopPropagation();
    }
    let sessions = loadAllAiSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    saveAllAiSessions(sessions);

    if (window.currentAiSessionId === sessionId) {
        startNewAiChatSession();
    }

    const container = document.getElementById("aiSessionsListContainer");
    if (container) container.innerHTML = renderAiSessionsListHtml();
    updateHistoryCountBadge();
}
window.deleteAiSession = deleteAiSession;

async function clearAllAiSessions() {
    const ok = await showConfirmModal({
        title: "Clear AI Conversation History",
        message: "Are you sure you want to permanently delete all saved AI conversation sessions?",
        confirmText: "Clear All History",
        confirmBtnClass: "btn btn-danger",
        icon: "bi-trash3-fill text-danger"
    });
    if (!ok) return;

    saveAllAiSessions([]);
    startNewAiChatSession();
    toggleAiHistoryDrawer(false);
    updateHistoryCountBadge();
    showSuccessToast("AI chat history cleared.");
}
window.clearAllAiSessions = clearAllAiSessions;

// =====================================================
// 4. NEW CHAT & CLEAR RESULTS CONTROLLERS
// =====================================================

function startNewAiChatSession() {
    // If current chat had messages, save it to history before starting new
    if (window.chatConversationHistory && window.chatConversationHistory.length > 0) {
        saveChatConversationHistory();
    }

    // Reset active conversation
    window.chatConversationHistory = [];
    window.currentAiSessionId = null;
    setActiveSessionId(null);

    // Clear input
    const input = document.getElementById("aiAgentInput");
    if (input) input.value = "";

    // Re-render chat stream
    const historyEl = document.getElementById("chatHistory");
    if (historyEl) {
        historyEl.innerHTML = renderChatHistoryHtml();
    }
    updateHistoryCountBadge();
}
window.startNewAiChatSession = startNewAiChatSession;

function clearCurrentChat() {
    window.chatConversationHistory = [];
    
    // If active session exists, update it in storage
    if (window.currentAiSessionId) {
        let sessions = loadAllAiSessions();
        sessions = sessions.filter(s => s.id !== window.currentAiSessionId);
        saveAllAiSessions(sessions);
        window.currentAiSessionId = null;
        setActiveSessionId(null);
    }

    // Clear input
    const input = document.getElementById("aiAgentInput");
    if (input) input.value = "";

    // Re-render clean welcome stream
    const historyEl = document.getElementById("chatHistory");
    if (historyEl) {
        historyEl.innerHTML = renderChatHistoryHtml();
    }
    updateHistoryCountBadge();
}
window.clearCurrentChat = clearCurrentChat;
window.clearChatHistory = clearCurrentChat;

function clearAutonomousAgentResults() {
    const container = document.getElementById("agentTraceContainer");
    const badge = document.getElementById("agentStatusBadge");
    const btn = document.getElementById("runAgentLoopBtn");

    window._allTracesData = [];
    window._latestTracesHtml = null;
    window._latestTracesBadge = null;
    window._renderedTraceCount = 0;

    if (badge) {
        badge.className = "badge bg-success";
        badge.textContent = "Agent Idle & Ready";
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-play-circle-fill"></i> Run Autonomous Loop`;
    }

    if (container) {
        container.innerHTML = `
            <div class="text-center py-5" style="color: var(--text-muted);">
                <i class="bi bi-cpu fs-1 d-block mb-3 text-primary"></i>
                <h5 style="color: var(--text);">Ready to Execute Autonomous Loop</h5>
                <p class="small" style="max-width: 420px; margin: auto; color: var(--text-soft);">
                    Click <strong>"Run Autonomous Loop"</strong> to make the AI Agent inspect all students, diagnose root causes, and autonomously execute remediation tools.
                </p>
            </div>
        `;
    }
}
window.clearAutonomousAgentResults = clearAutonomousAgentResults;

// =====================================================
// 5. QUICK PROMPTS & CHAT HELPERS
// =====================================================

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

    return window.chatConversationHistory.map((msg) => {
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
window.copyAiBubbleText = copyAiBubbleText;

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

function switchChatModel(newModel) {
    window.activeChatEngine = newModel;
    const badge = document.getElementById("activeProviderBadge");
    if (badge) badge.textContent = `Model: ${newModel.toUpperCase()}`;
    
    // Save to settings in database so it persists across refreshes
    API.saveSettings({ ai_provider: newModel });
}
window.switchChatModel = switchChatModel;

// =====================================================
// 6. AUTONOMOUS CYCLE TRIGGER & BATCHING
// =====================================================

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

    if (container) {
        container.innerHTML = `
            <div class="ai-trace-card p-3 mb-3 border rounded" style="background: var(--bg-sunken); border-color: var(--border) !important;">
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="spinner-border spinner-border-sm text-primary"></span>
                    <h6 class="text-primary fw-bold mb-0">Multi-Signal Perception & Cohort Reasoning</h6>
                </div>
                <p class="small text-muted mb-0">Scanning attendance telemetry, LMS streaks, risk baseline, and subject failures across the full cohort...</p>
            </div>
        `;
    }

    try {
        const result = await API.runAutonomousAgent();

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-play-circle-fill"></i> Run Autonomous Loop`;
        }

        if (!result || !result.traces || result.traces.length === 0) {
            if (badge) {
                badge.className = "badge bg-success";
                badge.textContent = "Cohort Healthy";
            }
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-check-circle me-2"></i> All student signals are currently healthy. No autonomous interventions required.
                    </div>
                `;
            }
            return;
        }

        const actionsCount = result.actions_count || result.traces.length;

        if (badge) {
            badge.className = "badge bg-success";
            badge.textContent = `Completed (${actionsCount} Actions)`;
        }

        window._allTracesData = result.traces || [];
        window._renderedTraceCount = 0;
        renderNextTraceBatch(container, 15);

    } catch (err) {
        console.error("Autonomous Loop Error:", err);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-play-circle-fill"></i> Run Autonomous Loop`;
        }
        if (badge) {
            badge.className = "badge bg-danger";
            badge.textContent = "Error Occurred";
        }
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i> Encountered an issue running the autonomous loop. Please try again.
                </div>
            `;
        }
    }
}
window.triggerAutonomousAgentLoop = triggerAutonomousAgentLoop;

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

// =====================================================
// 7. SEND QUERY & MULTI-TURN CHAT
// =====================================================

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
    const userWrapper = document.createElement("div");
    userWrapper.className = "d-flex justify-content-end mb-3";
    userWrapper.innerHTML = `<div class="ai-bubble-user">${userText}</div>`;
    historyEl.appendChild(userWrapper);
    historyEl.scrollTop = historyEl.scrollHeight;

    // Show typing placeholder
    const currentEngine = window.activeChatEngine || "gemini";
    const typingBubble = document.createElement("div");
    typingBubble.className = "ai-bubble-bot mb-3 align-self-start";
    typingBubble.innerHTML = `<span class="spinner-border spinner-border-sm me-2" style="width: 14px; height: 14px;"></span> AI Assistant (${currentEngine.toUpperCase()}) is reasoning...`;
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

    const botWrapper = document.createElement("div");
    botWrapper.className = "d-flex justify-content-start mb-3";
    
    const parsedHtml = window.marked ? marked.parse(responseContent) : responseContent.replace(/\n/g, '<br>');
    const encodedText = encodeURIComponent(responseContent || "");
    botWrapper.innerHTML = `
        <div class="ai-bubble-bot">
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
        </div>
    `;
    historyEl.appendChild(botWrapper);
    renderLatexInElement(botWrapper);
    historyEl.scrollTop = historyEl.scrollHeight;
}

// Window Exports for AI Agent Studio
window.renderAIAgent = renderAIAgent;
window.sendAiQuery = sendAiQuery;
window.toggleAiHistoryDrawer = toggleAiHistoryDrawer;
window.loadAiSession = loadAiSession;
window.deleteAiSession = deleteAiSession;
window.clearAllAiSessions = clearAllAiSessions;
window.startNewAiChatSession = startNewAiChatSession;
window.clearCurrentChat = clearCurrentChat;
window.clearAutonomousAgentResults = clearAutonomousAgentResults;
window.setQuickAiPrompt = setQuickAiPrompt;
window.copyAiBubbleText = copyAiBubbleText;
window.toggleChatExpand = toggleChatExpand;
window.switchChatModel = switchChatModel;
window.triggerAutonomousAgentLoop = triggerAutonomousAgentLoop;
window.renderNextTraceBatch = renderNextTraceBatch;
