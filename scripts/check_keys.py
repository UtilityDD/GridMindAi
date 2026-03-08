import os
import sys
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv()

def check_key(key):
    client = genai.Client(api_key=key)
    try:
        # Try a very small embedding request
        client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=["test"],
            config={"output_dimensionality": 768},
        )
        return True, "OK"
    except Exception as e:
        return False, str(e)

def main():
    pool_str = os.getenv("GEMINI_KEY_POOL", "")
    keys = [k.strip() for k in pool_str.split(",") if k.strip()]
    
    print(f"Checking {len(keys)} keys in pool...")
    for i, key in enumerate(keys):
        # Mask key for privacy
        masked = key[:8] + "..." + key[-4:] if len(key) > 12 else key
        print(f"Key {i+1}: {masked} -> ", end="", flush=True)
        ok, msg = check_key(key)
        if ok:
            print("VALID")
        else:
            print(f"INVALID ({msg[:100]})")

if __name__ == "__main__":
    main()
