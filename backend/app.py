import sys
from pathlib import Path
from flask import Flask, send_from_directory
from flask_cors import CORS
from sqlalchemy import text

project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

try:
    from .config import Config
    from .extensions import db, bcrypt
except ImportError:
    from backend.config import Config
    from backend.extensions import db, bcrypt


def _register_blueprint(app, module_path, attr, prefix):
    try:
        import importlib
        mod = importlib.import_module(module_path, package=None)
        bp = getattr(mod, attr)
        app.register_blueprint(bp, url_prefix=prefix)
    except Exception:
        try:
            mod = importlib.import_module(f'backend.routes.{module_path.split(".")[-1]}')
            bp = getattr(mod, attr)
            app.register_blueprint(bp, url_prefix=prefix)
        except Exception:
            pass


def _apply_schema_upgrades(app):
    if db.engine.dialect.name != 'mysql':
        return

    schema_name = app.config.get('DB_NAME') or app.config['SQLALCHEMY_DATABASE_URI'].rsplit('/', 1)[-1]
    for column_name in ('return_request_date', 'actual_return_date', 'due_date'):
        exists = db.session.execute(
            text(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'borrow_records' "
                "AND COLUMN_NAME = :column"
            ),
            {'schema': schema_name, 'column': column_name},
        ).scalar()
        if not exists:
            db.session.execute(
                text(f"ALTER TABLE borrow_records ADD COLUMN {column_name} DATETIME"),
            )

    db.session.execute(
        text(
            "ALTER TABLE borrow_records "
            "MODIFY COLUMN due_date DATETIME NOT NULL, "
            "MODIFY COLUMN return_request_date DATETIME NULL, "
            "MODIFY COLUMN actual_return_date DATETIME NULL"
        )
    )

    drop_columns = [
        ('books', 'isbn'),
        ('borrow_records', 'return_date'),
    ]
    for table_name, column_name in drop_columns:
        exists = db.session.execute(
            text(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table "
                "AND COLUMN_NAME = :column"
            ),
            {'schema': schema_name, 'table': table_name, 'column': column_name},
        ).scalar()
        if exists:
            db.session.execute(
                text(f"ALTER TABLE {table_name} DROP COLUMN {column_name}"),
            )

    db.session.execute(
        text(
            "ALTER TABLE borrow_records "
            "MODIFY COLUMN status ENUM('borrowed','returned','overdue','pending_return') "
            "DEFAULT 'borrowed'"
        )
    )
    db.session.commit()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True, origins=[
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ])

    db.init_app(app)
    bcrypt.init_app(app)

    try:
        from .routes.auth import auth_bp
        from .routes.books import books_bp
        from .routes.borrows import borrows_bp
        from .routes.admin import admin_bp
    except ImportError:
        from backend.routes.auth import auth_bp
        from backend.routes.books import books_bp
        from backend.routes.borrows import borrows_bp
        from backend.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(borrows_bp, url_prefix='/api/borrows')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    with app.app_context():
        import backend.models  # noqa: F401
        db.create_all()
        _apply_schema_upgrades(app)

    @app.route('/uploads/book_images/<path:filename>')
    def uploaded_book_image(filename):
        uploads_dir = Path(__file__).resolve().parent / 'uploads' / 'book_images'
        return send_from_directory(uploads_dir, filename)

    return app


if __name__ == '__main__':
    create_app().run(host='0.0.0.0', port=5000, debug=True)
