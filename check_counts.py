import sqlite3

conn = sqlite3.connect('amico_erp.sqlite')
cursor = conn.cursor()

# Check products table count
cursor.execute('SELECT COUNT(*) FROM products;')
product_count = cursor.fetchone()[0]

# Check field officers table count
cursor.execute('SELECT COUNT(*) FROM field_officers;')
fo_count = cursor.fetchone()[0]

print(f"Products table rows: {product_count}")
print(f"Field Officers table rows: {fo_count}")

conn.close()