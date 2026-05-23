from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# Initialize extensions here to avoid circular imports
db = SQLAlchemy()
bcrypt = Bcrypt()
