import pymysql
import sys
import time

# MySQL connection details
host = 'localhost'
user = 'root'
password = ''  # Change if you have a MySQL password
port = 3306
TIMEOUT = 5

def run_sql_file(filename, database=None):
    """Execute SQL file against MySQL"""
    try:
        # Read the SQL file
        with open(filename, 'r') as f:
            sql_content = f.read()
        
        print(f"\n→ Connecting to MySQL {user}@{host}:{port}...")
        
        # Connect to MySQL with timeout
        try:
            if database:
                conn = pymysql.connect(
                    host=host, user=user, password=password, 
                    database=database, port=port, connect_timeout=TIMEOUT
                )
            else:
                conn = pymysql.connect(
                    host=host, user=user, password=password, 
                    port=port, connect_timeout=TIMEOUT
                )
            print("✓ Connected successfully")
        except pymysql.err.OperationalError as e:
            print(f"\n✗ MySQL Connection Error: {e}")
            print("\n🔍 Troubleshooting:")
            print("  1. Is MySQL server running? Check Windows Services")
            print("  2. Is MySQL listening on localhost:3306?")
            print("  3. Is root password empty or do you need to update load_db.py?")
            return False
        
        cursor = conn.cursor()
        
        # Execute each SQL statement
        statements = sql_content.split(';')
        count = 0
        for statement in statements:
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                    count += 1
                except Exception as e:
                    print(f"  ⚠ {statement[:50]}... → {e}")
        
        conn.commit()
        conn.close()
        print(f"✓ Successfully executed {filename} ({count} statements)")
        return True
    except FileNotFoundError:
        print(f"✗ File not found: {filename}")
        return False
    except Exception as e:
        print(f"✗ Error executing {filename}: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("SmartLib Database Setup")
    print("=" * 60)
    
    # Step 1: Create database and tables
    print("\n[1/3] Creating database schema...")
    if run_sql_file('schema.sql'):
        # Step 2: Load sample data
        print("\n[2/3] Loading sample data...")
        if run_sql_file('sample_data.sql', database='smartlib'):
            # Step 3: Verify
            print("\n[3/3] Verifying tables...")
            try:
                conn = pymysql.connect(
                    host=host, user=user, password=password, 
                    database='smartlib', port=port, connect_timeout=TIMEOUT
                )
                cursor = conn.cursor()
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                print(f"✓ Database 'smartlib' created with {len(tables)} tables:")
                for table in tables:
                    print(f"    • {table[0]}")
                conn.close()
                
                print("\n" + "=" * 60)
                print("✓ DATABASE SETUP COMPLETE - Ready for Flask!")
                print("=" * 60)
            except Exception as e:
                print(f"✗ Verification error: {e}")
    else:
        print("\n✗ Database setup failed. Check MySQL connection.")
