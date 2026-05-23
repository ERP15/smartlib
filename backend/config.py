import os
from dotenv import load_dotenv
from pathlib import Path

basedir = Path(__file__).resolve().parent
project_root = basedir.parent

# Load env: backend/.env first, then project root .env (root overrides)
load_dotenv(basedir / '.env')
load_dotenv(project_root / '.env')


def _build_mysql_uri():
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', '')
    host = os.getenv('DB_HOST', '127.0.0.1')
    port = os.getenv('DB_PORT', '3306')
    name = os.getenv('DB_NAME', 'smartlib')
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'smartlib')

    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'

    _database_url = os.getenv('DATABASE_URL', '').strip()
    if _database_url:
        SQLALCHEMY_DATABASE_URI = _database_url
    else:
        SQLALCHEMY_DATABASE_URI = _build_mysql_uri()

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BCRYPT_LOG_ROUNDS = int(os.getenv('BCRYPT_LOG_ROUNDS', '12'))
    AUTO_CREATE_DB = os.getenv(
        'AUTO_CREATE_DB',
        '1' if DEBUG else '0',
    ).lower() in ('1', 'true', 'yes')
