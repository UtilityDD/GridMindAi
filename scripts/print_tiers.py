import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

res = supabase.from_("user_tiers").select("*").execute()
for row in res.data:
    print(f"ID: {row['id']}, Daily: {row['daily_limit']}, Monthly: {row['monthly_limit']}")
