import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env if present
load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "Mini n8n - Custom AI Workflow Canvas"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite+aiosqlite:///./workflows.db"
    
    # JARVIS Labs / AI Provider Settings
    JARVIS_LABS_API_KEY: str = os.getenv("JARVISLABS_API_KEY") or os.getenv("JARVIS_LABS_API_KEY", "")
    JARVIS_LABS_BASE_URL: str = os.getenv("JARVIS_LABS_BASE_URL", "https://models.jarvislabs.net/v1")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "deepseek-v4-flash-0731")
    MOCK_AI_PROVIDER: bool = os.getenv("MOCK_AI_PROVIDER", "false").lower() in ("true", "1", "t")
    
    # Execution timeouts and limits
    DEFAULT_TIMEOUT_SECS: int = 90
    DEFAULT_MAX_RETRIES: int = 2
    DEFAULT_MAX_TOKENS: int = 16384
    MAX_ROWS_PER_NODE: int = 100

settings = Settings()
