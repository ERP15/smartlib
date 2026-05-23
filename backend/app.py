import sys
from pathlib import Path
from flask import Flask
from flask_cors import CORS

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

    if app.config.get('AUTO_CREATE_DB'):
        with app.app_context():
            import backend.models  # noqa: F401
            db.create_all()

    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=True)
