import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from backend.app import create_app
from backend.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        print(u.id, u.email, u.name, u.student_id)
