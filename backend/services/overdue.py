from datetime import date, datetime, time

from ..extensions import db
from ..models import BorrowRecord


def mark_overdue_records():
    """Mark active loans past due_date as overdue."""
    now = datetime.utcnow()

    def as_datetime(value):
        if isinstance(value, date) and not isinstance(value, datetime):
            return datetime.combine(value, time.min)
        return value

    overdue = BorrowRecord.query.filter(
        BorrowRecord.status == 'borrowed',
        BorrowRecord.actual_return_date.is_(None),
        BorrowRecord.due_date < now,
    ).all()
    for record in overdue:
        record.due_date = as_datetime(record.due_date)
        record.status = 'overdue'
    if overdue:
        db.session.commit()
    return len(overdue)
