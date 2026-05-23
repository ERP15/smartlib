from datetime import date

from ..extensions import db
from ..models import BorrowRecord


def mark_overdue_records():
    """Mark active loans past due_date as overdue."""
    today = date.today()
    overdue = BorrowRecord.query.filter(
        BorrowRecord.status == 'borrowed',
        BorrowRecord.return_date.is_(None),
        BorrowRecord.due_date < today,
    ).all()
    for record in overdue:
        record.status = 'overdue'
    if overdue:
        db.session.commit()
    return len(overdue)
