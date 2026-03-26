import os
import shutil
import re

SOURCE_DIR = r"D:\Dipankar\MyCodes\AI Projects\new colection for RAG\External_Downloads"
FINAL_DIR = os.path.join(SOURCE_DIR, "Final_680_Optimized")

def get_win_path(path):
    abs_path = os.path.abspath(path)
    if not abs_path.startswith("\\\\?\\"):
        return f"\\\\?\\{abs_path}"
    return abs_path

def get_base_name_conservative(filename):
    """
    Conservative base name extraction.
    Only removes (1), (2) etc.
    """
    name, ext = os.path.splitext(filename)
    # Remove (n)
    name = re.sub(r'\s*\(\d+\)', '', name)
    return f"{name.strip().lower()}{ext.lower()}"

def organize():
    source_dir_lp = get_win_path(SOURCE_DIR)
    final_dir_lp = get_win_path(FINAL_DIR)
    
    if not os.path.exists(source_dir_lp):
        print("Source directory not found.")
        return

    all_files = []
    # ONLY scan the main source folder (we reset everything there)
    for f in os.listdir(source_dir_lp):
        p = os.path.join(source_dir_lp, f)
        if os.path.isfile(p) and f.lower().endswith('.pdf'):
            all_files.append({"name": f, "path": p, "size": os.path.getsize(p)})

    print(f"Scanning. Total PDF candidates: {len(all_files)}")

    # Group by Conservative Name
    groups = {}
    for entry in all_files:
        base = get_base_name_conservative(entry["name"])
        if base not in groups:
            groups[base] = []
        groups[base].append(entry)

    # Re-create FINAL_DIR
    if os.path.exists(final_dir_lp):
        shutil.rmtree(final_dir_lp)
    os.makedirs(final_dir_lp)

    moved_count = 0
    for base, variants in sorted(groups.items()):
        # Pick smallest
        best = min(variants, key=lambda x: x["size"])
        
        dest_filename = best["name"]
        name_p, ext_p = os.path.splitext(dest_filename)
        # Final name clean
        final_filename = f"{re.sub(r'\s*\(\d+\)', '', name_p).strip()}{ext_p}"
        
        # Sanitize for MAX_PATH
        safe_name = f"{final_filename[:150].strip()}"
        dst = os.path.join(final_dir_lp, safe_name)
        
        if os.path.exists(dst):
            continue

        try:
            shutil.copy2(best["path"], dst)
            moved_count += 1
        except Exception as e:
            print(f"Error copying {dest_filename}: {e}")

    print(f"Targeting: 680")
    print(f"Final Platinum Assets: {moved_count}")

if __name__ == "__main__":
    organize()
