import os
import sys
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config

def test_keys():
    print(f"Testing {len(config.GEMINI_KEY_POOL)} keys in pool for embedding...")
    for i, key in enumerate(config.GEMINI_KEY_POOL):
        client = genai.Client(api_key=key)
        try:
            # Test embedding call
            response = client.models.embed_content(
                model="models/gemini-embedding-001",
                contents="Test embedding"
            )
            print(f"Key {i+1} ({key[:6]}...): SUCCESS")
        except Exception as e:
            msg = str(e)
            if "expired" in msg.lower():
                print(f"Key {i+1} ({key[:6]}...): FAILED - Expired")
            elif "429" in msg or "quota" in msg.lower() or "RESOURCE_EXHAUSTED" in msg:
                print(f"Key {i+1} ({key[:6]}...): FAILED - Quota/Limit (429)")
            else:
                print(f"Key {i+1} ({key[:6]}...): FAILED - {msg[:100]}")

if __name__ == "__main__":
    test_keys()
