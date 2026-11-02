import sqlite3
import openpyxl

conn = sqlite3.connect('database/amico_erp.sqlite')
cursor = conn.cursor()

# 1. Create and Seed field_officers table with all 233 Officers from FO Evaluation .xlsx
cursor.execute("DROP TABLE IF EXISTS field_officers;")
cursor.execute('''
CREATE TABLE field_officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teriCode TEXT UNIQUE,
    fullName TEXT,
    depotCode TEXT,
    depotName TEXT,
    joinDate TEXT,
    tenureMonths INTEGER,
    tenureBand TEXT,
    currentSales REAL,
    threeMonthAvg REAL,
    compositeScore REAL,
    rank TEXT,
    tier TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

wb_fo = openpyxl.load_workbook('FO Evaluation .xlsx', data_only=True)
sheet_score = wb_fo['Scorecard']
fo_count = 0

for r in range(5, sheet_score.max_row + 1):
    teri_code = sheet_score.cell(row=r, column=3).value
    name = sheet_score.cell(row=r, column=2).value
    if teri_code and str(teri_code).strip() != '' and str(teri_code) != 'TERI Code' and name and str(name).strip() != '':
        depot_code = str(sheet_score.cell(row=r, column=4).value or '')
        depot_name = str(sheet_score.cell(row=r, column=5).value or '')
        join_date = str(sheet_score.cell(row=r, column=6).value or '')
        
        try:
            tenure_m = int(sheet_score.cell(row=r, column=7).value or 0)
        except:
            tenure_m = 0
            
        tenure_band = str(sheet_score.cell(row=r, column=8).value or '')
        
        try:
            curr_sales = float(sheet_score.cell(row=r, column=9).value or 0.0)
        except:
            curr_sales = 0.0
            
        try:
            three_m_avg = float(sheet_score.cell(row=r, column=13).value or 0.0)
        except:
            three_m_avg = 0.0
            
        try:
            comp_score = float(sheet_score.cell(row=r, column=36).value or 0.0)
        except:
            comp_score = 0.0
            
        rank_val = str(sheet_score.cell(row=r, column=35).value or '')
        tier_val = str(sheet_score.cell(row=r, column=37).value or 'C – Developing')

        cursor.execute('''
        INSERT INTO field_officers (
            teriCode, fullName, depotCode, depotName, joinDate, tenureMonths, 
            tenureBand, currentSales, threeMonthAvg, compositeScore, rank, tier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(teri_code).strip(),
            str(name).strip(),
            depot_code.strip(),
            depot_name.strip(),
            join_date.strip(),
            tenure_m,
            tenure_band.strip(),
            curr_sales,
            three_m_avg,
            comp_score,
            rank_val.strip(),
            tier_val.strip()
        ))
        fo_count += 1

print(f"Successfully seeded {fo_count} Field Officers from FO Evaluation .xlsx into SQLite!")

# 2. Create and Seed products table with all 76 Product SKUs
cursor.execute("DROP TABLE IF EXISTS products;")
cursor.execute('''
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productCode TEXT UNIQUE,
    productName TEXT,
    unit TEXT,
    notes TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

wb_prod = openpyxl.load_workbook('amico_current_products.xlsx', data_only=True)
sheet_prod = wb_prod.active
prod_count = 0

for row in sheet_prod.iter_rows(min_row=2, values_only=True):
    p_code = row[0]
    p_name = row[1]
    if p_code or p_name:
        code_str = str(p_code).strip() if p_code else f"SKU-{prod_count+1:03d}"
        name_str = str(p_name).strip() if p_name else ""
        unit_str = str(row[2]).strip() if row[2] else 'Tablets'
        notes_str = str(row[3]).strip() if row[3] else ''

        cursor.execute('''
        INSERT INTO products (productCode, productName, unit, notes)
        VALUES (?, ?, ?, ?)
        ''', (code_str, name_str, unit_str, notes_str))
        prod_count += 1

print(f"Successfully seeded {prod_count} Products from amico_current_products.xlsx into SQLite!")

# 3. Create and Seed Depot Summary from Depot_Summary sheet if available
cursor.execute("DROP TABLE IF EXISTS depot_summaries;")
cursor.execute('''
CREATE TABLE depot_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    depotCode TEXT UNIQUE,
    depotName TEXT,
    totalFoCount INTEGER,
    totalSales REAL,
    avgCompositeScore REAL
);
''')

if 'Depot_Summary' in wb_fo.sheetnames:
    sheet_depot = wb_fo['Depot_Summary']
    for r in range(4, sheet_depot.max_row + 1):
        d_code = sheet_depot.cell(row=r, column=1).value
        if d_code:
            d_name = str(sheet_depot.cell(row=r, column=2).value or '')
            try:
                fo_cnt = int(sheet_depot.cell(row=r, column=3).value or 0)
            except:
                fo_cnt = 0
            try:
                tot_sales = float(sheet_depot.cell(row=r, column=4).value or 0.0)
            except:
                tot_sales = 0.0
            try:
                avg_score = float(sheet_depot.cell(row=r, column=5).value or 0.0)
            except:
                avg_score = 0.0

            cursor.execute('''
            INSERT OR REPLACE INTO depot_summaries (depotCode, depotName, totalFoCount, totalSales, avgCompositeScore)
            VALUES (?, ?, ?, ?, ?)
            ''', (str(d_code).strip(), d_name.strip(), fo_cnt, tot_sales, avg_score))

conn.commit()
conn.close()
print("Master SQLite database seeding successfully completed!")