import os
import sys
import tempfile

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, os.path.abspath(backend_dir))

# Configure for Vercel serverless: SQLite in /tmp, demo mode, open CORS
os.environ.setdefault('SHADOWNET_DATABASE_URL',
    f'sqlite+aiosqlite:///{tempfile.gettempdir()}/shadownet.db')
os.environ.setdefault('SHADOWNET_DEMO_MODE', 'true')
os.environ.setdefault('SHADOWNET_CORS_ORIGINS', '*')
os.environ.setdefault('SHADOWNET_LOG_LEVEL', 'WARNING')

from app.main import app
