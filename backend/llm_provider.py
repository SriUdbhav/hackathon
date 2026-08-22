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
    def call_ai(prompt, system_prompt="You are an AI Academic Intervention Agent.", settings=None, history=None):
        if settings is None:
            settings = {}
        if history is None:
            history = []

        provider = (settings.get("ai_provider") or "local").lower()
        api_key = settings.get("api_key", "").strip()

        # 1. Google Gemini API
        if provider == "gemini" and api_key:
            model_candidates = [
                settings.get("model_name") or "gemini-3.6-flash",
                "gemini-3.7-flash",
                "gemini-3.1-flash-lite",
                "gemini-3.1-pro-preview"
            ]
            for model in model_candidates:
                try:
                    return LLMProvider._call_gemini_multiturn(prompt, system_prompt, api_key, model, history)
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        print(f"[Gemini 429 Rate Limit on {model}]: Backing off and trying next candidate...")
                        time.sleep(1.2)
                        continue
                    else:
                        print(f"[Gemini Error on {model}]: {e}")
                        continue
                except Exception as e:
                    print(f"[Gemini Error on {model}]: {e}")
                    continue
            print("[Gemini]: All Gemini candidate models failed or rate-limited. Falling back to Local Agent.")

        # 2. OpenAI / Groq / Compatible API
        elif provider in ["openai", "groq"] and api_key:
            try:
                base_url = settings.get("api_base_url")
                if not base_url:
                    base_url = "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
                model = settings.get("model_name", "llama-3.1-8b-instant" if provider == "groq" else "gpt-3.5-turbo")
                return LLMProvider._call_openai_multiturn(prompt, system_prompt, api_key, base_url, model, history)
            except Exception as e:
                print(f"[{provider.upper()} Error]: {e}, falling back to Local Agent.")

        # 3. Local Ollama (e.g. http://localhost:11434)
        elif provider == "ollama":
            try:
                ollama_url = settings.get("api_base_url") or settings.get("ollama_url") or "http://localhost:11434"
                if not ollama_url.endswith("/api/generate") and not ollama_url.endswith("/api/chat"):
                    ollama_url = f"{ollama_url.rstrip('/')}/api/generate"
                model = settings.get("model_name") or "llama3.2:1b"
                return LLMProvider._call_ollama(prompt, system_prompt, ollama_url, model, history)
            except Exception as e:
                print(f"[Ollama Connection Error]: {e}")
                return (
                    f"⚠️ **Local Ollama Connection Notice:**\n"
                    f"Could not connect to local Ollama at `{settings.get('api_base_url') or 'http://localhost:11434'}`.\n\n"
                    "**To use Local Ollama:**\n"
                    "1. Ensure Ollama is installed and running: `ollama run llama3.2:1b` (or `ollama serve`)\n"
                    "2. Or switch to **Google Gemini** / **Local Agent** from the dropdown above."
                )

        # 4. Offline Local Heuristic Agent (Default Fallback)
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
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 900}
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=12) as response:
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
            "temperature": 0.4
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        })
        with urllib.request.urlopen(req, timeout=12) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return res_json["choices"][0]["message"]["content"]

    @staticmethod
    def _call_ollama(prompt, system_prompt, ollama_url, model, history):
        prompt_with_history = f"{system_prompt}\n\n"
        for msg in history:
            prompt_with_history += f"{msg.get('role')}: {msg.get('content')}\n"
        prompt_with_history += f"user: {prompt}\nassistant:"

        payload = {
            "model": model,
            "prompt": prompt_with_history,
            "stream": False,
            "options": {
                "num_predict": 450,
                "temperature": 0.3
            }
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(ollama_url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=45) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return res_json.get("response", "")

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
