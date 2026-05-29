from flask import Blueprint, jsonify
from sqlalchemy import func

from ..extensions import db
from ..models import Book, User, BorrowRecord
from ..serializers import borrow_to_dict
from ..services.overdue import mark_overdue_records
from ..utils.auth import staff_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@staff_required
def dashboard():
    mark_overdue_records()

    total_books = Book.query.count()
    total_users = User.query.count()
    active_borrows = BorrowRecord.query.filter(
        BorrowRecord.status.in_(('borrowed', 'overdue', 'pending_return'))
    ).count()
    overdue_count = BorrowRecord.query.filter_by(status='overdue').count()
    pending_return_count = BorrowRecord.query.filter_by(status='pending_return').count()
    available_copies = db.session.query(
        func.coalesce(func.sum(Book.available_quantity), 0)
    ).scalar() or 0

    recent = (
        BorrowRecord.query
        .order_by(BorrowRecord.borrow_date.desc())
        .limit(8)
        .all()
    )
    overdue_loans = (
        BorrowRecord.query
        .filter_by(status='overdue')
        .order_by(BorrowRecord.due_date)
        .limit(10)
        .all()
    )
    pending_returns = (
        BorrowRecord.query
        .filter_by(status='pending_return')
        .order_by(BorrowRecord.return_request_date.desc())
        .limit(10)
        .all()
    )

    return jsonify({
        'stats': {
            'total_books': total_books,
            'total_users': total_users,
            'active_borrows': active_borrows,
            'overdue_count': overdue_count,
            'pending_return_count': pending_return_count,
            'available_copies': int(available_copies),
        },
        'recent_borrows': [borrow_to_dict(r, include_user=True) for r in recent],
        'overdue_loans': [borrow_to_dict(r, include_user=True) for r in overdue_loans],
        'pending_returns': [borrow_to_dict(r, include_user=True) for r in pending_returns],
    }), 200
