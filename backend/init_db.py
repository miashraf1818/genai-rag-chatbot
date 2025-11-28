import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import init_db

if __name__ == "__main__":
    print("🔧 Initializing database...")
    init_db()
    print("✅ Done! Database is ready.")
