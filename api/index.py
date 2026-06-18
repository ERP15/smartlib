import sys
from pathlib import Path

# Add the project root directory to the python path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.app import app

# Expose WSGI objects for Vercel
application = app
handler = app
