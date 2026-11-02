import sqlite3

# Connect to the central ERP SQLite Database
conn = sqlite3.connect('database/amico_erp.sqlite')
cursor = conn.cursor()

# 1. Ensure journal_entries schema exists
cursor.execute('''
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entryNumber TEXT UNIQUE,
    entryType TEXT,
    paymentCategory TEXT,
    date TEXT,
    referenceId TEXT,
    vatAmount REAL,
    outstandingAmount REAL,
    settledAmount REAL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
''')

# 2. Ensure journal_entry_lines schema exists
cursor.execute('''
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journalEntryId INTEGER,
    itemName TEXT,
    unit TEXT,
    debit REAL,
    credit REAL,
    quantity REAL,
    unitPrice REAL,
    FOREIGN KEY(journalEntryId) REFERENCES journal_entries(id)
);
''')

# 3. Insert INV-556862 dated 2026-10-12
cursor.execute('''
INSERT OR REPLACE INTO journal_entries 
(entryNumber, entryType, paymentCategory, date, referenceId, vatAmount, outstandingAmount, settledAmount, description)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (
    'INV-556862', 
    'RECEIVABLE', 
    'GENERAL (CASH)', 
    '2026-10-12', 
    'SO-1001', 
    3750.0, 
    25000.0, 
    0.0, 
    'Sales Order via FO: ODK-52 - NAZIM UDDIN (Dhaka) - SKU: [SKU-049] Amiflox 500 Tablet'
))

entry_id = cursor.lastrowid

# 4. Insert Double-Entry Accounts Line Items
cursor.execute('''
INSERT INTO journal_entry_lines (journalEntryId, itemName, unit, debit, credit, quantity, unitPrice)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', (entry_id, '[SKU-049] Amiflox 500 Tablet', 'Tablets', 25000.0, 0.0, 100, 250.0))

cursor.execute('''
INSERT INTO journal_entry_lines (journalEntryId, itemName, unit, debit, credit, quantity, unitPrice)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', (entry_id, 'Sales Revenue Offset Account', 'N/A', 0.0, 25000.0, 0, 0.0))

conn.commit()
conn.close()

print("Successfully injected INV-556862 (Date: 2026-10-12) into General Ledger!")