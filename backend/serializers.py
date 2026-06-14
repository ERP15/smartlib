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
        'borrow_date': record.borrow_date.isoformat() + 'Z' if record.borrow_date else None,
        'due_date': record.due_date.isoformat() + 'Z' if record.due_date else None,
        'return_request_date': record.return_request_date.isoformat() + 'Z' if record.return_request_date else None,
        'actual_return_date': record.actual_return_date.isoformat() + 'Z' if record.actual_return_date else None,
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
        'due_date': notification.due_date.isoformat() + 'Z' if notification.due_date else None,
        'is_read': notification.is_read,
        'created_at': notification.created_at.isoformat() + 'Z' if notification.created_at else None,
        'updated_at': notification.updated_at.isoformat() + 'Z' if notification.updated_at else None,
    }

