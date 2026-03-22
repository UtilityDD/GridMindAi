import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

TITLES_MAP = {
    1:  "WBSEDCL Promotion Guidelines (1) - Career Policy & Gen. Promotion Rules",
    2:  "WBSEDCL Promotion Guidelines (2) - Promotion to Office Superintendent (OS)",
    3:  "WBSEDCL Promotion Guidelines (3) - Join Eng. (JE) Grade-II (Elec.)",
    4:  "WBSEDCL Promotion Guidelines (4) - Promotion to SE & Chief Engineer",
    5:  "WBSEDCL Promotion Guidelines (5) - Promotion to Executive Engineer (Elec/Mech)",
    6:  "WBSEDCL Promotion Guidelines (6) - Promotion to Accountant",
    7:  "WBSEDCL Promotion Guidelines (7) - Promotion to Head Clerk",
    8:  "WBSEDCL Promotion Guidelines (8) - Promotion to Administrative Officer (AO)",
    9:  "WBSEDCL Promotion Guidelines (9) - SC/ST Reservation Policy & Roster",
    10: "WBSEDCL Promotion Guidelines (10) - Promotion to Senior Assistant",
    11: "WBSEDCL Promotion Guidelines (11) - Promotion to Cashier-I",
    12: "WBSEDCL Promotion Guidelines (12) - Promotion to Store Keeper",
    13: "WBSEDCL Promotion Guidelines (13) - Promotion to Office Assistant (Grade-I/II)",
    14: "WBSEDCL Promotion Guidelines (14) - Promotion to Technical Assistant",
    15: "WBSEDCL Promotion Guidelines (15) - Promotion to Meter Reader",
    16: "WBSEDCL Promotion Guidelines (16) - Promotion to Driver",
    17: "WBSEDCL Promotion Guidelines (17) - Promotion to Security Supervisor",
    18: "WBSEDCL Promotion Guidelines (18) - Promotion to Welfare Officer",
    19: "WBSEDCL Promotion Guidelines (19) - Promotion to Public Relations Officer (PRO)",
    20: "WBSEDCL Promotion Guidelines (20) - Promotion to Medical Officer",
    21: "WBSEDCL Promotion Guidelines (21) - Promotion to Superintendent (Non-Tech)",
    22: "WBSEDCL Promotion Guidelines (22) - Promotion to Senior Technical Assistant",
    23: "WBSEDCL Promotion Guidelines (23) - Promotion to Head Technician",
    24: "WBSEDCL Promotion Guidelines (24) - Promotion to Special Grade Technician",
    25: "WBSEDCL Promotion Guidelines (25) - Promotion to Senior Technician",
    26: "WBSEDCL Promotion Guidelines (26) - Promotion to Technician",
    27: "WBSEDCL Promotion Guidelines (27) - Promotion to Meter Inspector",
    28: "WBSEDCL Promotion Guidelines (28) - Promotion to Senior Meter Reader",
    29: "WBSEDCL Promotion Guidelines (29) - Promotion to Bill Distributor",
    30: "WBSEDCL Promotion Guidelines (30) - Promotion to Junior Operator Technician (JOT)",
    31: "WBSEDCL Promotion Guidelines (31) - Promotion to Staff Nurse / Medical Staff"
}

def main():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, key)
    
    # Fetch records
    res = supabase.table('titles').select('id, title').ilike('title', 'WBSEDCL Promotion Guidelines (%').execute()
    
    for r in res.data:
        try:
            idx = int(r['title'].split('(')[1].split(')')[0])
        except:
            continue
            
        if idx in TITLES_MAP:
            new_title = TITLES_MAP[idx]
            supabase.table('titles').update({'title': new_title}).eq('id', r['id']).execute()
            print(f"Updated ID {r['id']}: {new_title}")

if __name__ == "__main__":
    main()
