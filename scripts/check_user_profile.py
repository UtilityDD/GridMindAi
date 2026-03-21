import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

# Get user by email
auth_res = supabase.auth.admin.list_users()
user = next((u for u in auth_res.users if u.email == 'dipnkr.das@gmail.com'), None)

if user:
    print(f"User ID: {user.id}")
    res = supabase.from_("profiles").select("*, user_tiers(*)").eq("id", user.id).single().execute()
    import json
    print(json.dumps(res.data, indent=2))
else:
    print("User not found")
