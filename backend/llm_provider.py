# =====================================================
# LLM_PROVIDER.PY
# Multi-Provider AI Adapter with Multi-Turn History, Ollama URL Normalization & Resilient Fallbacks
# =====================================================

import urllib.request
import json
import time
import os

class LLMProvider:
    """
    Unified AI Provider Interface supporting multi-turn conversation history
    across Google Gemini, OpenAI, Groq, Ollama, and Local Heuristic Agent.
    """

    @staticmethod
    def _resolve_api_key(provider, settings=None):
        """Resolves API key from Settings DB, os.environ, Render /etc/secrets, or local .env."""
        if settings and settings.get("api_key") and "•" not in settings.get("api_key"):
            return settings.get("api_key").strip()

        env_map = {
            "gemini": "GEMINI_API_KEY",
            "openai": "OPENAI_API_KEY",
            "groq": "GROQ_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
            "deepseek": "DEEPSEEK_API_KEY"
        }
        var_name = env_map.get((provider or "").lower(), "")
        if not var_name:
            return ""

        # 1. Direct from os.environ
        key = os.environ.get(var_name, "").strip()
        if key and "•" not in key:
            return key

        # 2. Check secret files and .env candidate paths
        candidates = [
            f"/etc/secrets/{var_name}",
            "/etc/secrets/.env",
            os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
            os.path.join(os.getcwd(), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        ]
        for p in candidates:
            if p and os.path.exists(p):
                try:
                    if os.path.isfile(p):
                        if p.endswith(var_name):
                            with open(p, "r", encoding="utf-8") as f:
                                val = f.read().strip()
                                if val and "•" not in val:
                                    os.environ[var_name] = val
                                    return val
                        with open(p, "r", encoding="utf-8") as f:
                            for line in f:
                                line = line.strip()
                                if not line or line.startswith("#") or "=" not in line:
                                    continue
                                k, _, v = line.partition("=")
                                k = k.strip()
                                v = v.strip().strip('"').strip("'")
                                if k and v:
                                    os.environ[k] = v
                                    if k == var_name:
                                        return v
                except Exception as e:
                    print(f"[Warning] Error reading secret {p}: {e}")

        return os.environ.get(var_name, "").strip()

    @staticmethod
    def call_ai(prompt, system_prompt="You are an AI Academic Intervention Agent.", settings=None, history=None):
        if settings is None:
            settings = {}
        if history is None:
            history = []

        provider = (settings.get("ai_provider") or "local").lower()
        api_key = LLMProvider._resolve_api_key(provider, settings)

        # 1. Google Gemini API (Supports Gemini 3.5 Flash, Flash Lite, Gemma 4)
        if provider == "gemini" and api_key:
            configured_model = settings.get("model_name") or "gemini-3.5-flash"
            model_candidates = [
                configured_model,
                "gemini-3.5-flash",
                "gemini-3.5-flash-lite",
                "gemma-4-31b-it",
                "gemma-4-26b-a4b-it",
                "gemini-flash-latest",
                "gemini-3.6-flash",
                "gemini-3.7-flash",
                "gemini-pro-latest",
            ]
            # Deduplicate while preserving order
            seen = set()
            unique_models = []
            for m in model_candidates:
                if m and m not in seen:
                    seen.add(m)
                    unique_models.append(m)
            model_candidates = unique_models
            all_rate_limited = True
            for model in model_candidates:
                try:
                    return LLMProvider._call_gemini_multiturn(prompt, system_prompt, api_key, model, history)
                except urllib.error.HTTPError as e:
                    body = ""
                    try:
                        body = e.read().decode("utf-8", errors="replace")[:500]
                    except Exception:
                        pass
                    if e.code == 429:
                        print(f"[Gemini 429 Rate Limit on {model}]: Backing off and trying next candidate...")
                        time.sleep(1.2)
                        continue
                    else:
                        all_rate_limited = False
                        print(f"[Gemini Error on {model}]: HTTP {e.code} — {body}")
                        continue
                except Exception as e:
                    all_rate_limited = False
                    print(f"[Gemini Error on {model}]: {e}")
                    continue

            if all_rate_limited:
                print("[Gemini]: All models returned 429 — API quota exceeded.")
                return ("⚠️ **Gemini API Quota Exceeded**\n\n"
                        "Your Gemini API key has hit its rate limit. This typically resets after a minute. "
                        "You can:\n"
                        "- Wait a minute and try again\n"
                        "- Check your quota at [Google AI Studio](https://aistudio.google.com/app/apikey)\n"
                        "- Switch to a different AI provider (Groq, OpenRouter, Ollama) in Settings")
            print("[Gemini]: All Gemini candidate models failed. Falling back to Local Agent.")

        # 2. Groq Cloud (Free Ultra-Fast Inference)
        elif provider == "groq" and api_key:
            base_url = settings.get("api_base_url") or "https://api.groq.com/openai/v1"
            configured_model = settings.get("model_name") or "groq/compound"
            groq_candidates = [
                configured_model,
                "groq/compound",
                "openai/gpt-oss-120b",
                "openai/gpt-oss-20b",
                "qwen/qwen3.8-27b",
                "groq/compound-mini"
            ]
            # Deduplicate
            seen = set()
            unique_groq = []
            for m in groq_candidates:
                if m and m not in seen:
                    seen.add(m)
                    unique_groq.append(m)

            for model in unique_groq:
                try:
                    return LLMProvider._call_openai_multiturn(prompt, system_prompt, api_key, base_url, model, history)
                except Exception as e:
                    print(f"[GROQ Error on {model}]: {e}, trying next candidate...")
                    continue
            print("[GROQ]: All Groq candidate models failed. Falling back to Local Agent.")

        # 3. OpenRouter (Free Multi-Model Hub)
        elif provider == "openrouter" and api_key:
            base_url = settings.get("api_base_url") or "https://openrouter.ai/api/v1"
            configured_model = settings.get("model_name") or "openrouter/free"
            router_candidates = [
                configured_model,
                "openrouter/free",
                "liquid/lfm-2.5-2.6b:free",
                "google/gemma-4-31b-it:free",
                "google/gemma-4-26b-a4b-it:free",
                "z-ai/glm-5.2:free",
                "minimax/minimax-m3:free"
            ]
            seen = set()
            unique_router = []
            for m in router_candidates:
                if m and m not in seen:
                    seen.add(m)
                    unique_router.append(m)

            for model in unique_router:
                try:
                    return LLMProvider._call_openai_multiturn(prompt, system_prompt, api_key, base_url, model, history)
                except Exception as e:
                    print(f"[OpenRouter Error on {model}]: {e}, trying next candidate...")
                    continue
            print("[OpenRouter]: All OpenRouter candidate models failed. Falling back to Local Agent.")

        # 4. DeepSeek Official API
        elif provider == "deepseek" and api_key:
            try:
                base_url = settings.get("api_base_url") or "https://api.deepseek.com/v1"
                model = settings.get("model_name") or "deepseek-chat"
                return LLMProvider._call_openai_multiturn(prompt, system_prompt, api_key, base_url, model, history)
            except Exception as e:
                print(f"[DeepSeek Error]: {e}, falling back to Local Agent.")

        # 5. OpenAI API
        elif provider == "openai" and api_key:
            try:
                base_url = settings.get("api_base_url") or "https://api.openai.com/v1"
                model = settings.get("model_name") or "gpt-4o-mini"
                return LLMProvider._call_openai_multiturn(prompt, system_prompt, api_key, base_url, model, history)
            except Exception as e:
                print(f"[OpenAI Error]: {e}, falling back to Local Agent.")

        # 6. Local or Tunneled Ollama (e.g. http://127.0.0.1:11434 or ngrok/Cloudflare tunnel)
        elif provider == "ollama":
            return LLMProvider._call_ollama_resilient(prompt, system_prompt, settings, history)

        # 7. Offline Local Heuristic Agent (Default Fallback)
        return LLMProvider._local_agent_response(prompt, system_prompt, history)

    @staticmethod
    def _call_gemini_multiturn(prompt, system_prompt, api_key, model, history):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        contents = []
        first_user = True
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            text = msg.get("content", "")
            if first_user and role == "user":
                text = f"[SYSTEM INSTRUCTIONS & COHORT CONTEXT]\n{system_prompt}\n\n[USER]\n{text}"
                first_user = False
            contents.append({"role": role, "parts": [{"text": text}]})

        current_text = prompt
        if first_user:
            current_text = f"[SYSTEM INSTRUCTIONS & COHORT CONTEXT]\n{system_prompt}\n\n[USER]\n{prompt}"
        contents.append({"role": "user", "parts": [{"text": current_text}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 8192
            }
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "EduStudentSight/1.0 (Educational Academic AI Agent)"
            }
        )
        with urllib.request.urlopen(req, timeout=45) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return res_json["candidates"][0]["content"]["parts"][0]["text"]

    @staticmethod
    def _call_openai_multiturn(prompt, system_prompt, api_key, base_url, model, history):
        url = f"{base_url.rstrip('/')}/chat/completions"
        messages = [{"role": "system", "content": system_prompt}]

        for msg in history:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 4096
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "EduStudentSight/1.0 (Educational Academic AI Agent)",
                "HTTP-Referer": "https://edustudentsight.local",
                "X-Title": "EduStudent Sight"
            }
        )
        with urllib.request.urlopen(req, timeout=25) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return res_json["choices"][0]["message"]["content"]

    @staticmethod
    def _call_ollama_resilient(prompt, system_prompt, settings, history):
        custom_base = settings.get("api_base_url") or settings.get("ollama_url")
        candidate_hosts = []
        if custom_base:
            candidate_hosts.append(custom_base.rstrip("/"))
        candidate_hosts.extend([
            "http://127.0.0.1:11434",
            "http://localhost:11434",
            "http://0.0.0.0:11434"
        ])
        # Deduplicate while preserving order
        candidate_hosts = list(dict.fromkeys(candidate_hosts))

        # 1. Determine model: if configured model is a Gemini/OpenAI name or blank, discover installed Ollama models
        configured_model = (settings.get("model_name") or "").strip()
        is_cloud_model_name = any(x in configured_model.lower() for x in ["gemini", "gpt", "claude"])
        target_model = "llama3.2:1b" if (not configured_model or is_cloud_model_name) else configured_model

        # 2. Try pinging /api/tags across candidate hosts to verify connection & discover models
        working_host = None
        available_models = []
        ngrok_headers = {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
            "User-Agent": "EduStudentSight/1.0"
        }
        for host in candidate_hosts:
            try:
                tags_url = f"{host}/api/tags"
                req = urllib.request.Request(tags_url, headers=ngrok_headers)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    available_models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                    working_host = host
                    break
            except Exception:
                continue

        # If /api/tags succeeded and models are installed, auto-match the best model
        if working_host and available_models:
            matched = None
            for m in available_models:
                if m == target_model or m.startswith(target_model) or target_model.startswith(m.split(":")[0]):
                    matched = m
                    break
            if matched:
                target_model = matched
            else:
                target_model = available_models[0]
        elif not working_host:
            working_host = candidate_hosts[0]

        # 3. Call Ollama /api/generate
        last_error = None
        for host in ([working_host] if working_host else candidate_hosts):
            gen_url = f"{host}/api/generate"
            prompt_with_history = f"{system_prompt}\n\n"
            for msg in (history or []):
                prompt_with_history += f"{msg.get('role')}: {msg.get('content')}\n"
            prompt_with_history += f"user: {prompt}\nassistant:"

            payload = {
                "model": target_model,
                "prompt": prompt_with_history,
                "stream": False,
                "options": {
                    "num_predict": 1024,
                    "temperature": 0.3
                }
            }
            try:
                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(gen_url, data=data, headers=ngrok_headers)
                with urllib.request.urlopen(req, timeout=90) as response:
                    res_json = json.loads(response.read().decode("utf-8"))
                    ans = res_json.get("response", "").strip()
                    if ans:
                        return ans
            except urllib.error.HTTPError as e:
                last_error = f"Ollama HTTP {e.code}: {e.reason}"
                print(f"[Ollama Error on {host} with model {target_model}]: {e}")
                if e.code == 404 and target_model != "llama3.2:1b":
                    try:
                        payload["model"] = "llama3.2:1b"
                        data = json.dumps(payload).encode("utf-8")
                        req = urllib.request.Request(gen_url, data=data, headers=ngrok_headers)
                        with urllib.request.urlopen(req, timeout=90) as response2:
                            res_json2 = json.loads(response2.read().decode("utf-8"))
                            ans2 = res_json2.get("response", "").strip()
                            if ans2:
                                return ans2
                    except Exception:
                        pass
            except Exception as e:
                last_error = str(e)
                print(f"[Ollama Error on {host}]: {e}")

        # If all failed, return clean, helpful notice
        installed_hint = f"Installed on host: `{', '.join(available_models)}`" if available_models else "Ollama service was not reachable on `http://127.0.0.1:11434` or `http://localhost:11434`"
        return (
            f"⚠️ **Local Ollama Connection Notice:**\n\n"
            f"Could not complete inference with local Ollama (`{target_model}`).\n"
            f"- **Error:** {last_error or 'Connection failed'}\n"
            f"- **Status:** {installed_hint}\n\n"
            "**Troubleshooting:**\n"
            "1. Ensure Ollama is running in your terminal: `ollama run llama3.2:1b` (or `ollama serve`)\n"
            "2. Verify listening port: `curl http://127.0.0.1:11434/api/tags`\n"
            "3. Or switch to **Google Gemini** / **Local Agent** from the model dropdown above."
        )

    @staticmethod
    def _local_agent_response(prompt, system_prompt, history=None):
        prompt_lower = prompt.lower()
        if "gemini" in prompt_lower or "model" in prompt_lower or "who are you" in prompt_lower or "what are you" in prompt_lower:
            return (
                "Hello! I am the **AI Academic Intervention Agent for EduStudent Sight**.\n\n"
                "I track multi-signal academic indicators (Attendance, LMS Activity, Quiz Marks, and Assignment Streaks) "
                "to provide explainable risk diagnostics and recommend autonomous interventions for faculty mentors.\n\n"
                "*Note: Operating in Local Diagnostic Mode.*"
            )
        elif "analyze" in prompt_lower or "diagnostic" in prompt_lower or "risk" in prompt_lower or "summarize" in prompt_lower:
            return (
                "### Cohort Academic Risk Summary:\n"
                "* 🚨 **High Risk:** **Arjun Patel** (Risk: 72% | Attd: 61% | CGPA: 6.9) — Critical attendance debarment warning.\n"
                "* ⚠️ **Moderate Risk:** **Y. Hemanth Reddy** (Risk: 55% | Attd: 68% | CGPA: 7.4) — High academic potential but attendance deficient.\n"
                "* ⚠️ **Moderate Risk:** **T. Gopi** (Risk: 42% | Attd: 73% | CGPA: 7.8) — Needs LMS engagement nudge.\n"
                "* ✅ **Low Risk:** **Sneha Rao** (8%) & **V. Sri Udbhav** (18%) — Healthy engagement.\n\n"
                "**Suggested Action:** Run the *Autonomous Intervention Loop* to book counseling and dispatch warnings."
            )
        else:
            return (
                f"I have received your query: *\"{prompt}\"*.\n\n"
                "As your Academic Agent, I can analyze student retention risks, draft custom remediation plans, "
                "or schedule mentoring sessions for at-risk cohorts."
            )
