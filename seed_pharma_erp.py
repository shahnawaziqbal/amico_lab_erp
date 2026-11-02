# seed_pharma_erp.py
import os
import sqlite3
import pandas as pd

# Paths configured strictly for the root folder structure
DB_PATH = 'database/amico_erp.sqlite'
EXCEL_PATH = 'amico_procurement_production_and_bomrecipe_record .xlsx'

def run_seeder():
    if not os.path.exists(EXCEL_PATH):
        print(f"❌ Error: Excel file not found at {EXCEL_PATH}")
        return

    os.makedirs('database', exist_ok=True)
    print(f"📂 Connecting to SQLite database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)

    print(f"📖 Reading Excel workbook: {EXCEL_PATH}")
    xls = pd.ExcelFile(EXCEL_PATH)

    # 1. Products Master (76 rows)
    if 'Products' in xls.sheet_names:
        df = pd.read_excel(xls, 'Products').dropna(subset=['Product Code'])
        df.to_sql('products_master', conn, if_exists='replace', index=False)
        print(f"💊 Seeded {len(df)} Products successfully.")

    # 2. Raw Materials Master (333 rows)
    if 'RM_Mat' in xls.sheet_names:
        df = pd.read_excel(xls, 'RM_Mat').dropna(subset=['Material Code'])
        df.to_sql('raw_materials_master', conn, if_exists='replace', index=False)
        print(f"🧪 Seeded {len(df)} Raw Materials successfully.")

    # 3. Packing Materials Master (719 rows)
    if 'Pack_Mat' in xls.sheet_names:
        df = pd.read_excel(xls, 'Pack_Mat')
        df.columns = ['Material Code', 'Material Name', 'Type', 'Unit', 'Reorder Level', 'Notes']
        df = df.dropna(subset=['Material Code'])
        df.to_sql('packing_materials_master', conn, if_exists='replace', index=False)
        print(f"📦 Seeded {len(df)} Packing Materials successfully.")

    # 4. BOM Recipes (839 rows)
    if 'Recipes_BOM' in xls.sheet_names:
        df = pd.read_excel(xls, 'Recipes_BOM')
        df.to_sql('recipes_bom_master', conn, if_exists='replace', index=False)
        print(f"📋 Seeded {len(df)} BOM Recipe components successfully.")

    # 5. Production Batches / BMR (89 rows)
    if 'Production_Batches' in xls.sheet_names:
        df = pd.read_excel(xls, 'Production_Batches')
        df.to_sql('production_batches_master', conn, if_exists='replace', index=False)
        print(f"🏭 Seeded {len(df)} Production Batches successfully.")

    # 6. GRN & QC Quarantine Inspection Gates (310 rows)
    if 'GRN_QC' in xls.sheet_names:
        df = pd.read_excel(xls, 'GRN_QC')
        df.to_sql('grn_qc_master', conn, if_exists='replace', index=False)
        print(f"🔬 Seeded {len(df)} GRN & QC inspection records successfully.")

    # 7. Purchase Orders (RM_PO & Pack_PO)
    if 'RM_PO' in xls.sheet_names:
        df = pd.read_excel(xls, 'RM_PO')
        df.to_sql('rm_purchase_orders', conn, if_exists='replace', index=False)
        print(f"🛒 Seeded {len(df)} Raw Material POs successfully.")

    if 'Pack_PO' in xls.sheet_names:
        df = pd.read_excel(xls, 'Pack_PO')
        df.to_sql('pack_purchase_orders', conn, if_exists='replace', index=False)
        print(f"🛒 Seeded {len(df)} Packing Material POs successfully.")

    # 8. Suppliers (RM_Sup & Pack_Sup)
    if 'RM_Sup' in xls.sheet_names:
        df = pd.read_excel(xls, 'RM_Sup')
        df.to_sql('rm_suppliers', conn, if_exists='replace', index=False)
        print(f"🤝 Seeded {len(df)} RM Suppliers successfully.")

    if 'Pack_Sup' in xls.sheet_names:
        df = pd.read_excel(xls, 'Pack_Sup')
        df.to_sql('pack_suppliers', conn, if_exists='replace', index=False)
        print(f"🤝 Seeded {len(df)} Packing Suppliers successfully.")

    # 9. QC Specifications (112 rows)
    if 'QC_Specs' in xls.sheet_names:
        df = pd.read_excel(xls, 'QC_Specs')
        df.to_sql('qc_specs_master', conn, if_exists='replace', index=False)
        print(f"📊 Seeded {len(df)} QC Specification rules successfully.")

    conn.commit()
    conn.close()
    print("🚀 All pharmaceutical master data successfully synchronized into database/amico_erp.sqlite!")

if __name__ == '__main__':
    run_seeder()