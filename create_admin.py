"""
Creates the admin user in Clever Cloud MySQL (or resets password if exists).
Run:  py -3 create_admin.py
"""
import ssl
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / 'backend' / '.env')
load_dotenv(project_root / '.env')

import os

DB_HOST = os.getenv('DB_HOST', '').strip()
DB_PORT = os.getenv('DB_PORT', '3306').strip()
DB_USER = os.getenv('DB_USER', '').strip()
DB_PASSWORD = os.getenv('DB_PASSWORD', '').strip()
DB_NAME = os.getenv('DB_NAME', '').strip()

uri = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

from flask import Flask
from backend.extensions import db, bcrypt
import backend.models
from backend.models import User
from sqlalchemy.pool import NullPool

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': NullPool,
    'connect_args': {'ssl': ssl_ctx, 'connect_timeout': 30, 'charset': 'utf8mb4'},
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'setup-key')

db.init_app(app)
bcrypt.init_app(app)

ADMIN_EMAIL    = 'admin@gmail.com'
ADMIN_PASSWORD = 'Psyche_214'
ADMIN_NAME     = 'Admin'
ADMIN_STUDENT_ID = 'ADMIN-00000-PQ-0'

with app.app_context():
    admin = User.query.filter_by(email=ADMIN_EMAIL).first()
    if admin:
        admin.password = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
        admin.is_active = True
        admin.failed_login_attempts = 0
        db.session.commit()
        print(f"Admin password reset: {ADMIN_EMAIL}")
    else:
        pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
        admin = User(
            student_id=ADMIN_STUDENT_ID,
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password=pw_hash,
            role='admin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        print(f"Admin created: {ADMIN_EMAIL}")

    print(f"Login with: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
