import sqlite3
import openpyxl

conn = sqlite3.connect('database/amico_erp.sqlite')
cursor = conn.cursor()

# 1. Create & Seed Products Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productCode TEXT UNIQUE,
    productName TEXT,
    unit TEXT,
    notes TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

wb_prod = openpyxl.load_workbook('amico_current_products.xlsx', data_only=True)
sheet_prod = wb_prod.active
for row in sheet_prod.iter_rows(min_row=2, values_only=True):
    if row[0] is not None or row[1] is not None:
        cursor.execute('''
        INSERT OR IGNORE INTO products (productCode, productName, unit, notes)
        VALUES (?, ?, ?, ?)
        ''', (str(row[0]), str(row[1]), str(row[2] or 'Tablets'), str(row[3] or '')))

# 2. Create & Seed Field Officers Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS field_officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teriCode TEXT UNIQUE,
    fullName TEXT,
    depotCode TEXT,
    depotName TEXT,
    joinDate TEXT,
    tenureMonths INTEGER,
    tenureBand TEXT,
    compositeScore REAL,
    tier TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

wb_fo = openpyxl.load_workbook('FO Evaluation .xlsx', data_only=True)
sheet_score = wb_fo['Scorecard']

# Start from row 5 to skip table headers ('Tenure (months)')
for r in range(5, sheet_score.max_row + 1):
    teri_code = sheet_score.cell(row=r, column=3).value
    if teri_code:
        try:
            tenure_val = int(sheet_score.cell(row=r, column=7).value or 0)
        except (ValueError, TypeError):
            tenure_val = 0

        try:
            score_val = float(sheet_score.cell(row=r, column=36).value or 0.0)
        except (ValueError, TypeError):
            score_val = 0.0

        cursor.execute('''
        INSERT OR IGNORE INTO field_officers (teriCode, fullName, depotCode, depotName, joinDate, tenureMonths, tenureBand, compositeScore, tier)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(teri_code),
            str(sheet_score.cell(row=r, column=2).value or ''),
            str(sheet_score.cell(row=r, column=4).value or ''),
            str(sheet_score.cell(row=r, column=5).value or ''),
            str(sheet_score.cell(row=r, column=6).value or ''),
            tenure_val,
            str(sheet_score.cell(row=r, column=8).value or ''),
            score_val,
            str(sheet_score.cell(row=r, column=37).value or 'C – Developing')
        ))

conn.commit()
conn.close()
print("Successfully seeded all products and Field Officers into SQLite database!")