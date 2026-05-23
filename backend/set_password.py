"""Set a user's password (bcrypt). Usage:
  py -3.12 backend/set_password.py admin@example.com admin123
"""
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from backend.app import create_app
from backend.extensions import db, bcrypt
from backend.models import User

if len(sys.argv) < 3:
    print('Usage: py -3.12 backend/set_password.py <email> <password>')
    sys.exit(1)

email, password = sys.argv[1], sys.argv[2]
app = create_app()

with app.app_context():
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f'User not found: {email}')
        sys.exit(1)
    user.password = bcrypt.generate_password_hash(password).decode('utf-8')
    db.session.commit()
    print(f'Password updated for {user.name} ({user.role})')
