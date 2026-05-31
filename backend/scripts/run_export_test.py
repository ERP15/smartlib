import sys
from pathlib import Path
proj_root = Path(__file__).resolve().parents[1]
if str(proj_root) not in sys.path:
    sys.path.insert(0, str(proj_root))

from backend.app import create_app

app = create_app()
with app.test_client() as c:
    # register/login admin
    c.post('/api/auth/register', json={"name":"TAdmin","email":"testadmin@example.com","password":"pass","role":"admin"})
    rv = c.post('/api/auth/login', json={"email":"testadmin@example.com","password":"pass"})
    print('login', rv.status_code)

    rv = c.get('/api/admin/reports/export?format=excel')
    print('xlsx status', rv.status_code, rv.content_type)
    with open('backend/tmp/test_export.xlsx', 'wb') as f:
        f.write(rv.data)

    rv2 = c.get('/api/admin/reports/export?format=pdf')
    print('pdf status', rv2.status_code, rv2.content_type)
    with open('backend/tmp/test_export.pdf', 'wb') as f:
        f.write(rv2.data)

print('done')
