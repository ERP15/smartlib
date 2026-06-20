import os
import ssl
from dotenv import load_dotenv
from pathlib import Path

basedir = Path(__file__).resolve().parent
project_root = basedir.parent

load_dotenv(basedir / '.env')
load_dotenv(project_root / '.env')

ON_VERCEL = os.getenv('VERCEL') == '1'


def _build_mysql_uri():
    user = os.getenv('DB_USER', 'root').strip()
    password = os.getenv('DB_PASSWORD', '').strip()
    host = os.getenv('DB_HOST', '127.0.0.1').strip()
    port = os.getenv('DB_PORT', '3306').strip()
    name = os.getenv('DB_NAME', 'smartlib').strip()
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


def _engine_options():
    """Serverless-safe SQLAlchemy engine settings (Vercel + Clever Cloud MySQL).

    Clever Cloud free tier allows only 5 simultaneous connections.
    Vercel serverless spins up many instances at once - each instance would
    normally hold open a connection pool, exhausting the 5-connection limit.
    Using NullPool means connections are opened and immediately closed per
    request, so we never accumulate idle connections across instances.
    """
    from sqlalchemy.pool import NullPool

    connect_args = {
        'connect_timeout': 20,
        'read_timeout': 30,
        'write_timeout': 30,
        'charset': 'utf8mb4',
    }

    host = os.getenv('DB_HOST', '').strip()
    is_clever_cloud = 'clever-cloud.com' in host

    if ON_VERCEL or is_clever_cloud:
        connect_args['ssl'] = ssl.create_default_context()

    options = {
        'connect_args': connect_args,
        'pool_pre_ping': True,
    }

    if ON_VERCEL or is_clever_cloud:
        # NullPool: no persistent connection pool.
        # Every request opens a fresh connection and closes it immediately.
        # This is the only safe strategy with Clever Cloud's 5-connection cap
        # and Vercel's many concurrent serverless instances.
        options['poolclass'] = NullPool
    else:
        # Local dev: small pool, well within any local MySQL limits.
        options['pool_recycle'] = 280
        options['pool_size'] = 2
        options['max_overflow'] = 2

    return options


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-change-in-production').strip()
    DB_USER = os.getenv('DB_USER', 'root').strip()
    DB_PASSWORD = os.getenv('DB_PASSWORD', '').strip()
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1').strip()
    DB_PORT = os.getenv('DB_PORT', '3306').strip()
    DB_NAME = os.getenv('DB_NAME', 'smartlib').strip()

    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'

    _database_url = os.getenv('DATABASE_URL', '').strip()
    if _database_url:
        SQLALCHEMY_DATABASE_URI = _database_url
    else:
        SQLALCHEMY_DATABASE_URI = _build_mysql_uri()

    SQLALCHEMY_ENGINE_OPTIONS = _engine_options()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BCRYPT_LOG_ROUNDS = int(os.getenv('BCRYPT_LOG_ROUNDS', '12'))

    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() in ('1', 'true', 'yes')
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'false').lower() in ('1', 'true', 'yes')

    # Never run schema migrations on every serverless cold start.
    AUTO_CREATE_DB = (
        not ON_VERCEL
        and os.getenv('AUTO_CREATE_DB', '1' if DEBUG else '0').lower() in ('1', 'true', 'yes')
    )
