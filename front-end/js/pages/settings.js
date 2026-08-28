/* =====================================================
   SETTINGS.JS
   Dynamic System Settings, AI Engine Configuration,
   Live Threshold Recalculations & Security Management
   UAC: AI settings only visible to admin
===================================================== */

async function renderSettings() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Fetch existing settings from backend SQLite
    const settings = await API.getSettings() || {};

    const provider = settings.ai_provider || "local";
    const apiKey = settings.api_key || "";
    const baseUrl = settings.api_base_url || "";
    const modelName = settings.model_name || "";

    // Dynamic Thresholds
    const safeCutoff = settings.safe_risk_threshold || "30";
    const highCutoff = settings.high_risk_threshold || "65";
    const criticalCutoff = settings.critical_risk_threshold || "80";
    const attdCutoff = settings.attendance_threshold || "75";
    const riskCgpaCutoff = settings.risk_cgpa_threshold || "7.5";
    const lmsCutoff = settings.lms_threshold || "60";
    const assignCutoff = settings.assignment_threshold || "70";

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1" style="color: var(--text);">System & Academic Intelligence Configuration</h1>
            <p class="text-muted small mb-0">Customize dynamic risk classification tiers, base academic benchmarks, and AI engine parameters with live recalculation</p>
        </div>

        <div class="row g-4">
            <!-- 1. DYNAMIC RISK & BENCHMARK THRESHOLDS -->
            <div class="${role === 'admin' ? 'col-lg-7' : 'col-lg-8'}">
                <div class="card-box h-100 p-4">
                    <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                        <div class="d-flex align-items-center gap-2">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--risk-high-soft); display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-sliders text-danger fs-5"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-0" style="color: var(--text);">Dynamic Risk & Signal Thresholds</h5>
                                <small class="text-muted">Changes instantly update student risk indices and classification badges</small>
                            </div>
                        </div>
                        <span class="badge bg-danger">Live Recalibration</span>
                    </div>

                    <form id="thresholdSettingsForm">
                        <!-- SECTION A: RISK SCORE CLASSIFICATION TIERS -->
                        <h6 class="fw-bold text-uppercase small mb-3" style="color: var(--accent); letter-spacing: 0.5px;">
                            <i class="bi bi-pie-chart-fill me-1"></i> 1. Risk Score Classification Tiers (0 - 100%)
                        </h6>
                        
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Safe / Low Risk (<= %)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingSafeThreshold" class="form-control" value="${safeCutoff}" min="0" max="60" required>
                                    <span class="input-group-text">%</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Scores &le; this value are marked <strong>Healthy</strong>.</small>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label fw-semibold small" style="color: var(--text);">High Risk Cutoff (&ge; %)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingHighThreshold" class="form-control" value="${highCutoff}" min="40" max="85" required>
                                    <span class="input-group-text">%</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Scores &ge; this value trigger <strong>High Risk</strong> warnings.</small>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Critical Action Cutoff (&ge; %)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingCriticalThreshold" class="form-control" value="${criticalCutoff}" min="65" max="100" required>
                                    <span class="input-group-text">%</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Scores &ge; this value mandate <strong>Critical Intervention</strong>.</small>
                            </div>
                        </div>

                        <!-- SECTION B: INDIVIDUAL BASE MINIMUM BENCHMARKS -->
                        <h6 class="fw-bold text-uppercase small mb-3 border-top pt-3" style="color: var(--accent); letter-spacing: 0.5px;">
                            <i class="bi bi-shield-check me-1"></i> 2. Multi-Signal Base Minimum Benchmarks
                        </h6>

                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Mandatory Attendance Cutoff (%)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingAttendanceThreshold" class="form-control" value="${attdCutoff}" min="1" max="100" required>
                                    <span class="input-group-text">%</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Flagged when overall attendance drops below this percentage.</small>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Minimum Academic CGPA (0 - 10)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingRiskCgpaThreshold" class="form-control" value="${riskCgpaCutoff}" step="0.1" min="0" max="10" required>
                                    <span class="input-group-text">CGPA</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Benchmark GPA below which students receive remedial plans.</small>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Minimum LMS Engagement (%)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingLmsThreshold" class="form-control" value="${lmsCutoff}" min="1" max="100" required>
                                    <span class="input-group-text">%</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">LMS portal activity score cutoff for inactivity warnings.</small>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Minimum Assignment Score (%)</label>
                                <div class="input-group input-group-sm">
                                    <input type="number" id="settingAssignmentThreshold" class="form-control" value="${assignCutoff}" min="1" max="100" required>
                                    <span class="input-group-text">%</span>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Assignment submission rate threshold.</small>
                            </div>
                        </div>

                        <button type="submit" class="primary-btn w-100 py-2" id="saveThresholdBtn">
                            <i class="bi bi-sliders2 me-1"></i> Save & Recalculate All Student Risks System-Wide
                        </button>
                    </form>
                </div>
            </div>

            <!-- 2. AI ENGINE & INFERENCE PROVIDER (Admin Only) -->
            ${role === 'admin' ? `
                <div class="col-lg-5">
                    <div class="card-box h-100 p-4">
                        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                            <div class="d-flex align-items-center gap-2">
                                <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center;">
                                    <i class="bi bi-cpu text-primary fs-5"></i>
                                </div>
                                <div>
                                    <h5 class="fw-bold mb-0" style="color: var(--text);">AI Inference Engine</h5>
                                    <small class="text-muted">LLM Provider & Diagnostic Models</small>
                                </div>
                            </div>
                            <span class="badge bg-primary">Multi-Engine</span>
                        </div>

                        <form id="aiEngineSettingsForm">
                            <div class="mb-3">
                                <label class="form-label fw-semibold small" style="color: var(--text);">Active AI Engine Provider</label>
                                <select id="settingAiProvider" class="form-select form-select-sm" onchange="handleSettingsProviderChange()">
                                    <option value="local" ${provider === 'local' ? 'selected' : ''}>Local Heuristic Engine (Offline / Built-in)</option>
                                    <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>Google Gemini & Gemma (Gemini 2.5 Flash, 2.5 Pro, Gemma 2)</option>
                                    <option value="groq" ${provider === 'groq' ? 'selected' : ''}>Groq Cloud (Ultra-Fast: Llama 3.3 70B, Llama 3.1 8B) [Free Tier]</option>
                                    <option value="openrouter" ${provider === 'openrouter' ? 'selected' : ''}>OpenRouter (Free Hub: DeepSeek R1, Llama 3.2) [Free Tier]</option>
                                    <option value="ollama" ${provider === 'ollama' ? 'selected' : ''}>Ollama (Local Machine or Tunnel via ngrok/Cloudflare)</option>
                                    <option value="deepseek" ${provider === 'deepseek' ? 'selected' : ''}>DeepSeek Official API (DeepSeek V3, R1)</option>
                                    <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI (ChatGPT GPT-4o, GPT-3.5)</option>
                                </select>
                            </div>

                            <!-- MODEL PRESET SELECTOR -->
                            <div class="mb-3 ${provider === 'local' ? 'd-none' : ''}" id="modelPresetGroup">
                                <label class="form-label fw-semibold small d-flex justify-content-between" style="color: var(--text);">
                                    <span>Model Identifier</span>
                                    <span class="text-muted" style="font-size: 11px;">Recommended for provider</span>
                                </label>
                                <div class="d-flex gap-2 mb-2">
                                    <select id="settingModelPreset" class="form-select form-select-sm" onchange="handleModelPresetChange(this.value)">
                                        <!-- Populated via JS -->
                                    </select>
                                </div>
                                <input type="text" id="settingModelName" class="form-control form-control-sm" value="${modelName}" placeholder="e.g. gemini-2.5-flash or llama-3.3-70b-versatile">
                            </div>

                            <!-- API KEY INPUT & GET KEY LINK -->
                            <div class="mb-3 ${provider === 'local' || provider === 'ollama' ? 'd-none' : ''}" id="apiKeyGroup">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label fw-semibold small mb-0" style="color: var(--text);">API Key</label>
                                    <a id="getApiKeyLink" href="https://aistudio.google.com/app/apikey" target="_blank" class="small text-primary text-decoration-none fw-semibold" style="font-size: 11.5px;">
                                        <i class="bi bi-box-arrow-up-right me-1"></i> Get API Key
                                    </a>
                                </div>
                                <div class="input-group input-group-sm">
                                    <input type="password" id="settingApiKey" class="form-control" value="${apiKey}" placeholder="Paste your API key here..." onfocus="handleApiKeyFocus(this)">
                                    <button class="btn" type="button" onclick="toggleApiKeyVisibility()" style="background: var(--bg-sunken); border: 1px solid var(--border); color: var(--text-muted);" title="Toggle visibility">
                                        <i class="bi bi-eye" id="apiKeyEyeIcon"></i>
                                    </button>
                                </div>
                                <small class="text-muted d-block mt-1" style="font-size: 11px;">
                                    <i class="bi bi-shield-check text-success me-1"></i> Auto-synced to Database & <code>.env</code> file.
                                </small>
                            </div>

                            <!-- BASE URL INPUT -->
                            <div class="mb-3 ${provider === 'local' || provider === 'gemini' ? 'd-none' : ''}" id="apiBaseUrlGroup">
                                <label class="form-label fw-semibold small" style="color: var(--text);">API Base URL</label>
                                <input type="text" id="settingApiBaseUrl" class="form-control form-control-sm" value="${baseUrl}" placeholder="https://api.groq.com/openai/v1 or http://127.0.0.1:11434">
                            </div>

                            <!-- OLLAMA CLOUD / TUNNEL HELPER NOTICE -->
                            <div class="mb-3 p-2 rounded ${provider === 'ollama' ? '' : 'd-none'}" id="ollamaTunnelNotice" style="background: var(--bg-sunken); border: 1px solid var(--border); font-size: 11.5px; line-height: 1.45; color: var(--text);">
                                <div class="fw-bold text-primary mb-1"><i class="bi bi-hdd-network me-1"></i> Running Ollama with a Deployed Website?</div>
                                <div class="text-muted">
                                    When hosting online (Render/Netlify), expose your local Ollama port using a tunnel:
                                    <code class="d-block p-1 my-1 rounded bg-dark text-light">ngrok http 11434</code>
                                    Then paste the generated <code>https://xxxx.ngrok-free.app</code> into the API Base URL above!
                                </div>
                            </div>

                            <button type="submit" class="primary-btn w-100 py-2 justify-content-center" id="saveAiSettingsBtn">
                                <i class="bi bi-check2-circle me-1"></i> Save &amp; Sync AI Configuration
                            </button>
                        </form>
                    </div>
                </div>
            ` : `
                <div class="col-lg-4">
                    <div class="card-box h-100 d-flex flex-column justify-content-center align-items-center text-center p-4">
                        <i class="bi bi-shield-lock fs-1 text-muted mb-3"></i>
                        <h5 class="fw-bold" style="color: var(--text);">AI Settings Managed by Admin</h5>
                        <p class="text-muted small mb-0">AI engine configuration and API keys are managed by institutional administrators.</p>
                    </div>
                </div>
            `}
        </div>

        <!-- 3. SECURITY & PASSWORD MANAGEMENT -->
        <div class="row g-4 mt-1">
            <div class="col-lg-6">
                <div class="card-box p-4">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--bg-sunken); display: flex; align-items: center; justify-content: center;">
                            <i class="bi bi-shield-lock-fill text-primary fs-5"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold mb-0" style="color: var(--text);">Account Security & Password</h5>
                            <small class="text-muted">Manage access credentials for <strong>${user?.display_name || user?.id}</strong> (${user?.id})</small>
                        </div>
                    </div>
                    <button class="secondary-btn" onclick="openChangePasswordModal(event)">
                        <i class="bi bi-key-fill text-primary me-1"></i> Change My Password
                    </button>
                </div>
            </div>

            ${role === 'admin' ? `
                <div class="col-lg-6">
                    <div class="card-box p-4 border-start border-4 border-primary">
                        <div class="d-flex align-items-center gap-2 mb-3">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-person-check text-primary fs-5"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-0" style="color: var(--text);">Faculty & Mentor Registrations</h5>
                                <small class="text-muted">Review, verify, and approve or decline incoming applicant requests</small>
                            </div>
                        </div>
                        <button class="primary-btn" onclick="navigateTo('users')">
                            <i class="bi bi-shield-check me-1"></i> Open Approvals Queue
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // 1. Bind Thresholds Save Form
    const thresholdForm = document.getElementById("thresholdSettingsForm");
    if (thresholdForm) {
        thresholdForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const btn = document.getElementById("saveThresholdBtn");
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recalculating All Student Risks...`;
            }

            try {
                const safe = document.getElementById("settingSafeThreshold").value;
                const high = document.getElementById("settingHighThreshold").value;
                const critical = document.getElementById("settingCriticalThreshold").value;
                const attd = document.getElementById("settingAttendanceThreshold").value;
                const gpa = document.getElementById("settingRiskCgpaThreshold").value;
                const lms = document.getElementById("settingLmsThreshold").value;
                const assign = document.getElementById("settingAssignmentThreshold").value;

                const res = await API.saveSettings({
                    safe_risk_threshold: safe,
                    high_risk_threshold: high,
                    critical_risk_threshold: critical,
                    attendance_threshold: attd,
                    risk_cgpa_threshold: gpa,
                    lms_threshold: lms,
                    assignment_threshold: assign
                });

                if (res && res.success) {
                    showSuccessToast("System thresholds saved! All student risk scores recalculated in real-time.");
                } else {
                    showErrorToast(res?.message || "Failed to update thresholds.");
                }

                if (typeof loadLatestStudents === "function") {
                    await loadLatestStudents();
                }
            } catch (err) {
                console.error("Error saving thresholds:", err);
                showErrorToast("Error saving thresholds: " + (err.message || err));
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="bi bi-save me-1"></i> Save &amp; Recalculate Thresholds`;
                }
            }
        });
    }

    // 2. Bind AI Engine Save Form
    const aiForm = document.getElementById("aiEngineSettingsForm");
    if (aiForm) {
        handleSettingsProviderChange(false);

        aiForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const btn = document.getElementById("saveAiSettingsBtn");
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Synchronizing...`;
            }

            try {
                const aiProvider = document.getElementById("settingAiProvider").value;
                const aiApiKey = document.getElementById("settingApiKey") ? document.getElementById("settingApiKey").value : "";
                const aiBaseUrl = document.getElementById("settingApiBaseUrl") ? document.getElementById("settingApiBaseUrl").value : "";
                const aiModel = document.getElementById("settingModelName") ? document.getElementById("settingModelName").value : "";

                const payload = {
                    ai_provider: aiProvider,
                    api_base_url: aiBaseUrl,
                    model_name: aiModel
                };

                if (aiApiKey && !aiApiKey.includes("•")) {
                    payload.api_key = aiApiKey.trim();
                }

                const res = await API.saveSettings(payload);

                if (res && res.success) {
                    showSuccessToast("AI Engine settings updated! Synced to Database & .env file.");
                } else {
                    showInfoToast("Settings saved.");
                }
            } catch (err) {
                console.error("Error saving AI settings:", err);
                showErrorToast("Error saving AI settings: " + (err.message || err));
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Save &amp; Sync AI Configuration`;
                }
            }
        });
    }
}

const PROVIDER_CONFIGS = {
    gemini: {
        models: [
            { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (Recommended, Blazing Fast)" },
            { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite (Low Latency / High Speed)" },
            { id: "gemma-4-31b-it", name: "Gemma 4 31B IT (Google Open Weights via Gemini Key)" },
            { id: "gemma-4-26b-a4b-it", name: "Gemma 4 26B A4B IT (Mixture-of-Experts)" },
            { id: "gemini-flash-latest", name: "Gemini Flash Latest" },
            { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
            { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash" },
            { id: "gemini-pro-latest", name: "Gemini Pro Latest" }
        ],
        defaultModel: "gemini-3.5-flash",
        baseUrl: "",
        keyUrl: "https://aistudio.google.com/app/apikey",
        keyName: "Google AI Studio"
    },
    groq: {
        models: [
            { id: "groq/compound", name: "Groq Compound (Flagship Compound Reasoning)" },
            { id: "openai/gpt-oss-120b", name: "OpenAI GPT-OSS 120B on Groq" },
            { id: "openai/gpt-oss-20b", name: "OpenAI GPT-OSS 20B (High Speed)" },
            { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B on Groq" },
            { id: "groq/compound-mini", name: "Groq Compound Mini" }
        ],
        defaultModel: "groq/compound",
        baseUrl: "https://api.groq.com/openai/v1",
        keyUrl: "https://console.groq.com/keys",
        keyName: "Groq Cloud Console"
    },
    openrouter: {
        models: [
            { id: "openrouter/free", name: "OpenRouter Smart Auto-Free Router (Recommended)" },
            { id: "liquid/lfm-2.5-2.6b:free", name: "Liquid LFM 2.5 (Fast Free Tier)" },
            { id: "google/gemma-4-31b-it:free", name: "Google Gemma 4 31B IT (Free on OpenRouter)" },
            { id: "google/gemma-4-26b-a4b-it:free", name: "Google Gemma 4 26B (Free on OpenRouter)" },
            { id: "z-ai/glm-5.2:free", name: "GLM 5.2 (Free Tier)" },
            { id: "minimax/minimax-m3:free", name: "MiniMax M3 (Free Tier)" }
        ],
        defaultModel: "openrouter/free",
        baseUrl: "https://openrouter.ai/api/v1",
        keyUrl: "https://openrouter.ai/keys",
        keyName: "OpenRouter Hub"
    },
    deepseek: {
        models: [
            { id: "deepseek-chat", name: "DeepSeek V3 Chat (High Performance / Low Cost)" },
            { id: "deepseek-reasoner", name: "DeepSeek R1 Reasoner (Deep Math & Logic)" }
        ],
        defaultModel: "deepseek-chat",
        baseUrl: "https://api.deepseek.com/v1",
        keyUrl: "https://platform.deepseek.com/api_keys",
        keyName: "DeepSeek Platform"
    },
    openai: {
        models: [
            { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Affordable)" },
            { id: "gpt-4o", name: "GPT-4o (Flagship Multimodal)" },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }
        ],
        defaultModel: "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1",
        keyUrl: "https://platform.openai.com/api-keys",
        keyName: "OpenAI Platform"
    },
    ollama: {
        models: [
            { id: "llama3.2", name: "Llama 3.2 (Meta 3B/1B Lightweight)" },
            { id: "llama3.1", name: "Llama 3.1 8B (Meta Standard)" },
            { id: "deepseek-r1", name: "DeepSeek R1 (Distilled Local Reasoning)" },
            { id: "qwen2.5-coder", name: "Qwen 2.5 Coder (Academic & Code Logic)" },
            { id: "mistral", name: "Mistral 7B (Fast & Reliable)" },
            { id: "gemma2", name: "Gemma 2 (Google Open Weights)" }
        ],
        defaultModel: "llama3.2",
        baseUrl: "http://127.0.0.1:11434",
        keyUrl: "",
        keyName: ""
    }
};

function handleSettingsProviderChange(updateDefaults = true) {
    const provider = document.getElementById("settingAiProvider")?.value || "local";
    const keyGroup = document.getElementById("apiKeyGroup");
    const urlGroup = document.getElementById("apiBaseUrlGroup");
    const modelPresetGroup = document.getElementById("modelPresetGroup");
    const ollamaNotice = document.getElementById("ollamaTunnelNotice");
    const getKeyLink = document.getElementById("getApiKeyLink");
    const presetSelect = document.getElementById("settingModelPreset");
    const modelInput = document.getElementById("settingModelName");
    const urlInput = document.getElementById("settingApiBaseUrl");

    const conf = PROVIDER_CONFIGS[provider];

    if (provider === "local") {
        if (keyGroup) keyGroup.classList.add("d-none");
        if (urlGroup) urlGroup.classList.add("d-none");
        if (modelPresetGroup) modelPresetGroup.classList.add("d-none");
        if (ollamaNotice) ollamaNotice.classList.add("d-none");
        return;
    }

    if (modelPresetGroup) modelPresetGroup.classList.remove("d-none");

    // Populate model presets
    if (presetSelect && conf && conf.models) {
        presetSelect.innerHTML = conf.models.map(m => `
            <option value="${m.id}" ${modelInput?.value === m.id ? 'selected' : ''}>${m.name}</option>
        `).join("") + `<option value="custom">Custom / Other Model...</option>`;

        if (updateDefaults && (!modelInput.value || conf.models.every(m => m.id !== modelInput.value))) {
            modelInput.value = conf.defaultModel;
            presetSelect.value = conf.defaultModel;
        }
    }

    if (provider === "gemini") {
        if (keyGroup) keyGroup.classList.remove("d-none");
        if (urlGroup) urlGroup.classList.add("d-none");
        if (ollamaNotice) ollamaNotice.classList.add("d-none");
    } else if (provider === "ollama") {
        if (keyGroup) keyGroup.classList.add("d-none");
        if (urlGroup) urlGroup.classList.remove("d-none");
        if (ollamaNotice) ollamaNotice.classList.remove("d-none");
        if (updateDefaults && urlInput && !urlInput.value) {
            urlInput.value = conf.baseUrl;
        }
    } else {
        // Groq, OpenRouter, DeepSeek, OpenAI
        if (keyGroup) keyGroup.classList.remove("d-none");
        if (urlGroup) urlGroup.classList.remove("d-none");
        if (ollamaNotice) ollamaNotice.classList.add("d-none");
        if (updateDefaults && urlInput && conf) {
            urlInput.value = conf.baseUrl;
        }
    }

    // Update API Key link
    if (getKeyLink && conf) {
        if (conf.keyUrl) {
            getKeyLink.href = conf.keyUrl;
            getKeyLink.innerHTML = `<i class="bi bi-box-arrow-up-right me-1"></i> Get ${conf.keyName} Key`;
            getKeyLink.classList.remove("d-none");
        } else {
            getKeyLink.classList.add("d-none");
        }
    }
}

function handleModelPresetChange(val) {
    const input = document.getElementById("settingModelName");
    if (!input) return;
    if (val !== "custom") {
        input.value = val;
    } else {
        input.focus();
        input.select();
    }
}
window.handleModelPresetChange = handleModelPresetChange;

function toggleApiKeyVisibility() {
    const input = document.getElementById("settingApiKey");
    const icon = document.getElementById("apiKeyEyeIcon");
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        if (icon) icon.className = "bi bi-eye-slash";
    } else {
        input.type = "password";
        if (icon) icon.className = "bi bi-eye";
    }
}

function handleApiKeyFocus(input) {
    if (input && input.value && input.value.includes("•")) {
        input.value = "";
        input.type = "text";
        const icon = document.getElementById("apiKeyEyeIcon");
        if (icon) icon.className = "bi bi-eye-slash";
    }
}

// Window Exports for Settings Page
window.renderSettings = renderSettings;
window.handleSettingsProviderChange = handleSettingsProviderChange;
window.toggleApiKeyVisibility = toggleApiKeyVisibility;
window.handleApiKeyFocus = handleApiKeyFocus;
