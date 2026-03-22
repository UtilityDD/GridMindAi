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
    1:  "ROPA 2020 (1) - Formation of Working Group for Vision Document",
    2:  "ROPA 2020 (2) - Implementation Guidelines for Revision of Pay (WBSEDCL)",
    3:  "ROPA 2020 (3) - Pay Fixation Options and Procedures",
    4:  "ROPA 2020 (4) - House Rent Allowance (HRA) Rules",
    5:  "ROPA 2020 (5) - Medical Allowance Guidelines",
    6:  "ROPA 2020 (6) - Dearness Allowance (DA) Entitlement",
    7:  "ROPA 2020 (7) - Non-Practicing Allowance (NPA) for Medical Officers",
    8:  "ROPA 2020 (8) - Hill & Remote Locality Allowance",
    9:  "ROPA 2020 (9) - Electricity Counter Allowance",
    10: "ROPA 2020 (10) - Washing Allowance Rules",
    11: "ROPA 2020 (11) - Fixed Conveyance Allowance",
    12: "ROPA 2020 (12) - Hill Compensatory & Winter Allowance",
    13: "ROPA 2020 (13) - Shift Allowance for O&M Staff",
    14: "ROPA 2020 (14) - Cash Allowance for Cashiers & Storekeepers",
    15: "ROPA 2020 (15) - Cycle Allowance rules",
    16: "ROPA 2020 (16) - Night Halt Allowance",
    17: "ROPA 2020 (17) - Uniform Allowance",
    18: "ROPA 2020 (18) - Extra Duty Allowance",
    19: "ROPA 2020 (19) - Risk Allowance for field staff",
    20: "ROPA 2020 (20) - Project Allowance guidelines",
    21: "ROPA 2020 (21) - Conveyance Allowance for Handicapped Employees",
    22: "ROPA 2020 (22) - Tiffin Allowance Rules",
    23: "ROPA 2020 (23) - Training Allowance",
    24: "ROPA 2020 (24) - Cash Handling Allowance for Non-Cashiers",
    25: "ROPA 2020 (25) - Remote Locality Allowance (Specific Regions)",
    26: "ROPA 2020 (26) - Winter Allowance Details",
    27: "ROPA 2020 (27) - Medical Allowance for Pensioners",
    28: "ROPA 2020 (28) - Correction of Pay Fixation Anomalies",
    29: "ROPA 2020 (29) - Final Revision Order & Modifications"
}

def main():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, key)
    
    # Fetch records
    res = supabase.table('titles').select('id, title').ilike('title', 'ROPA 2020 (%').execute()
    
    for r in res.data:
        try:
            # Handle cases like "ROPA 2020 (1)"
            idx = int(r['title'].split('(')[1].split(')')[0])
        except:
            continue
            
        if idx in TITLES_MAP:
            new_title = TITLES_MAP[idx]
            supabase.table('titles').update({'title': new_title}).eq('id', r['id']).execute()
            print(f"Updated ID {r['id']}: {new_title}")

if __name__ == "__main__":
    main()
