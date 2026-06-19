import logging
import re
import sys
from datetime import timedelta
from pathlib import Path
from flask import Flask, send_from_directory
from flask_cors import CORS
from sqlalchemy import text

logger = logging.getLogger(__name__)

project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

try:
    from .config import Config
    from .extensions import db, bcrypt
except ImportError:
    try:
        from backend.config import Config
        from backend.extensions import db, bcrypt
    except ImportError:
        from config import Config
        from extensions import db, bcrypt


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

    # Check if failed_login_attempts column exists on users table
    exists = db.session.execute(
        text(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'users' "
            "AND COLUMN_NAME = 'failed_login_attempts'"
        ),
        {'schema': schema_name},
    ).scalar()
    if not exists:
        db.session.execute(
            text("ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 NOT NULL"),
        )
    else:
        db.session.execute(
            text("ALTER TABLE users MODIFY COLUMN failed_login_attempts INT DEFAULT 0 NOT NULL"),
        )

    # Check if late_returns column exists on users table
    exists_late = db.session.execute(
        text(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'users' "
            "AND COLUMN_NAME = 'late_returns'"
        ),
        {'schema': schema_name},
    ).scalar()
    if not exists_late:
        db.session.execute(
            text("ALTER TABLE users ADD COLUMN late_returns INT DEFAULT 0 NOT NULL"),
        )
    else:
        db.session.execute(
            text("ALTER TABLE users MODIFY COLUMN late_returns INT DEFAULT 0 NOT NULL"),
        )
        try:
            # Sync existing late returns from records where actual_return_date > due_date
            db.session.execute(
                text(
                    "UPDATE users u "
                    "JOIN ("
                    "  SELECT user_id, COUNT(*) as cnt "
                    "  FROM borrow_records "
                    "  WHERE actual_return_date IS NOT NULL AND actual_return_date > due_date "
                    "  GROUP BY user_id"
                    ") r ON u.id = r.user_id "
                    "SET u.late_returns = r.cnt"
                )
            )
        except Exception:
            pass

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

    # Upgrade notifications table schema
    for col_name, col_type in [
        ('title', 'VARCHAR(255) NOT NULL'),
        ('book_title', 'VARCHAR(255) NULL'),
        ('due_date', 'DATETIME NULL'),
        ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    ]:
        exists = db.session.execute(
            text(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'notifications' "
                "AND COLUMN_NAME = :column"
            ),
            {'schema': schema_name, 'column': col_name},
        ).scalar()
        if not exists:
            db.session.execute(
                text(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_type}"),
            )

    exists_type = db.session.execute(
        text(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'notifications' "
            "AND COLUMN_NAME = 'type'"
        ),
        {'schema': schema_name},
    ).scalar()
    if exists_type:
        db.session.execute(
            text("ALTER TABLE notifications DROP COLUMN type"),
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

    # Safe migration: add 'borrowed' to enum, update existing 'loans' or '' records, then modify enum to final state
    db.session.execute(
        text(
            "ALTER TABLE borrow_records "
            "MODIFY COLUMN status ENUM('loans','borrowed','returned','overdue','pending_return') "
            "DEFAULT 'borrowed'"
        )
    )
    db.session.execute(
        text(
            "UPDATE borrow_records "
            "SET status = 'borrowed' "
            "WHERE status = 'loans' OR status = '' OR status IS NULL"
        )
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

    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=25)
    app.config['SESSION_REFRESH_EACH_REQUEST'] = True

    import os
    # Configure production session cookies for cross-origin tracking on Vercel
    if os.getenv('VERCEL') == '1' or not app.config.get('DEBUG', False):
        app.config['SESSION_COOKIE_SAMESITE'] = 'None'
        app.config['SESSION_COOKIE_SECURE'] = True
    allowed_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'https://smartlib-y5ul.vercel.app',
        re.compile(r'^https://.*\.vercel\.app$'),
        re.compile(r'^http://localhost(:\d+)?$'),
        re.compile(r'^http://127\.0\.0\.1(:\d+)?$'),
    ]
    frontend_url = os.getenv('FRONTEND_URL')
    if frontend_url:
        allowed_origins.append(frontend_url.rstrip('/'))
        try:
            allowed_origins.append(re.compile(f"^{re.escape(frontend_url.rstrip('/'))}$"))
        except Exception:
            pass

    CORS(app, supports_credentials=True, origins=allowed_origins)


    db.init_app(app)
    bcrypt.init_app(app)

    try:
        from .routes.auth import auth_bp
        from .routes.books import books_bp
        from .routes.borrows import borrows_bp
        from .routes.admin import admin_bp
    except ImportError:
        try:
            from backend.routes.auth import auth_bp
            from backend.routes.books import books_bp
            from backend.routes.borrows import borrows_bp
            from backend.routes.admin import admin_bp
        except ImportError:
            from routes.auth import auth_bp
            from routes.books import books_bp
            from routes.borrows import borrows_bp
            from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(borrows_bp, url_prefix='/api/borrows')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Avoid hard-failing import on serverless platforms when DB is unavailable.
    # Set AUTO_CREATE_DB=true to run create_all/migrations automatically.
    if app.config.get('AUTO_CREATE_DB', False):
        try:
            with app.app_context():
                import backend.models  # noqa: F401
                db.create_all()
                _apply_schema_upgrades(app)
        except Exception:
            logger.exception('Database auto-initialization failed during app startup')

    # Ensure default admin has the correct password on startup
    try:
        with app.app_context():
            from backend.models import User
            admin = User.query.filter_by(email='admin@gmail.com').first()
            if admin:
                admin.password = bcrypt.generate_password_hash('Psyche_214').decode('utf-8')
                db.session.commit()
    except Exception:
        logger.exception('Failed to synchronize admin password on startup')

    @app.route('/')
    def index():
        from flask import jsonify
        return jsonify({"status": "healthy", "service": "SmartLib Backend API"}), 200


    @app.route('/api/debug-err')
    def debug_err():
        from flask import jsonify
        try:
            # Let's import all models and blueprints to see if it throws an error
            from backend.routes.auth import auth_bp
            from backend.routes.books import books_bp
            from backend.routes.borrows import borrows_bp
            from backend.routes.admin import admin_bp
            from backend.models import User, Book, BorrowRecord
            
            # Let's query one user and serialize it
            u = User.query.first()
            u_dict = None
            if u:
                from backend.routes.admin import user_to_dict
                u_dict = user_to_dict(u)
                
            # Let's query one borrow record and serialize it
            br = BorrowRecord.query.first()
            br_dict = None
            if br:
                from backend.serializers import borrow_to_dict
                br_dict = borrow_to_dict(br, include_user=True)
                
            return jsonify({
                "status": "success",
                "message": "All routes, models and serialization test passed!",
                "sample_user": u_dict,
                "sample_borrow": br_dict
            })
        except Exception as e:
            import traceback
            return jsonify({
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }), 500


    @app.route('/uploads/book_images/<path:filename>')
    def uploaded_book_image(filename):
        uploads_dir = Path(__file__).resolve().parent / 'uploads' / 'book_images'
        return send_from_directory(uploads_dir, filename)


    return app


# Expose a top-level WSGI app object for Vercel's Python runtime.
app = create_app()
application = app
handler = app


if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
    except Exception:
        app.run(host='::', port=5000, debug=True, use_reloader=False)
