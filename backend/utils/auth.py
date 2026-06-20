from functools import wraps

from flask import session, jsonify, request
from sqlalchemy.exc import SQLAlchemyError

from ..models import User

STAFF_ROLES = ('admin',)


def _error(message, status=401):
    return jsonify({'error': message, 'message': message}), status


def _token_user_id():
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip()
    if not token.startswith('session-'):
        return None
    try:
        return int(token.split('-', 1)[1])
    except (ValueError, IndexError):
        return None


def restore_session_from_token():
    """Restore Flask session from Bearer token (required on Vercel serverless)."""
    if session.get('user_id'):
        return True

    uid = _token_user_id()
    if uid is None:
        return False

    user = User.query.get(uid)
    if not user:
        return False

    session['user_id'] = user.id
    session['role'] = user.role
    session.permanent = True
    return True


def get_current_user():
    restore_session_from_token()
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            if not restore_session_from_token():
                return _error('Login required')
        except SQLAlchemyError:
            return _error('Database temporarily unavailable. Please try again.', 503)
        return f(*args, **kwargs)
    return wrapper


def staff_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            if not restore_session_from_token():
                return _error('Login required')
        except SQLAlchemyError:
            return _error('Database temporarily unavailable. Please try again.', 503)
        if session.get('role') not in STAFF_ROLES:
            return _error('Staff access required', 403)
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            if not restore_session_from_token():
                return _error('Login required')
        except SQLAlchemyError:
            return _error('Database temporarily unavailable. Please try again.', 503)
        if session.get('role') != 'admin':
            return _error('Admin access required', 403)
        return f(*args, **kwargs)
    return wrapper
