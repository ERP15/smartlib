"""Initialize MySQL database for SmartLib (XAMPP).

Run with XAMPP MySQL started:
  py -3.12 backend/init_db.py

Or import schema manually in phpMyAdmin / mysql CLI:
  mysql -u root < database/schema.sql
"""
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from backend.app import create_app
from backend.extensions import db
import backend.models  # noqa: F401

app = create_app()

with app.app_context():
    db.create_all()
    uri = app.config['SQLALCHEMY_DATABASE_URI']
    print('Database ready:', uri)
    print('Tables:', list(db.metadata.tables.keys()))
