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
    const attdCutoff = settings.attendance_threshold || "75";
    const riskCgpaCutoff = settings.risk_cgpa_threshold || "7.5";

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">System & Intelligence Configuration</h1>
            <p class="text-muted small mb-0">Manage dynamic academic risk thresholds${role === 'admin' ? ', AI inference engine keys,' : ''} and account security</p>
        </div>

        <div class="row g-4">
            <!-- 1. DYNAMIC RISK & ATTENDANCE THRESHOLDS -->
            <div class="${role === 'admin' ? 'col-lg-6' : 'col-lg-8'}">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-sliders text-danger me-2"></i> Academic Risk Thresholds</h3>
                        <span class="badge bg-danger">Critical Sync</span>
                    </div>
                    <p class="text-muted small mb-4">
                        Modifying these thresholds will immediately recalculate risk scores across all dashboards, student 360° views, and autonomous agent reasoning.
                    </p>

                    <form id="thresholdSettingsForm">
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Mandatory Attendance Cutoff (%)</label>
                            <div class="input-group">
                                <input type="number" id="settingAttendanceThreshold" class="form-control" value="${attdCutoff}" min="1" max="100" required>
                                <span class="input-group-text">%</span>
                            </div>
                            <small class="text-muted">Students falling below this attendance trigger warning anomalies.</small>
                        </div>

                        <div class="mb-4">
                            <label class="form-label fw-semibold">CGPA Risk Cutoff (0 - 10)</label>
                            <input type="number" id="settingRiskCgpaThreshold" class="form-control" value="${riskCgpaCutoff}" step="0.1" min="0" max="10" required>
                            <small class="text-muted">Benchmark GPA below which students receive remedial study plans.</small>
                        </div>

                        <button type="submit" class="primary-btn w-100" id="saveThresholdBtn">
                            <i class="bi bi-sliders2"></i> Save & Recalculate All Student Risks
                        </button>
                    </form>
                </div>
            </div>

            <!-- 2. AI ENGINE & INFERENCE PROVIDER (Admin Only) -->
            ${role === 'admin' ? `
                <div class="col-lg-6">
                    <div class="card-box h-100">
                        <div class="card-head">
                            <h3 class="fw-bold"><i class="bi bi-cpu text-primary me-2"></i> AI Engine Provider & Model</h3>
                            <span class="badge bg-primary">Multi-Engine</span>
                        </div>

                        <form id="aiEngineSettingsForm">
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Active AI Engine</label>
                                <select id="settingAiProvider" class="form-select" onchange="handleSettingsProviderChange()">
                                    <option value="local" ${provider === 'local' ? 'selected' : ''}>Local Agentic Reasoning Engine</option>
                                    <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>Google Gemini (API Key)</option>
                                    <option value="ollama" ${provider === 'ollama' ? 'selected' : ''}>Local Ollama (e.g. Llama 3.2)</option>
                                    <option value="groq" ${provider === 'groq' ? 'selected' : ''}>Groq High-Speed Cloud</option>
                                    <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI (ChatGPT)</option>
                                </select>
                            </div>

                            <div class="mb-3 ${provider === 'local' || provider === 'ollama' ? 'd-none' : ''}" id="apiKeyGroup">
                                <label class="form-label fw-semibold">API Key</label>
                                <div class="input-group">
                                    <input type="password" id="settingApiKey" class="form-control" value="${apiKey}" placeholder="Paste your API key here..." onfocus="handleApiKeyFocus(this)">
                                    <button class="btn" type="button" onclick="toggleApiKeyVisibility()" style="background: var(--bg-sunken); border: 1px solid var(--border); color: var(--text-muted);" title="Toggle visibility">
                                        <i class="bi bi-eye" id="apiKeyEyeIcon"></i>
                                    </button>
                                </div>
                                <small class="text-muted">Stored securely. You can also set keys in <code>backend/.env</code> file.</small>
                            </div>

                            <div class="mb-3 ${provider === 'local' || provider === 'gemini' ? 'd-none' : ''}" id="apiBaseUrlGroup">
                                <label class="form-label fw-semibold">API Base URL</label>
                                <input type="text" id="settingApiBaseUrl" class="form-control" value="${baseUrl}" placeholder="http://127.0.0.1:11434">
                            </div>

                            <div class="mb-4 ${provider === 'local' || provider === 'gemini' ? 'd-none' : ''}" id="modelNameGroup">
                                <label class="form-label fw-semibold">Model Identifier</label>
                                <input type="text" id="settingModelName" class="form-control" value="${modelName}" placeholder="llama-3.1-8b-instant or llama3.2">
                            </div>

                            <button type="submit" class="secondary-btn w-100" id="saveAiSettingsBtn">
                                <i class="bi bi-check2-circle"></i> Update AI Engine Settings
                            </button>
                        </form>
                    </div>
                </div>
            ` : `
                <div class="col-lg-4">
                    <div class="card-box h-100 d-flex flex-column justify-content-center align-items-center text-center p-4">
                        <i class="bi bi-shield-lock fs-1 text-muted mb-3"></i>
                        <h5 class="fw-bold text-dark">AI Settings Restricted</h5>
                        <p class="text-muted small mb-0">AI engine configuration (API keys, model selection) is managed by system administrators only. Contact your admin to change AI settings.</p>
                    </div>
                </div>
            `}
        </div>

        <!-- 3. SECURITY & PASSWORD MANAGEMENT -->
        <div class="row g-4 mt-1">
            <div class="col-lg-6">
                <div class="card-box">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-shield-lock-fill text-dark me-2"></i> Account Security & Password</h3>
                    </div>
                    <p class="text-muted small mb-3">Update your login password for user <strong>${user?.display_name || user?.id}</strong> (${user?.id}).</p>
                    <button class="secondary-btn" onclick="openChangePasswordModal(event)">
                        <i class="bi bi-key-fill text-primary"></i> Change My Password
                    </button>
                </div>
            </div>

            ${role === 'admin' ? `
                <div class="col-lg-6">
                    <div class="card-box border-start border-4 border-dark">
                        <div class="card-head">
                            <h3 class="fw-bold"><i class="bi bi-person-check text-dark me-2"></i> Application Approvals</h3>
                        </div>
                        <p class="text-muted small mb-3">Review, verify, and approve or decline incoming faculty and mentor registration applications.</p>
                        <button class="primary-btn" onclick="navigateTo('users')">
                            <i class="bi bi-shield-check"></i> Open Approvals Queue
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
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recalculating Risks...`;

            const attd = document.getElementById("settingAttendanceThreshold").value;
            const gpa = document.getElementById("settingRiskCgpaThreshold").value;

            // Save in DB
            await API.saveSettings({
                attendance_threshold: attd,
                risk_cgpa_threshold: gpa
            });

            // Trigger backend risk recalculation
            const res = await API.recalculateRisks();

            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Save & Recalculate All Student Risks`;

            alert(`Thresholds updated successfully! All ${res?.updated_count || 'cohort'} students have been dynamically recalculated using the new cutoffs (${attd}% attendance, ${gpa} CGPA).`);

            await loadLatestStudents();
        });
    }

    // 2. Bind AI Settings Save Form (admin only)
    const aiForm = document.getElementById("aiEngineSettingsForm");
    if (aiForm) {
        aiForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const payload = {
                ai_provider: document.getElementById("settingAiProvider").value,
                api_key: document.getElementById("settingApiKey")?.value.trim() || "",
                api_base_url: document.getElementById("settingApiBaseUrl")?.value.trim() || "",
                model_name: document.getElementById("settingModelName")?.value.trim() || ""
            };

            const res = await API.saveSettings(payload);
            if (res && res.success) {
                alert("AI Engine settings updated successfully! AI Agent will use this configuration.");
            } else {
                alert("Settings saved.");
            }
        });
    }
}

function handleSettingsProviderChange() {
    const provider = document.getElementById("settingAiProvider")?.value;
    const keyGroup = document.getElementById("apiKeyGroup");
    const urlGroup = document.getElementById("apiBaseUrlGroup");
    const modelGroup = document.getElementById("modelNameGroup");

    if (provider === "local") {
        if (keyGroup) keyGroup.classList.add("d-none");
        if (urlGroup) urlGroup.classList.add("d-none");
        if (modelGroup) modelGroup.classList.add("d-none");
    } else if (provider === "gemini") {
        if (keyGroup) keyGroup.classList.remove("d-none");
        if (urlGroup) urlGroup.classList.add("d-none");
        if (modelGroup) modelGroup.classList.add("d-none");
    } else if (provider === "ollama") {
        if (keyGroup) keyGroup.classList.add("d-none");
        if (urlGroup) urlGroup.classList.remove("d-none");
        if (modelGroup) modelGroup.classList.remove("d-none");
    } else {
        // Groq / OpenAI
        if (keyGroup) keyGroup.classList.remove("d-none");
        if (urlGroup) urlGroup.classList.remove("d-none");
        if (modelGroup) modelGroup.classList.remove("d-none");
    }
}

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
    // If the current value is masked (contains •), clear it so the user can type a fresh key
    if (input && input.value && input.value.includes("•")) {
        input.value = "";
        input.type = "text"; // Show text so user can see what they're pasting
        const icon = document.getElementById("apiKeyEyeIcon");
        if (icon) icon.className = "bi bi-eye-slash";
    }
}
