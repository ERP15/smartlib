import os
import sys
import json
from pathlib import Path
from uuid import uuid4

# Ensure project root is on sys.path so 'backend' imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Use the configured MySQL database for tests
os.environ.pop('DATABASE_URL', None)
os.environ['FLASK_ENV'] = 'development'
# Reduce bcrypt rounds for speed in tests
os.environ['BCRYPT_LOG_ROUNDS'] = '4'

from backend.app import create_app
from backend.extensions import db


def pretty(resp):
    try:
        data = resp.get_json()
    except Exception:
        data = resp.data.decode('utf-8')
    return resp.status_code, data


def run():
    app = create_app()
    suffix = uuid4().hex[:8]
    token = uuid4().hex.upper()
    admin_email = f'admin-{suffix}@example.com'
    student_email = f'stu1-{suffix}@iskolarngbayan.pup.edu.ph'
    admin_student_id = f'ADM-{suffix.upper()}'
    student_id = f'{token[:4]}-{token[4:9]}-PQ-0'
    book_title = f'Test Book {suffix}'

    with app.app_context():
        # start fresh
        try:
            db.drop_all()
        except Exception:
            pass
        db.create_all()

        admin_client = app.test_client()
        student_client = app.test_client()

        # Register and login admin
        r = admin_client.post('/api/auth/register', json={
            'student_id': admin_student_id,
            'name': 'Admin',
            'email': admin_email,
            'password': 'Passw0rd!',
            'role': 'admin',
        })
        print('register admin ->', pretty(r))

        r = admin_client.post('/api/auth/login', json={'email': admin_email, 'password': 'Passw0rd!'})
        print('login admin ->', pretty(r))

        # Create a book as admin
        r = admin_client.post('/api/books', json={
            'title': book_title,
            'author': 'Author',
            'genre': 'Fiction',
            'quantity': 2,
        })
        print('create book ->', pretty(r))
        book = r.get_json().get('book') if r.status_code == 201 else None
        book_id = book.get('id') if book else None

        # Register and login student
        r = student_client.post('/api/auth/register', json={
            'student_id': student_id,
            'name': 'Student One',
            'email': student_email,
            'password': 'Passw0rd!',
            'role': 'student',
        })
        print('register student ->', pretty(r))

        r = student_client.post('/api/auth/login', json={'email': student_email, 'password': 'Passw0rd!'})
        print('login student ->', pretty(r))

        # Borrow the book
        r = student_client.post('/api/borrows', json={'book_id': book_id})
        print('borrow book ->', pretty(r))
        borrow = r.get_json().get('borrow') if r.status_code in (200, 201) else None
        borrow_id = borrow.get('id') if borrow else None

        # Recommendations for the student
        r = student_client.get('/api/books/recommendations')
        print('recommendations ->', pretty(r))

        # List my borrows
        r = student_client.get('/api/borrows/mine')
        print('my borrows ->', pretty(r))

        # Return the book
        if borrow_id:
            r = student_client.post(f'/api/borrows/{borrow_id}/return')
            print('return book ->', pretty(r))

        # Final borrow list (admin view)
        r = admin_client.get('/api/borrows')
        print('all borrows (admin) ->', pretty(r))

        # Admin analytics reports
        r = admin_client.get('/api/admin/reports')
        print('admin reports ->', pretty(r))


if __name__ == '__main__':
    run()
