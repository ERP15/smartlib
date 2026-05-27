from flask import Blueprint, request, jsonify, session
from sqlalchemy.exc import SQLAlchemyError
import re
from ..extensions import db, bcrypt
from ..models import User

auth_bp = Blueprint('auth', __name__)

EMAIL_PATTERN = re.compile(r'^[^@\s]+@iskolarngbayan\.pup\.edu\.ph$', re.IGNORECASE)
STUDENT_ID_PATTERN = re.compile(r'^[A-Z0-9]{4}-[A-Z0-9]{5}-PQ-0$', re.IGNORECASE)


def _error(message, status):
    return jsonify({'error': message, 'message': message}), status


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    student_id = (data.get('student_id') or '').strip().upper()
    name = data.get('name')
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    role = data.get('role', 'student')

    if not all([student_id, name, email, password]):
        return _error('Missing required fields', 400)

    # Enforce stricter rules only for student registrations
    if role == 'student':
        if not STUDENT_ID_PATTERN.match(student_id):
            return _error('Student ID must match XXXX-XXXXX-PQ-0', 400)

        if not EMAIL_PATTERN.match(email):
            return _error('Email must be an @iskolarngbayan.pup.edu.ph address', 400)

        if len(password) not in (6, 8):
            return _error('Password must be exactly 6 or 8 characters long', 400)

    existing = User.query.filter(
        (User.email == email) | (User.student_id == student_id)
    ).first()
    if existing:
        return _error('User with that email or student_id already exists', 409)

    try:
        pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(
            student_id=student_id,
            name=name,
            email=email,
            password=pw_hash,
            role=role,
        )
        db.session.add(user)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Database error — could not save user. Check server logs.', 500)

    return jsonify({
        'message': 'User registered',
        'user_id': user.id,
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return _error('Missing email or password', 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return _error('Invalid credentials', 401)

    if not bcrypt.check_password_hash(user.password, password):
        return _error('Invalid credentials', 401)

    session['user_id'] = user.id
    session['role'] = user.role

    user_payload = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
    }

    return jsonify({
        'message': 'Logged in',
        'access_token': f'session-{user.id}',
        'user': user_payload,
    }), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return _error('Not logged in', 401)
    user = User.query.get(user_id)
    if not user:
        session.clear()
        return _error('User not found', 401)
    return jsonify({
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'student_id': user.student_id,
        },
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200
