from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, session
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import Book, BorrowRecord, User, Notification
from ..serializers import borrow_to_dict, notification_to_dict
from ..services.overdue import mark_overdue_records
from ..utils.auth import login_required, staff_required, get_current_user


borrows_bp = Blueprint('borrows', __name__)

BORROW_DAYS = 14
MIN_BORROW_DAYS = 1
MAX_BORROW_DAYS = 60
MAX_BORROW_HOURS = 720


def _error(message, status):
    return jsonify({'error': message, 'message': message}), status


def process_return_late_check(record):
    if not record.actual_return_date:
        record.actual_return_date = datetime.now()

    if record.actual_return_date > record.due_date:
        user = record.user
        if user and user.role == 'student':
            user.late_returns += 1
            if user.late_returns == 3:
                msg = "You have accumulated three (3) late returns. Two (2) more late returns will result in account suspension."
                notif = Notification(
                    user_id=user.id,
                    title="Account Warning",
                    message=msg,
                    is_read=False
                )
                db.session.add(notif)
            elif user.late_returns >= 5:
                user.is_active = False
                msg = "Your account has been automatically suspended due to reaching five (5) late returns. Please contact an administrator."
                notif = Notification(
                    user_id=user.id,
                    title="Account Suspended",
                    message=msg,
                    is_read=False
                )
                db.session.add(notif)


@borrows_bp.route('', methods=['GET'])
@login_required
def list_borrows():
    mark_overdue_records()
    role = session.get('role')
    if role == 'admin':
        records = BorrowRecord.query.order_by(BorrowRecord.borrow_date.desc()).all()
        return jsonify({
            'borrows': [borrow_to_dict(r, include_user=True) for r in records],
        }), 200

    user = get_current_user()
    records = (
        BorrowRecord.query
        .filter_by(user_id=user.id)
        .order_by(BorrowRecord.borrow_date.desc())
        .all()
    )
    return jsonify({
        'borrows': [borrow_to_dict(r) for r in records],
    }), 200


@borrows_bp.route('/mine', methods=['GET'])
@login_required
def my_borrows():
    mark_overdue_records()
    user = get_current_user()
    records = (
        BorrowRecord.query
        .filter_by(user_id=user.id)
        .order_by(BorrowRecord.borrow_date.desc())
        .all()
    )
    return jsonify({
        'borrows': [borrow_to_dict(r) for r in records],
    }), 200


@borrows_bp.route('/overdue', methods=['GET'])
@staff_required
def overdue_borrows():
    mark_overdue_records()
    records = (
        BorrowRecord.query
        .filter(BorrowRecord.status == 'overdue')
        .order_by(BorrowRecord.due_date)
        .all()
    )
    return jsonify({
        'borrows': [borrow_to_dict(r, include_user=True) for r in records],
    }), 200


@borrows_bp.route('/pending', methods=['GET'])
@staff_required
def pending_returns():
    records = (
        BorrowRecord.query
        .filter(BorrowRecord.status == 'pending_return')
        .order_by(BorrowRecord.return_request_date.desc())
        .all()
    )
    return jsonify({
        'borrows': [borrow_to_dict(r, include_user=True) for r in records],
    }), 200


@borrows_bp.route('', methods=['POST'])
@login_required
def borrow_book():
    data = request.get_json() or {}
    book_id = data.get('book_id')
    if not book_id:
        return _error('book_id is required', 400)

    due_date_str = data.get('due_date')
    if due_date_str:
        try:
            # Clean string (strip milliseconds and timezone indicator 'Z')
            clean_str = due_date_str.replace('Z', '').split('.')[0]
            due = datetime.fromisoformat(clean_str)
        except Exception as e:
            return _error(f'Invalid due_date format: {str(e)}', 400)
        
        if due <= datetime.now():
            return _error('Due date must be in the future', 400)
    else:
        borrow_duration = data.get('borrow_duration', BORROW_DAYS)
        borrow_unit = (data.get('borrow_unit') or 'days').strip().lower()
        try:
            borrow_duration = int(borrow_duration)
        except (TypeError, ValueError):
            return _error('borrow_duration must be a number', 400)

        if borrow_unit not in ('days', 'hours'):
            return _error('borrow_unit must be days or hours', 400)

        if borrow_unit == 'days' and not (MIN_BORROW_DAYS <= borrow_duration <= MAX_BORROW_DAYS):
            return _error(f'borrow_duration must be between {MIN_BORROW_DAYS} and {MAX_BORROW_DAYS} days', 400)
        if borrow_unit == 'hours' and not (1 <= borrow_duration <= MAX_BORROW_HOURS):
            return _error(f'borrow_duration must be between 1 and {MAX_BORROW_HOURS} hours', 400)

        due = datetime.now() + timedelta(days=borrow_duration if borrow_unit == 'days' else 0, hours=borrow_duration if borrow_unit == 'hours' else 0)

    book = Book.query.get(book_id)
    if not book:
        return _error('Book not found', 404)
    if book.available_quantity < 1:
        return _error('No copies available', 409)

    user = get_current_user()
    if not user.is_active or user.late_returns >= 5:
        return _error('Your account is suspended. You cannot borrow books.', 403)

    active = BorrowRecord.query.filter(
        BorrowRecord.user_id == user.id,
        BorrowRecord.book_id == book.id,
        BorrowRecord.status.in_(('borrowed', 'overdue', 'pending_return')),
    ).first()
    if active:
        return _error('You already have an active borrow for this book', 409)

    record = BorrowRecord(
        user_id=user.id,
        book_id=book.id,
        due_date=due,
        status='borrowed',
    )
    book.available_quantity -= 1

    try:
        db.session.add(record)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not create borrow record', 500)

    return jsonify({
        'message': 'Book borrowed',
        'borrow': borrow_to_dict(record),
    }), 201


@borrows_bp.route('/<int:borrow_id>/return', methods=['POST'])
@login_required
def return_book(borrow_id):
    record = BorrowRecord.query.get_or_404(borrow_id)
    user = get_current_user()
    role = session.get('role')

    if record.user_id != user.id and role != 'admin':
        return _error('Not allowed to return this borrowed book', 403)

    if record.status == 'returned' or record.actual_return_date:
        return _error('Already returned', 409)

    if role == 'admin':
        if record.status not in ('pending_return', 'borrowed', 'overdue'):
            return _error('No active borrow to return', 409)

        book = Book.query.get(record.book_id)
        record.actual_return_date = datetime.now()
        record.status = 'returned'
        if book:
            book.available_quantity = min(book.quantity, book.available_quantity + 1)
        process_return_late_check(record)

        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return _error('Could not finalize return', 500)

        return jsonify({
            'message': 'Return finalized',
            'borrow': borrow_to_dict(record),
        }), 200

    if record.status == 'pending_return':
        return _error('Return request already submitted', 409)

    record.return_request_date = datetime.now()
    record.status = 'pending_return'

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not submit return request', 500)

    return jsonify({
        'message': 'Return request submitted',
        'borrow': borrow_to_dict(record),
    }), 200


@borrows_bp.route('/<int:borrow_id>/confirm-return', methods=['POST'])
@staff_required
def confirm_return(borrow_id):
    record = BorrowRecord.query.get_or_404(borrow_id)
    if record.status not in ('pending_return', 'borrowed', 'overdue'):
        return _error('No active borrow to return', 409)

    book = Book.query.get(record.book_id)
    record.actual_return_date = datetime.now()
    record.status = 'returned'
    if book:
        book.available_quantity = min(book.quantity, book.available_quantity + 1)
    process_return_late_check(record)

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not confirm return', 500)

    return jsonify({
        'message': 'Return confirmed',
        'borrow': borrow_to_dict(record, include_user=True),
    }), 200


@borrows_bp.route('/<int:borrow_id>/reject-return', methods=['POST'])
@staff_required
def reject_return(borrow_id):
    record = BorrowRecord.query.get_or_404(borrow_id)
    if record.status != 'pending_return':
        return _error('No pending return request to reject', 409)

    record.return_request_date = None
    record.actual_return_date = None
    record.status = 'overdue' if record.due_date < datetime.now() else 'borrowed'

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not reject return request', 500)

    return jsonify({
        'message': 'Return request rejected',
        'borrow': borrow_to_dict(record, include_user=True),
    }), 200


@borrows_bp.route('/<int:borrow_id>/send-reminder', methods=['POST'])
@staff_required
def send_reminder(borrow_id):
    record = BorrowRecord.query.get_or_404(borrow_id)

    if record.status == 'returned' or record.actual_return_date:
        return _error('Book has already been returned', 400)

    is_overdue = record.status == 'overdue' or record.is_overdue()
    if is_overdue:
        message = "please return the book its already overdue"
    else:
        due_date_str = record.due_date.strftime('%Y-%m-%d %I:%M %p')
        message = f"Your borrowed book '{record.book.title if record.book else ''}' is due on {due_date_str}. Please return it on or before the due date."

    notification = Notification(
        user_id=record.user_id,
        title="Book Due Reminder",
        message=message,
        book_title=record.book.title if record.book else '',
        due_date=record.due_date,
        is_read=False
    )

    try:
        db.session.add(notification)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not create notification', 500)

    return jsonify({
        'message': 'Due reminder sent successfully',
        'notification': notification_to_dict(notification)
    }), 200


@borrows_bp.route('/notifications', methods=['GET'])
@login_required
def list_notifications():
    user = get_current_user()
    if not user:
        return _error('Login required', 401)
    try:
        notifications = (
            Notification.query.filter_by(user_id=user.id, is_read=False)
            .order_by(Notification.created_at.desc())
            .all()
        )
        return jsonify({
            'notifications': [notification_to_dict(n) for n in notifications],
        }), 200
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not load notifications', 503)


@borrows_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_read(notification_id):
    user = get_current_user()
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first_or_404()
    notification.is_read = True
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not mark notification as read', 500)
    return jsonify({
        'message': 'Notification marked as read'
    }), 200

