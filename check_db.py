import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
sb = create_client(url, key)

res = sb.table("titles").select("doc_id, title, source_url").eq("doc_id", "0148fec1b6cf08d7").execute()
print("New Record (with URL):", res.data)

res_old = sb.table("titles").select("doc_id, title, source_url").eq("doc_id", "6252bc65f0b96f96").execute()
print("Old Record (blank URL):", res_old.data)
