import os
# Test if marker can be imported and handles conversion correctly
try:
    from marker.convert import convert_single_pdf
    from marker.models import load_all_models
    print("Marker library found and ready.")
except ImportError as e:
    print(f"Error importing Marker: {e}")
except Exception as e:
    print(f"General error: {e}")
