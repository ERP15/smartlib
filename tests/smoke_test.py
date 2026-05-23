import os
import sys
import json
from pathlib import Path

# Ensure project root is on sys.path so 'backend' imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Use a lightweight SQLite DB for tests
os.environ['DATABASE_URL'] = 'sqlite:///dev.db'
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
            'student_id': 'ADM1',
            'name': 'Admin',
            'email': 'admin@example.com',
            'password': 'pass',
            'role': 'admin',
        })
        print('register admin ->', pretty(r))

        r = admin_client.post('/api/auth/login', json={'email': 'admin@example.com', 'password': 'pass'})
        print('login admin ->', pretty(r))

        # Create a book as admin
        r = admin_client.post('/api/books', json={
            'title': 'Test Book',
            'author': 'Author',
            'genre': 'Fiction',
            'quantity': 2,
        })
        print('create book ->', pretty(r))
        book = r.get_json().get('book') if r.status_code == 201 else None
        book_id = book.get('id') if book else None

        # Register and login student
        r = student_client.post('/api/auth/register', json={
            'student_id': 'STU1',
            'name': 'Student One',
            'email': 'stu1@example.com',
            'password': 'pass',
            'role': 'student',
        })
        print('register student ->', pretty(r))

        r = student_client.post('/api/auth/login', json={'email': 'stu1@example.com', 'password': 'pass'})
        print('login student ->', pretty(r))

        # Borrow the book
        r = student_client.post('/api/borrows', json={'book_id': book_id})
        print('borrow book ->', pretty(r))
        borrow = r.get_json().get('borrow') if r.status_code in (200, 201) else None
        borrow_id = borrow.get('id') if borrow else None

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


if __name__ == '__main__':
    run()
