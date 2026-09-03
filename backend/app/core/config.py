# app/core/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env from project root
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
OPENAI_API_KEY = GROQ_API_KEY
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.groq.com/openai/v1")
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", str(BASE_DIR / "storage" / "vector_db"))

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ppzdnxmglhwnbcilvueq.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_emFs80qw6NitAinWCu3Ceg_cLkzLZTQ")

# FastAPI settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
