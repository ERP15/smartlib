from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import BorrowRecord, Notification


def get_pht_now():
    # Philippine Time is UTC+8
    return datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=8))).replace(tzinfo=None)


def send_automated_reminders():
    """Send automated 1-day-before-due reminders."""
    now = get_pht_now()
    one_day_from_now = now + timedelta(days=1)

    upcoming_records = BorrowRecord.query.filter(
        BorrowRecord.status == 'borrowed',
        BorrowRecord.actual_return_date.is_(None),
        BorrowRecord.due_date <= one_day_from_now,
        BorrowRecord.due_date > now,
    ).all()

    notifications_added = False
    for record in upcoming_records:
        existing_notif = Notification.query.filter_by(
            user_id=record.user_id,
            book_title=record.book.title if record.book else '',
            due_date=record.due_date,
            title='Book Due Reminder',
        ).first()

        if not existing_notif:
            book_title = record.book.title if record.book else 'Unknown Book'
            due_date_formatted = record.due_date.strftime('%B %d, %Y, %I:%M %p')
            message = (
                f'Reminder: The book "{book_title}" is due tomorrow ({due_date_formatted}). '
                'Please return it on time.'
            )

            notif = Notification(
                user_id=record.user_id,
                title='Book Due Reminder',
                message=message,
                book_title=book_title,
                due_date=record.due_date,
                is_read=False,
            )
            db.session.add(notif)
            notifications_added = True

    if notifications_added:
        db.session.commit()


def mark_overdue_records():
    """Mark active loans past due_date as overdue. Safe to call on every request."""
    try:
        now = get_pht_now()

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

        all_overdue = BorrowRecord.query.filter(
            BorrowRecord.status == 'overdue',
            BorrowRecord.actual_return_date.is_(None),
        ).all()

        notifications_added = False
        for record in all_overdue:
            existing_notif = Notification.query.filter_by(
                user_id=record.user_id,
                book_title=record.book.title if record.book else '',
                due_date=record.due_date,
                title='Book Overdue Notice',
            ).first()

            if not existing_notif:
                stale_notifs = Notification.query.filter(
                    Notification.user_id == record.user_id,
                    Notification.book_title == (record.book.title if record.book else ''),
                    Notification.title == 'Book Due Reminder',
                    Notification.message.like('%overdue%'),
                    Notification.is_read.is_(False),
                ).all()
                for stale in stale_notifs:
                    db.session.delete(stale)

                book_title = record.book.title if record.book else 'Unknown Book'
                due_date_formatted = record.due_date.strftime('%B %d, %Y, %I:%M %p')
                message = (
                    f'The book "{book_title}" was due on {due_date_formatted} and is now overdue. '
                    'Please return it as soon as possible.'
                )

                notif = Notification(
                    user_id=record.user_id,
                    title='Book Overdue Notice',
                    message=message,
                    book_title=book_title,
                    due_date=record.due_date,
                    is_read=False,
                )
                db.session.add(notif)
                notifications_added = True

        if notifications_added:
            db.session.commit()

        try:
            send_automated_reminders()
        except SQLAlchemyError:
            db.session.rollback()

        return len(overdue)
    except SQLAlchemyError:
        db.session.rollback()
        return 0
