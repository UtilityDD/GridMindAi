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
    1:  "ROPA 2009 (1) - Revision of Pay and Allowances (ROPA 2009) Implementation",
    2:  "ROPA 2009 (2) - Pay Fixation Guidelines and Procedures",
    3:  "ROPA 2009 (3) - House Rent Allowance (HRA) 2009 Rules",
    4:  "ROPA 2009 (4) - Medical Allowance 2009 Guidelines",
    5:  "ROPA 2009 (5) - Dearness Allowance (DA) 2009 Rates",
    6:  "ROPA 2009 (6) - Conveyance Allowance 2009",
    7:  "ROPA 2009 (7) - Hill Allowance 2009 Rules",
    8:  "ROPA 2009 (8) - Washing Allowance 2009",
    9:  "ROPA 2009 (9) - Shift Allowance 2009",
    10: "ROPA 2009 (10) - Extra Duty Allowance 2009",
    11: "ROPA 2009 (11) - Cash Allowance for Cashiers",
    12: "ROPA 2009 (12) - Project Allowance details",
    13: "ROPA 2009 (13) - Training Allowance 2009",
    14: "ROPA 2009 (14) - Risk Allowance for field staff",
    15: "ROPA 2009 (15) - Winter Allowance 2009",
    16: "ROPA 2009 (16) - Tiffin Allowance Rules",
    17: "ROPA 2009 (17) - Cycle Allowance 2009",
    18: "ROPA 2009 (18) - Night Halt Allowance",
    19: "ROPA 2009 (19) - Uniform Allowance 2009",
    20: "ROPA 2009 (20) - Split Duty Allowance",
    21: "ROPA 2009 (21) - Rural Allowance 2009",
    22: "ROPA 2009 (22) - Remote Locality Allowance",
    23: "ROPA 2009 (23) - Non-Practicing Allowance (NPA) for Medical Officers",
    24: "ROPA 2009 (24) - Electricity Counter Allowance",
    25: "ROPA 2009 (25) - Project Allowance (Regional Specifics)",
    26: "ROPA 2009 (26) - Winter Allowance details",
    27: "ROPA 2009 (27) - Medical Allowance for Pensioners",
    28: "ROPA 2009 (28) - Fixed Conveyance Allowance Rules",
    29: "ROPA 2009 (29) - Hill Compensatory & Winter Allowance",
    30: "ROPA 2009 (30) - Shift Allowance for O&M Staff",
    31: "ROPA 2009 (31) - Cash Allowance Guidelines",
    32: "ROPA 2009 (32) - Cycle Allowance rules 2009",
    33: "ROPA 2009 (33) - Night Halt Allowance details",
    34: "ROPA 2009 (34) - Uniform Allowance details",
    35: "ROPA 2009 (35) - Split Duty Allowance specifics",
    36: "ROPA 2009 (36) - Rural Allowance revision",
    37: "ROPA 2009 (37) - Remote Locality Allowance revision",
    38: "ROPA 2009 (38) - Non-Practicing Allowance (NPA) revision",
    39: "ROPA 2009 (39) - Electricity Counter Allowance revision",
    40: "ROPA 2009 (40) - House Rent Allowance (HRA) specifics",
    41: "ROPA 2009 (41) - Medical Allowance Revision 2009",
    42: "ROPA 2009 (42) - Dearness Allowance Revision (Oct 2009)",
    43: "ROPA 2009 (43) - Special Allowance for specific cadres",
    44: "ROPA 2009 (44) - Overtime Allowance rules",
    45: "ROPA 2009 (45) - Traveling Allowance (TA) Rules 2009",
    46: "ROPA 2009 (46) - Leave Travel Concession (LTC) 2009",
    47: "ROPA 2009 (47) - Honorarium and Incentives",
    48: "ROPA 2009 (48) - Encashment of Earned Leave rules",
    49: "ROPA 2009 (49) - Gratuity and Pension Enhancements",
    50: "ROPA 2009 (50) - Final ROPA 2009 Clarifications",
    51: "ROPA 2009 (51) - Annexure I: Pay Scales & Grades",
    52: "ROPA 2009 (52) - Annexure II: Fixation Tables",
    53: "ROPA 2009 (53) - Annexure III: Option Form for ROPA 2009",
    54: "ROPA 2009 (Master) - Complete ROPA 2009 Compilation Link"
}

def main():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, key)
    
    # Fetch records
    res = supabase.table('titles').select('id, title').ilike('title', 'ROPA 2009 (%').execute()
    
    for r in res.data:
        try:
            # Handle cases like "ROPA 2009 (1)" or "ROPA 2009 (Master)"
            if "(Master)" in r['title']:
                idx = 54
            else:
                idx = int(r['title'].split('(')[1].split(')')[0])
        except:
            continue
            
        if idx in TITLES_MAP:
            new_title = TITLES_MAP[idx]
            supabase.table('titles').update({'title': new_title}).eq('id', r['id']).execute()
            print(f"Updated ID {r['id']}: {new_title}")

if __name__ == "__main__":
    main()
