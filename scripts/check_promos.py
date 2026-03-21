import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

res = supabase.from_("promo_codes").select("*").execute()
import json
print(json.dumps(res.data, indent=2))
