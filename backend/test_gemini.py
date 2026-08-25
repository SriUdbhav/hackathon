#!/usr/bin/env python3
"""Quick Gemini API diagnostic test."""
import os
import sys
import json
import urllib.request

# Load .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and v:
                os.environ.setdefault(k, v)

# Also check DB settings
try:
    import db
    settings = db.get_system_settings()
    db_key = settings.get("api_key", "")
    db_provider = settings.get("ai_provider", "local")
    print(f"[DB Settings] ai_provider={db_provider}, api_key={'SET (' + str(len(db_key)) + ' chars)' if db_key else 'EMPTY'}")
except Exception as e:
    print(f"[DB] Could not load: {e}")
    db_key = ""

# Resolve key
api_key = db_key or os.environ.get("GEMINI_API_KEY", "")
print(f"[Resolved Key] {'SET (' + str(len(api_key)) + ' chars, ends with ...' + api_key[-4:] + ')' if api_key else 'NOT SET'}")

if not api_key:
    print("\n❌ NO API KEY FOUND! Set GEMINI_API_KEY in backend/.env or via Settings UI.")
    sys.exit(1)

# Test models
models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Say hello in one word."}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 50}
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res = json.loads(response.read().decode("utf-8"))
            text = res["candidates"][0]["content"]["parts"][0]["text"]
            print(f"✅ {model}: SUCCESS — Response: {text.strip()}")
            break  # Stop on first success
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", errors="replace")[:300]
        except:
            pass
        print(f"❌ {model}: HTTP {e.code} — {body}")
    except Exception as e:
        print(f"❌ {model}: {e}")

print("\nDone.")
