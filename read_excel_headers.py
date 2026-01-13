import pandas as pd
import sys

try:
    file_path = "/home/labubu/Docker/karya-jaya/custom-addons/report_inventory_csi/Inventory Adjustment XLSX(13).xlsx"
    # Read the first few rows to find the header
    # Usually headers are not on row 0 if there is a title.
    # The code generates title on row 2, info on row 3-6. Header on row + 6 = 8 (index 8, row 9) or similar.
    # Let's read the whole thing and look for "Barcode"

    df = pd.read_excel(file_path, header=None)

    header_row_index = None
    for idx, row in df.iterrows():
        # Check if row contains "Barcode" and "Produk"
        values = [str(v).strip() for v in row.values if pd.notna(v)]
        if "Barcode" in values and "Produk" in values:
            header_row_index = idx
            print(f"Found headers at row {idx}: {values}")
            break

    if header_row_index is None:
        print("Could not find header row containing 'Barcode' and 'Produk'")

except Exception as e:
    print(f"Error: {e}")
