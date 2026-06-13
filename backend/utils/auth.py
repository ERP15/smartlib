from functools import wraps

from flask import session, jsonify

from ..models import User

STAFF_ROLES = ('admin',)


def _error(message, status=401):
    return jsonify({'error': message, 'message': message}), status


def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return _error('Login required')
        return f(*args, **kwargs)
    return wrapper


def staff_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return _error('Login required')
        if session.get('role') not in STAFF_ROLES:
            return _error('Staff access required', 403)
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return _error('Login required')
        if session.get('role') != 'admin':
            return _error('Admin access required', 403)
        return f(*args, **kwargs)
    return wrapper
