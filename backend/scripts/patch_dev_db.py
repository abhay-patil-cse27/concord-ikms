import sqlite3

def patch_db():
    conn = sqlite3.connect('concord_dev.db')
    cursor = conn.cursor()
    cols = [r[1] for r in cursor.execute('PRAGMA table_info(documents)').fetchall()]
    new_cols = [
        ('lifecycle_status', "VARCHAR(30) DEFAULT 'active'"),
        ('version', "VARCHAR(20) DEFAULT '1.0'"),
        ('effective_date', 'DATETIME'),
        ('expiration_date', 'DATETIME'),
        ('superseded_by_id', 'VARCHAR(36)'),
        ('approval_status', "VARCHAR(30) DEFAULT 'approved'"),
        ('approved_by_id', 'VARCHAR(36)'),
        ('approval_notes', 'TEXT'),
        ('approved_at', 'DATETIME'),
    ]
    for col_name, col_type in new_cols:
        if col_name not in cols:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE documents ADD COLUMN {col_name} {col_type}")
    conn.commit()
    conn.close()
    print("Database patched successfully.")

if __name__ == '__main__':
    patch_db()
