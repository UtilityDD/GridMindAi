import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Missing environment variables.")
    exit(1)

sb = create_client(url, key)

try:
    res = sb.table("site_stats").select("*").eq("id", "main").execute()
    print("Table 'site_stats' exists.")
    print(f"Current Count: {res.data}")
except Exception as e:
    print(f"Error checking table: {e}")

try:
    res = sb.rpc("increment_visitor_count").execute()
    print("Function 'increment_visitor_count' exists.")
    print(f"RPC result: {res.data}")
except Exception as e:
    print(f"Error checking RPC: {e}")
