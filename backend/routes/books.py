from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import Book
from ..serializers import book_to_dict
from ..utils.auth import login_required, staff_required

books_bp = Blueprint('books', __name__)


def _error(message, status):
    return jsonify({'error': message, 'message': message}), status


@books_bp.route('', methods=['GET'])
@login_required
def list_books():
    q = (request.args.get('q') or '').strip()
    query = Book.query
    if q:
        pattern = f'%{q}%'
        query = query.filter(
            or_(
                Book.title.ilike(pattern),
                Book.author.ilike(pattern),
                Book.genre.ilike(pattern),
                Book.isbn.ilike(pattern),
            )
        )
    books = query.order_by(Book.title).all()
    return jsonify({'books': [book_to_dict(b) for b in books]}), 200


@books_bp.route('/<int:book_id>', methods=['GET'])
@login_required
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify({'book': book_to_dict(book)}), 200


@books_bp.route('', methods=['POST'])
@staff_required
def create_book():
    data = request.get_json() or {}
    title = data.get('title')
    author = data.get('author')
    genre = data.get('genre')
    if not all([title, author, genre]):
        return _error('title, author, and genre are required', 400)

    quantity = int(data.get('quantity', 1))
    available = data.get('available_quantity')
    if available is None:
        available = quantity

    book = Book(
        title=title,
        author=author,
        genre=genre,
        isbn=data.get('isbn'),
        quantity=quantity,
        available_quantity=available,
        description=data.get('description'),
        image=data.get('image'),
    )
    try:
        db.session.add(book)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not create book (duplicate ISBN?)', 500)

    return jsonify({'message': 'Book created', 'book': book_to_dict(book)}), 201


@books_bp.route('/<int:book_id>', methods=['PUT'])
@staff_required
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json() or {}

    for field in ('title', 'author', 'genre', 'isbn', 'description', 'image'):
        if field in data:
            setattr(book, field, data[field])
    if 'quantity' in data:
        book.quantity = int(data['quantity'])
    if 'available_quantity' in data:
        book.available_quantity = int(data['available_quantity'])

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not update book', 500)

    return jsonify({'message': 'Book updated', 'book': book_to_dict(book)}), 200


@books_bp.route('/<int:book_id>', methods=['DELETE'])
@staff_required
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    try:
        db.session.delete(book)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return _error('Could not delete book (active loans may exist)', 500)

    return jsonify({'message': 'Book deleted'}), 200
