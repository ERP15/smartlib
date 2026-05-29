from datetime import date, timedelta, datetime

from flask import Blueprint, request, jsonify, session
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import Book, BorrowRecord, User
from ..serializers import borrow_to_dict
from ..services.overdue import mark_overdue_records
from ..utils.auth import login_required, staff_required, get_current_user

borrows_bp = Blueprint('borrows', __name__)

BORROW_DAYS = 14


def _error(message, status):
    return jsonify({'error': message, 'message': message}), status


@borrows_bp.route('', methods=['GET'])
@login_required
def list_borrows():
    mark_overdue_records()
    role = session.get('role')
    if role in ('admin', 'librarian'):
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

    book = Book.query.get(book_id)
    if not book:
        return _error('Book not found', 404)
    if book.available_quantity < 1:
        return _error('No copies available', 409)

    user = get_current_user()
    active = BorrowRecord.query.filter(
        BorrowRecord.user_id == user.id,
        BorrowRecord.book_id == book.id,
        BorrowRecord.status.in_(( 'borrowed', 'overdue', 'pending_return')),
    ).first()
    if active:
        return _error('You already have an active loan for this book', 409)

    due = date.today() + timedelta(days=BORROW_DAYS)
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

    if record.user_id != user.id and role not in ('admin', 'librarian'):
        return _error('Not allowed to return this loan', 403)

    if record.status == 'returned' or record.actual_return_date or record.return_date:
        return _error('Already returned', 409)

    if role in ('admin', 'librarian'):
        book = Book.query.get(record.book_id)
        record.actual_return_date = date.today()
        record.return_date = date.today()
        record.status = 'returned'
        if book:
            book.available_quantity = min(book.quantity, book.available_quantity + 1)

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

    record.return_request_date = date.today()
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
    if record.status != 'pending_return':
        return _error('No pending return request to confirm', 409)

    book = Book.query.get(record.book_id)
    record.actual_return_date = date.today()
    record.return_date = date.today()
    record.status = 'returned'
    if book:
        book.available_quantity = min(book.quantity, book.available_quantity + 1)

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
    record.status = 'overdue' if record.due_date < date.today() else 'borrowed'

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not reject return request', 500)

    return jsonify({
        'message': 'Return request rejected',
        'borrow': borrow_to_dict(record, include_user=True),
    }), 200
