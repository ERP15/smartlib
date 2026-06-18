import mysql.connector

try:
    # Connect to MySQL
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',  # Change this if you have a password
        database='smartlib'
    )
    cursor = conn.cursor()
    
    # Read the SQL file
    with open('database/sample_data.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Split and execute statements
    statements = sql_content.split(';')
    count = 0
    
    for statement in statements:
        statement = statement.strip()
        if statement and not statement.startswith('--') and not statement.startswith('/*'):
            try:
                cursor.execute(statement)
                count += 1
            except Exception as e:
                print(f"Error executing statement: {e}")
                print(f"Statement: {statement[:100]}...")
    
    # Commit all changes
    conn.commit()
    print(f"✓ Successfully imported data! {count} statements executed.")
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"✗ Error: {e}")
