from pathlib import Path
import sys
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from backend.app import create_app
from backend.extensions import db, bcrypt
from backend.models import User

app = create_app()
ADMIN_EMAIL = 'admin@example.com'
ADMIN_PW = 'Admin#1234'

with app.app_context():
    # ensure admin user exists
    admin = User.query.filter_by(email=ADMIN_EMAIL).first()
    if not admin:
        pw_hash = bcrypt.generate_password_hash(ADMIN_PW).decode('utf-8')
        admin = User(student_id='ADMIN-0000-PQ-0', name='Admin', email=ADMIN_EMAIL, password=pw_hash, role='admin')
        db.session.add(admin)
        db.session.commit()
        print('Created admin user', ADMIN_EMAIL)
    else:
        print('Admin user exists')

    client = app.test_client()
    # login
    res = client.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PW})
    print('login status', res.status_code, res.get_json())
    if res.status_code != 200:
        print('Login failed; aborting')
        sys.exit(1)

    # export excel
    r1 = client.get('/api/admin/reports/export', query_string={'format': 'excel'})
    print('excel status', r1.status_code, r1.content_type)
    if r1.status_code == 200:
        out = root / 'tmp' / 'library-reports.xlsx'
        out.parent.mkdir(exist_ok=True)
        with open(out, 'wb') as f:
            f.write(r1.data)
        print('Wrote', out)
    else:
        print('Excel export failed', r1.get_data(as_text=True))

    # export pdf
    r2 = client.get('/api/admin/reports/export', query_string={'format': 'pdf'})
    print('pdf status', r2.status_code, r2.content_type)
    if r2.status_code == 200:
        out = root / 'tmp' / 'library-reports.pdf'
        with open(out, 'wb') as f:
            f.write(r2.data)
        print('Wrote', out)
    else:
        print('PDF export failed', r2.get_data(as_text=True))
