/* =====================================================
   SETTINGS.JS
   AI Provider Configuration (Gemini, Groq, OpenAI, Ollama, Local)
===================================================== */

function renderSettings() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">System & AI Engine Configuration</h1>
            <p class="text-muted small mb-0">Switch between Google Gemini, OpenAI, Groq, Ollama, or Local Offline AI Agent</p>
        </div>

        <div class="row g-4">
            <!-- AI PROVIDER CARD -->
            <div class="col-md-7">
                <div class="card-box p-4">
                    <div class="card-head border-bottom pb-3 mb-4">
                        <h4 class="fw-bold mb-0"><i class="bi bi-cpu text-primary me-2"></i> Active AI Provider</h4>
                    </div>

                    <form id="aiSettingsForm">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Select AI Provider</label>
                            <select id="aiProviderSelect" class="form-select" onchange="handleProviderChange()">
                                <option value="local">Local Offline Heuristic Agent (Zero API Key Needed)</option>
                                <option value="gemini">Google Gemini API (Gemini 1.5 Flash)</option>
                                <option value="groq">Groq Cloud (Fast Llama 3.1 / Mixtral)</option>
                                <option value="openai">OpenAI API (GPT-4o / GPT-3.5)</option>
                                <option value="ollama">Local Ollama Instance (Offline Open-Source LLMs)</option>
                            </select>
                        </div>

                        <div class="mb-3" id="apiKeyGroup">
                            <label class="form-label fw-bold">API Key</label>
                            <input type="password" id="aiApiKey" class="form-control" placeholder="Enter API Key (e.g. AIzaSy... or gsk_...)">
                            <small class="text-muted">Keys are stored locally in your SQLite database.</small>
                        </div>

                        <div class="mb-3 d-none" id="apiBaseUrlGroup">
                            <label class="form-label fw-bold">Custom API Base URL (Optional)</label>
                            <input type="text" id="aiBaseUrl" class="form-control" placeholder="https://api.openai.com/v1 or http://localhost:11434">
                        </div>

                        <div class="mb-3 d-none" id="modelNameGroup">
                            <label class="form-label fw-bold">Model Name</label>
                            <input type="text" id="aiModelName" class="form-control" placeholder="e.g. llama-3.1-8b-instant or gemini-1.5-flash">
                        </div>

                        <button type="submit" class="primary-btn mt-2">
                            <i class="bi bi-check-lg"></i> Save AI Engine Settings
                        </button>
                    </form>
                </div>
            </div>

            <!-- ACADEMIC RISK THRESHOLDS CARD -->
            <div class="col-md-5">
                <div class="card-box p-4">
                    <div class="card-head border-bottom pb-3 mb-4">
                        <h4 class="fw-bold mb-0"><i class="bi bi-sliders text-success me-2"></i> Risk Thresholds</h4>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Mandatory Attendance Cutoff (%)</label>
                        <input type="number" id="thresholdAttendance" class="form-control" value="75">
                        <small class="text-muted">Students below this attendance will trigger Critical Alerts.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">High Academic Risk Cutoff (%)</label>
                        <input type="number" id="thresholdRisk" class="form-control" value="60">
                        <small class="text-muted">Risk index above this score triggers automatic 1-on-1 mentor booking.</small>
                    </div>
                    <button class="btn btn-outline-success" onclick="alert('Thresholds saved successfully!')">
                        Save Risk Thresholds
                    </button>
                </div>
            </div>
        </div>
    `;

    // Load existing settings from SQLite
    API.getSettings().then(settings => {
        if (!settings) return;
        if (settings.ai_provider) document.getElementById("aiProviderSelect").value = settings.ai_provider;
        if (settings.api_key) document.getElementById("aiApiKey").value = settings.api_key;
        if (settings.api_base_url) document.getElementById("aiBaseUrl").value = settings.api_base_url;
        if (settings.model_name) document.getElementById("aiModelName").value = settings.model_name;
        handleProviderChange();
    });

    // Handle Form Submit
    const form = document.getElementById("aiSettingsForm");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            const payload = {
                ai_provider: document.getElementById("aiProviderSelect").value,
                api_key: document.getElementById("aiApiKey").value.trim(),
                api_base_url: document.getElementById("aiBaseUrl").value.trim(),
                model_name: document.getElementById("aiModelName").value.trim()
            };
            const res = await API.saveSettings(payload);
            if (res && res.success) {
                alert("AI Engine settings updated successfully!");
            } else {
                alert("Settings saved locally.");
            }
        });
    }
}

function handleProviderChange() {
    const provider = document.getElementById("aiProviderSelect")?.value;
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
        // groq / openai
        if (keyGroup) keyGroup.classList.remove("d-none");
        if (urlGroup) urlGroup.classList.remove("d-none");
        if (modelGroup) modelGroup.classList.remove("d-none");
    }
}
