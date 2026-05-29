import os
import re
import smtplib
import random
from datetime import datetime, timedelta
from email.message import EmailMessage

from flask import Blueprint, request, jsonify, session
from sqlalchemy.exc import SQLAlchemyError

from ..config import Config
from ..extensions import db, bcrypt
from ..models import User

auth_bp = Blueprint('auth', __name__)

EMAIL_PATTERN = re.compile(r'^[^@\s]+@iskolarngbayan\.pup\.edu\.ph$', re.IGNORECASE)
STUDENT_ID_PATTERN = re.compile(r'^[A-Z0-9]{4}-[A-Z0-9]{5}-PQ-0$', re.IGNORECASE)
OTP_EXPIRATION_MINUTES = 10
OTP_LENGTH = 6


def _error(message, status):
    return jsonify({'error': message, 'message': message}), status


def _send_otp_email(recipient, otp_code):
    server = Config.MAIL_SERVER
    if not server:
        print(f'[OTP] Send to {recipient}: {otp_code}')
        return True

    msg = EmailMessage()
    msg['Subject'] = 'SmartLib login verification code'
    msg['From'] = Config.MAIL_USERNAME or 'noreply@smartlib.local'
    msg['To'] = recipient
    msg.set_content(
        f'Your SmartLib verification code is: {otp_code}\n\n'
        'Enter this code in the app to complete login. It expires in 10 minutes.'
    )

    try:
        if Config.MAIL_USE_SSL:
            smtp = smtplib.SMTP_SSL(server, Config.MAIL_PORT)
        else:
            smtp = smtplib.SMTP(server, Config.MAIL_PORT)
        if Config.MAIL_USE_TLS and not Config.MAIL_USE_SSL:
            smtp.starttls()
        if Config.MAIL_USERNAME and Config.MAIL_PASSWORD:
            smtp.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
        smtp.send_message(msg)
        smtp.quit()
        return True
    except Exception as exc:
        print(f'[OTP] Email send failed: {exc}')
        return False


def _generate_otp():
    return ''.join(str(random.randint(0, 9)) for _ in range(OTP_LENGTH))


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

    if not bcrypt.check_password_hash(user.password, password):
        return _error('Invalid credentials', 401)

    otp_code = _generate_otp()
    session['pending_user_id'] = user.id
    session['pending_otp_code'] = otp_code
    session['pending_otp_expires_at'] = (datetime.utcnow() + timedelta(minutes=OTP_EXPIRATION_MINUTES)).isoformat()

    sent = _send_otp_email(user.email, otp_code)
    message = 'OTP sent to your registered school email.'
    if not sent:
        message = 'OTP could not be emailed; check server logs or configure SMTP.'

    return jsonify({
        'message': message,
        'otp_required': True,
    }), 200


@auth_bp.route('/login/verify', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    code = (data.get('code') or '').strip()

    pending_user_id = session.get('pending_user_id')
    pending_code = session.get('pending_otp_code')
    expires_at = session.get('pending_otp_expires_at')

    if not all([pending_user_id, pending_code, expires_at]):
        return _error('OTP verification session expired', 401)

    if not code:
        return _error('OTP code is required', 400)

    try:
        expires_at_dt = datetime.fromisoformat(expires_at)
    except ValueError:
        return _error('OTP validation failed', 400)

    if datetime.utcnow() > expires_at_dt:
        session.pop('pending_user_id', None)
        session.pop('pending_otp_code', None)
        session.pop('pending_otp_expires_at', None)
        return _error('OTP expired', 401)

    if code != pending_code:
        return _error('Invalid OTP code', 401)

    user = User.query.get(pending_user_id)
    if not user:
        session.clear()
        return _error('Unable to complete login', 401)

    session['user_id'] = user.id
    session['role'] = user.role
    session.pop('pending_user_id', None)
    session.pop('pending_otp_code', None)
    session.pop('pending_otp_expires_at', None)

    user_payload = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
    }

    return jsonify({
        'message': 'OTP verified, logged in',
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
