import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

# Query profiles table directly (using email if present, or search by ID from auth)
# Let's try listing users first to get ID
auth_res = supabase.auth.admin.list_users()
user = next((u for u in auth_res if u.email == 'dipnkr.das@gmail.com'), None)

if user:
    print(f"User ID: {user.id}")
    res = supabase.from_("profiles").select("*, user_tiers(*)").eq("id", user.id).single().execute()
    print(res.data)
else:
    # Try searching profiles for custom_daily_limit = 30
    res = supabase.from_("profiles").select("*, user_tiers(*)").eq("custom_daily_limit", 30).execute()
    print("Searching for users with limit 30:")
    print(res.data)
