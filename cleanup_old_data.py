import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
sb = create_client(url, key)

OLD_DOC_ID = "6252bc65f0b96f96"

print(f"Deleting old doc_id {OLD_DOC_ID}...")

res1 = sb.table("chunks").delete().eq("doc_id", OLD_DOC_ID).execute()
print(f"Deleted from chunks.")

res2 = sb.table("summaries").delete().eq("doc_id", OLD_DOC_ID).execute()
print(f"Deleted from summaries.")

res3 = sb.table("titles").delete().eq("doc_id", OLD_DOC_ID).execute()
print(f"Deleted from titles.")

print("Cleanup complete.")
