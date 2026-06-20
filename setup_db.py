"""
One-time script to create all tables in Clever Cloud MySQL.
Run from the project root:  py -3 setup_db.py
"""
import ssl
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

# Load env from both .env files
from dotenv import load_dotenv
load_dotenv(project_root / 'backend' / '.env')
load_dotenv(project_root / '.env')

import os

DB_HOST = os.getenv('DB_HOST', '').strip()
DB_PORT = os.getenv('DB_PORT', '3306').strip()
DB_USER = os.getenv('DB_USER', '').strip()
DB_PASSWORD = os.getenv('DB_PASSWORD', '').strip()
DB_NAME = os.getenv('DB_NAME', '').strip()

print(f"Connecting to: {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}")

# Build URI
uri = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SSL context that skips certificate verification (needed for Clever Cloud self-signed cert locally)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

engine = create_engine(
    uri,
    poolclass=NullPool,
    connect_args={
        'ssl': ssl_ctx,
        'connect_timeout': 30,
        'charset': 'utf8mb4',
    }
)

# Test connection
print("Testing connection...")
with engine.connect() as conn:
    conn.execute(text("SELECT 1"))
print("Connection OK!")

# Now create all tables using Flask app context
from flask import Flask
from backend.extensions import db
import backend.models  # noqa: F401 — registers all models

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': NullPool,
    'connect_args': {
        'ssl': ssl_ctx,
        'connect_timeout': 30,
        'charset': 'utf8mb4',
    }
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'setup-key')

db.init_app(app)

with app.app_context():
    db.create_all()
    tables = list(db.metadata.tables.keys())
    print(f"\nDone! Created {len(tables)} tables:")
    for t in sorted(tables):
        print(f"   - {t}")
    print("\nDatabase is ready! You can now deploy and login.")
