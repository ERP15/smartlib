def safe_isoformat(val):
    if not val:
        return None
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    s = str(val)
    if ' ' in s and 'T' not in s:
        s = s.replace(' ', 'T')
    return s


def book_to_dict(book):
    return {
        'id': book.id,
        'title': book.title,
        'author': book.author,
        'genre': book.genre,
        'quantity': book.quantity,
        'available_quantity': book.available_quantity,
        'description': book.description,
        'image': book.image,
    }


def borrow_to_dict(record, include_user=False):
    data = {
        'id': record.id,
        'user_id': record.user_id,
        'book_id': record.book_id,
        'book_title': record.book.title if record.book else None,
        'book_author': record.book.author if record.book else None,
        'borrow_date': safe_isoformat(record.borrow_date),
        'due_date': safe_isoformat(record.due_date),
        'return_request_date': safe_isoformat(record.return_request_date),
        'actual_return_date': safe_isoformat(record.actual_return_date),
        'status': record.status,
        'is_overdue': record.is_overdue(),
    }
    if include_user and record.user:
        data['user_name'] = record.user.name
        data['user_email'] = record.user.email
        data['student_id'] = record.user.student_id
    return data


def notification_to_dict(notification):
    return {
        'id': notification.id,
        'user_id': notification.user_id,
        'title': notification.title,
        'message': notification.message,
        'book_title': notification.book_title,
        'due_date': safe_isoformat(notification.due_date),
        'is_read': notification.is_read,
        'created_at': safe_isoformat(notification.created_at),
        'updated_at': safe_isoformat(notification.updated_at),
    }
