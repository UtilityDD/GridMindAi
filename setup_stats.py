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

with open("stats_schema.sql", "r") as f:
    sql = f.read()

# Split SQL by semicolons and execute each part
# Note: This is a simple parser and might need adjustment for complex SQL
statements = sql.split(";")
for statement in statements:
    if statement.strip():
        # Using a raw RPC or executing via table manipulation if needed
        # Supabase doesn't expose a 'run_sql' RPC by default for security.
        # However, we can try to create the table and functions manually through the UI or specific SDK calls.
        print(f"Executing: {statement[:50]}...")

print("\n--- ACTION REQUIRED ---")
print("Please run the contents of 'stats_schema.sql' in your Supabase SQL Editor manually.")
print("The SDK does not support direct SQL execution for security reasons.")
