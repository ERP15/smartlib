import os
from dotenv import load_dotenv
from pathlib import Path

basedir = Path(__file__).resolve().parent
project_root = basedir.parent

# Load env: backend/.env first, then project root .env (root overrides)
load_dotenv(basedir / '.env')
load_dotenv(project_root / '.env')


def _build_mysql_uri():
    on_vercel = os.getenv('VERCEL') == '1'
    default_user = 'uxdw3uznfcxi6lkc' if on_vercel else 'root'
    default_password = '3mBuqhLyX2QT5Pzp0rI2' if on_vercel else ''
    default_host = 'bhafgne00w0zajbx61pd-mysql.services.clever-cloud.com' if on_vercel else '127.0.0.1'
    default_port = '3306'
    default_name = 'bhafgne00w0zajbx61pd' if on_vercel else 'smartlib'

    user = os.getenv('DB_USER', default_user)
    password = os.getenv('DB_PASSWORD', default_password)
    host = os.getenv('DB_HOST', default_host)
    port = os.getenv('DB_PORT', default_port)
    name = os.getenv('DB_NAME', default_name)
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


class Config:
    on_vercel = os.getenv('VERCEL') == '1'
    DEFAULT_USER = 'uxdw3uznfcxi6lkc' if on_vercel else 'root'
    DEFAULT_PASSWORD = '3mBuqhLyX2QT5Pzp0rI2' if on_vercel else ''
    DEFAULT_HOST = 'bhafgne00w0zajbx61pd-mysql.services.clever-cloud.com' if on_vercel else '127.0.0.1'
    DEFAULT_PORT = '3306'
    DEFAULT_NAME = 'bhafgne00w0zajbx61pd' if on_vercel else 'smartlib'

    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    DB_USER = os.getenv('DB_USER', DEFAULT_USER)
    DB_PASSWORD = os.getenv('DB_PASSWORD', DEFAULT_PASSWORD)
    DB_HOST = os.getenv('DB_HOST', DEFAULT_HOST)
    DB_PORT = os.getenv('DB_PORT', DEFAULT_PORT)
    DB_NAME = os.getenv('DB_NAME', DEFAULT_NAME)

    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'

    _database_url = os.getenv('DATABASE_URL', '').strip()
    if _database_url and not on_vercel:
        SQLALCHEMY_DATABASE_URI = _database_url
    elif _database_url and on_vercel and 'clever-cloud.com' in _database_url:
        SQLALCHEMY_DATABASE_URI = _database_url
    else:
        SQLALCHEMY_DATABASE_URI = _build_mysql_uri()

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BCRYPT_LOG_ROUNDS = int(os.getenv('BCRYPT_LOG_ROUNDS', '12'))
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() in ('1', 'true', 'yes')
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'false').lower() in ('1', 'true', 'yes')
    AUTO_CREATE_DB = os.getenv(
        'AUTO_CREATE_DB',
        '1' if DEBUG else '0',
    ).lower() in ('1', 'true', 'yes')
