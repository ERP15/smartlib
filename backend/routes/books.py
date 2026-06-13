import os
import unicodedata
from collections import Counter
from pathlib import Path
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import Book, BorrowRecord
from ..serializers import book_to_dict
from ..utils.auth import login_required, staff_required, get_current_user

books_bp = Blueprint('books', __name__)

UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / 'uploads' / 'book_images'
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png'}


def _error(message, status):
    return jsonify({'error': message, 'message': message}), status


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


@books_bp.route('', methods=['GET'])
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
            )
        )
    books = query.order_by(Book.title).all()
    return jsonify({'books': [book_to_dict(b) for b in books]}), 200


@books_bp.route('/debug/all-books', methods=['GET'])
def debug_all_books():
    """Debug endpoint - shows all books with normalized author/genre"""
    books = Book.query.all()
    debug_books = []
    for b in books:
        debug_books.append({
            'id': b.id,
            'title': b.title,
            'author': b.author,
            'author_normalized': _normalize(b.author or ''),
            'genre': b.genre,
            'genre_normalized': _normalize(b.genre or ''),
            'available_quantity': b.available_quantity,
        })
    return jsonify({'books': debug_books}), 200


@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify({'book': book_to_dict(book)}), 200


def _normalize(text):
    if not text:
        return ""
    # Remove accents/diacritics and convert to lowercase
    nfkd_form = unicodedata.normalize('NFKD', text)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)]).lower().strip()


@books_bp.route('/recommendations', methods=['GET'])
@login_required
def recommend_books():
    user = get_current_user()
    genre_filter = (request.args.get('genre') or '').strip()
    author_filter = (request.args.get('author') or '').strip()
    
    genre_filter_norm = _normalize(genre_filter)
    author_filter_norm = _normalize(author_filter)

    try:
        limit = int(request.args.get('limit', 6))
    except (TypeError, ValueError):
        limit = 6
    limit = max(1, min(limit, 20))

    history = (
        BorrowRecord.query
        .join(Book)
        .filter(BorrowRecord.user_id == user.id)
        .order_by(BorrowRecord.borrow_date.desc())
        .all()
    )
    loans_book_ids = {record.book_id for record in history if record.book_id}
    genre_counts = Counter()
    author_counts = Counter()
    for record in history:
        if record.book:
            # Use normalized versions for consistent matching with special characters
            genre_norm = _normalize(record.book.genre or '')
            author_norm = _normalize(record.book.author or '')
            genre_counts[genre_norm] += 1
            author_counts[author_norm] += 1

    popularity_rows = (
        db.session.query(
            BorrowRecord.book_id,
            db.func.count(BorrowRecord.id).label('borrow_count'),
        )
        .group_by(BorrowRecord.book_id)
        .all()
    )
    popularity = {row.book_id: int(row.borrow_count or 0) for row in popularity_rows}

    query = Book.query.filter(Book.available_quantity > 0)
    if loans_book_ids:
        query = query.filter(~Book.id.in_(loans_book_ids))

    recommendations = []
    for book in query.all():
        score = 0
        reasons = []
        # Use normalized versions for consistent matching
        genre_key_norm = _normalize(book.genre or '')
        author_key_norm = _normalize(book.author or '')

        # Check history matches using normalized keys
        genre_hits = genre_counts.get(genre_key_norm, 0)
        if genre_hits:
            score += genre_hits * 5
            reasons.append(f"Matches your {book.genre} borrowing history")

        author_hits = author_counts.get(author_key_norm, 0)
        if author_hits:
            score += author_hits * 6
            reasons.append(f"Same author as books you've loans: {book.author}")

        if genre_filter_norm:
            book_genre_norm = _normalize(book.genre)
            is_genre_match = False
            if genre_filter_norm in book_genre_norm or book_genre_norm in genre_filter_norm:
                is_genre_match = True
            elif genre_filter_norm == 'history' and 'historical' in book_genre_norm:
                is_genre_match = True
            elif genre_filter_norm == 'historical' and 'history' in book_genre_norm:
                is_genre_match = True

            if is_genre_match:
                score += 50
                reasons.append(f"Matches requested genre: {genre_filter}")

        if author_filter_norm:
            book_author_norm = _normalize(book.author)
            if author_filter_norm in book_author_norm or book_author_norm in author_filter_norm:
                score += 50
                reasons.append(f"Matches requested author: {author_filter}")

        borrow_popularity = popularity.get(book.id, 0)
        if borrow_popularity:
            score += min(borrow_popularity, 10)
            reasons.append(f"loans {borrow_popularity} times in the library")

        if not reasons:
            reasons.append('Available title')

        recommendations.append({
            'book': book_to_dict(book),
            'score': score,
            'reasons': reasons,
        })

    recommendations.sort(
        key=lambda item: (
            -item['score'],
            item['book']['title'].lower(),
            item['book']['author'].lower(),
        )
    )

    return jsonify({
        'recommendations': recommendations[:limit],
    }), 200


@books_bp.route('/upload-image', methods=['POST'])
@staff_required
def upload_book_image():
    if 'image' not in request.files:
        return _error('No image file provided', 400)

    image = request.files['image']
    if image.filename == '':
        return _error('No image selected', 400)
    if not _allowed_file(image.filename):
        return _error('Allowed image formats are JPG, JPEG, PNG', 400)

    ext = os.path.splitext(image.filename)[1].lower()
    filename = secure_filename(f"{Path(image.filename).stem}-{os.urandom(8).hex()}{ext}")
    path = UPLOAD_FOLDER / filename
    image.save(path)

    image_path = f'/uploads/book_images/{filename}'
    return jsonify({'image': image_path}), 200


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
        return _error('Could not create book', 500)

    return jsonify({'message': 'Book created', 'book': book_to_dict(book)}), 201


@books_bp.route('/<int:book_id>', methods=['PUT'])
@staff_required
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json() or {}

    for field in ('title', 'author', 'genre', 'description', 'image'):
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
        # Delete all associated borrow records first (cascade behavior)
        BorrowRecord.query.filter_by(book_id=book_id).delete()
        # Then delete the book
        db.session.delete(book)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return _error(f'Could not delete book: {str(e)}', 500)

    return jsonify({'message': 'Book deleted successfully'}), 200
