# sync_master_to_erp.py
import os
import sqlite3
import uuid

DB_PATH = 'database/amico_erp.sqlite'

def sync_data():
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: Database not found at {DB_PATH}. Please run seed_pharma_erp.py first.")
        return

    print(f"📂 Connecting to SQLite database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🔄 Synchronizing master records into active ERP operational tables...")

    try:
        # 1. Populate active 'products' table (camelCase schema)
        cursor.execute("DELETE FROM products;")
        cursor.execute("""
            INSERT OR IGNORE INTO products (productCode, productName, unit, notes, isActive)
            SELECT CAST("Product Code" AS TEXT), "Product Name", COALESCE("Unit", 'Tablets'), "Notes", 1
            FROM products_master;
        """)
        print("💊 Successfully synchronized 'products' table.")

        # 2. Populate active 'recipes_bom' table (snake_case schema)
        cursor.execute("DELETE FROM recipes_bom;")
        cursor.execute("""
            INSERT OR IGNORE INTO recipes_bom (product_code, product_name, batch_size, dosage_form, ingredients_json, status)
            SELECT 
                CAST("Product Code" AS TEXT), 
                "Product Name", 
                'Standard Batch', 
                'Tablet', 
                json_group_array(json_object(
                    'materialCode', "Material Code",
                    'materialName', "Material Name",
                    'qtyPerStdBatch', "Qty per Std Batch",
                    'unit', "Unit",
                    'notes', "Notes"
                )),
                'ACTIVE'
            FROM recipes_bom_master
            GROUP BY "Product Code", "Product Name";
        """)
        print("📋 Successfully synchronized 'recipes_bom' table.")

        # 3. Populate active 'procurement_purchase_orders' table (camelCase schema)
        cursor.execute("DELETE FROM procurement_purchase_orders;")
        
        # Raw Material POs
        cursor.execute('SELECT "PO No", "PO Date", "Supplier", "Status" FROM rm_purchase_orders;')
        rm_pos = cursor.fetchall()
        for po_no, po_date, supplier, status in rm_pos:
            if not po_no: continue
            po_id = str(uuid.uuid4())
            date_val = str(po_date) if po_date else '2026-01-01'
            stat_val = 'COMPLETED' if status == 'Received' else 'PENDING'
            cursor.execute("""
                INSERT OR IGNORE INTO procurement_purchase_orders 
                (id, poNumber, vendorName, vendorType, orderDate, expectedDeliveryDate, status, grandTotal, ledgerStatus)
                VALUES (?, ?, ?, 'LOCAL', ?, ?, ?, 15000.00, 'POSTED_TO_AP_21100');
            """, (po_id, str(po_no), str(supplier or 'Unknown Supplier'), date_val, date_val, stat_val))

        # Packing Material POs
        cursor.execute('SELECT "PO No", "PO Date", "Supplier", "Status" FROM pack_purchase_orders;')
        pack_pos = cursor.fetchall()
        for po_no, po_date, supplier, status in pack_pos:
            if not po_no: continue
            po_id = str(uuid.uuid4())
            date_val = str(po_date) if po_date else '2026-01-01'
            stat_val = 'COMPLETED' if status == 'Received' else 'PENDING'
            cursor.execute("""
                INSERT OR IGNORE INTO procurement_purchase_orders 
                (id, poNumber, vendorName, vendorType, orderDate, expectedDeliveryDate, status, grandTotal, ledgerStatus)
                VALUES (?, ?, ?, 'LOCAL', ?, ?, ?, 10000.00, 'POSTED_TO_AP_21100');
            """, (po_id, str(po_no), str(supplier or 'Unknown Supplier'), date_val, date_val, stat_val))
            
        print(f"🛒 Successfully synchronized 'procurement_purchase_orders' ({len(rm_pos) + len(pack_pos)} POs).")

        # 4. Populate active 'production_batches' table (mixed schema)
        cursor.execute("DELETE FROM production_batches;")
        cursor.execute('''
            SELECT "Batch No", "Product Name", "Batch Qty", "Current Stage", "Batch Status", "QC Test Result" 
            FROM production_batches_master;
        ''')
        batches = cursor.fetchall()
        for batch_no, prod_name, batch_qty, stage, status, qc_res in batches:
            if not batch_no: continue
            b_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT OR IGNORE INTO production_batches 
                (id, batchId, batch_number, product, product_name, category, target_quantity, batchSize, batch_size, stage, status, ipqcStatus, qcStatus, qaRelease, operator)
                VALUES (?, ?, ?, ?, ?, 'Pharmaceuticals', ?, ?, ?, ?, ?, 'Passed', ?, 'Released', 'Shahnawaz');
            """, (
                b_id, 
                str(batch_no), 
                str(batch_no), 
                str(prod_name or 'Unknown Product'), 
                str(prod_name or 'Unknown Product'), 
                float(batch_qty or 0), 
                str(batch_qty or '0'), 
                str(batch_qty or '0'), 
                str(stage or 'Completed'), 
                str(status or 'Completed'), 
                str(qc_res or 'Pass')
            ))
        print(f"🏭 Successfully synchronized 'production_batches' ({len(batches)} batches).")

        # 5. Populate active 'grn_qc_records' table (camelCase schema)
        cursor.execute("DELETE FROM grn_qc_records;")
        cursor.execute('''
            SELECT "GRN No", "Date Received", "PO No", "Material Code (auto from PO)", "Material Name", "Supplier Lot No", "Qty Received", "Unit", "Status", "Test Results Summary"
            FROM grn_qc_master;
        ''')
        grns = cursor.fetchall()
        for grn_no, date_recv, po_no, mat_code, mat_name, lot_no, qty_recv, unit, status, summary in grns:
            if not grn_no: continue
            cursor.execute("""
                INSERT OR IGNORE INTO grn_qc_records 
                (grnNo, dateReceived, poNo, materialCode, materialName, supplierLotNo, qtyReceived, unit, status, testResultsSummary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (str(grn_no), str(date_recv or ''), str(po_no or ''), str(mat_code or ''), str(mat_name or ''), str(lot_no or ''), float(qty_recv or 0), str(unit or ''), str(status or ''), str(summary or '')))
        print(f"🔬 Successfully synchronized 'grn_qc_records' ({len(grns)} records).")

        conn.commit()
        print("🚀 All master records successfully mapped and synchronized into active ERP operational tables!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Synchronization Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    sync_data()