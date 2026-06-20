import ssl
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

project_root = Path(__file__).resolve().parent
load_dotenv(project_root / 'backend' / '.env')
load_dotenv(project_root / '.env')

DB_HOST = os.getenv('DB_HOST', '').strip()
DB_PORT = os.getenv('DB_PORT', '3306').strip()
DB_USER = os.getenv('DB_USER', '').strip()
DB_PASSWORD = os.getenv('DB_PASSWORD', '').strip()
DB_NAME = os.getenv('DB_NAME', '').strip()

print(f"Connecting to: {DB_HOST}:{DB_PORT}/{DB_NAME}")

# Build URI
uri = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

engine = create_engine(
    uri,
    poolclass=NullPool,
    connect_args={
        'ssl': ssl_ctx,
        'connect_timeout': 30,
        'charset': 'utf8mb4',
    }
)

tables = ['users', 'books', 'borrow_records', 'notifications']

print("\n--- Database Row Counts ---")
with engine.connect() as conn:
    for table in tables:
        try:
            res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = res.scalar()
            print(f"Table '{table}': {count} rows")
        except Exception as e:
            print(f"Table '{table}': Error querying -> {e}")
