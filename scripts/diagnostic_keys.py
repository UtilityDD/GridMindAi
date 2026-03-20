import sys
import logging
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from google import genai
import time

def test_keys():
    print(f"Testing {len(config.GEMINI_KEY_POOL)} keys...")
    for i, key in enumerate(config.GEMINI_KEY_POOL):
        print(f"Checking Key {i+1}: {key[:10]}...")
        try:
            client = genai.Client(api_key=key)
            result = client.models.embed_content(
                model="models/gemini-embedding-001",
                contents=["test chunk"],
            )
            print(f"Key {i+1} is VALID and functional.")
        except Exception as e:
            msg = str(e)
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                print(f"Key {i+1} hit RATE LIMIT (429).")
            elif "PERMISSION_DENIED" in msg:
                print(f"Key {i+1} hit PERMISSION DENIED (Leaked/Invalid).")
            else:
                print(f"Key {i+1} hit ERROR: {msg[:100]}")
        time.sleep(1)

if __name__ == "__main__":
    test_keys()
