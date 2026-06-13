import os
import re

from flask import Blueprint, request, jsonify, session
from sqlalchemy.exc import SQLAlchemyError

from ..config import Config
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

    if role == 'student':
        if not STUDENT_ID_PATTERN.match(student_id):
            return _error('Student ID must match XXXX-XXXXX-PQ-0', 400)

        if not EMAIL_PATTERN.match(email):
            return _error('Email must be an @iskolarngbayan.pup.edu.ph address', 400)

        if len(password) < 8:
            return _error('Password must be at least 8 characters long', 400)

        if not re.search(r'[A-Z]', password):
            return _error('Password must include at least one uppercase letter', 400)
        if not re.search(r'[a-z]', password):
            return _error('Password must include at least one lowercase letter', 400)
        if not re.search(r'[0-9]', password):
            return _error('Password must include at least one number', 400)
        if not re.search(r'[^A-Za-z0-9]', password):
            return _error('Password must include at least one special character', 400)

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

    # Check if user is active
    if not user.is_active:
        if user.failed_login_attempts >= 3:
            return _error('Your account has been deactivated due to too many failed login attempts. Please contact an administrator.', 403)
        return _error('Your account has been deactivated.', 403)

    if not bcrypt.check_password_hash(user.password, password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 3:
            user.is_active = False
            db.session.commit()
            return _error('Invalid credentials. Too many failed login attempts. Your account has been deactivated.', 403)
        
        db.session.commit()
        attempts_left = 3 - user.failed_login_attempts
        return _error(f'Invalid credentials. You have {attempts_left} attempts remaining before account deactivation.', 401)

    # Reset attempts on successful login
    user.failed_login_attempts = 0
    db.session.commit()

    session.permanent = True
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


@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return _error('Not logged in', 401)
    user = User.query.get(user_id)
    if not user:
        session.clear()
        return _error('User not found', 401)
        
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if name:
        user.name = name.strip()
    if email:
        email = email.strip().lower()
        if user.role == 'student' and not EMAIL_PATTERN.match(email):
            return _error('Email must be an @iskolarngbayan.pup.edu.ph address', 400)
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != user.id:
            return _error('Email is already in use', 400)
        user.email = email
    if password:
        password = password.strip()
        if user.role == 'student':
            if len(password) < 8:
                return _error('Password must be at least 8 characters long', 400)
            if not re.search(r'[A-Z]', password):
                return _error('Password must include at least one uppercase letter', 400)
            if not re.search(r'[a-z]', password):
                return _error('Password must include at least one lowercase letter', 400)
            if not re.search(r'[0-9]', password):
                return _error('Password must include at least one number', 400)
            if not re.search(r'[^A-Za-z0-9]', password):
                return _error('Password must include at least one special character', 400)
        user.password = bcrypt.generate_password_hash(password).decode('utf-8')
        
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return _error('Failed to update profile', 500)
        
    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'student_id': user.student_id,
        }
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200
