from fastapi import APIRouter
from app.schemas import ProviderSettings, ProviderTestResponse
from app.providers.jarvis_labs import JarvisLabsAdapter
from app.providers.mock_provider import IntelligentMockProvider
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=ProviderSettings)
async def get_settings():
    # Mask API key if set for security
    masked_key = ""
    if settings.JARVIS_LABS_API_KEY:
        masked_key = settings.JARVIS_LABS_API_KEY[:4] + "..." + settings.JARVIS_LABS_API_KEY[-4:] if len(settings.JARVIS_LABS_API_KEY) > 8 else "********"
    
    return ProviderSettings(
        api_key=masked_key,
        base_url=settings.JARVIS_LABS_BASE_URL,
        model=settings.DEFAULT_MODEL,
        is_mock=settings.MOCK_AI_PROVIDER or not bool(settings.JARVIS_LABS_API_KEY)
    )

@router.post("", response_model=ProviderSettings)
async def update_settings(payload: ProviderSettings):
    if payload.api_key is not None and not payload.api_key.startswith("..."):
        settings.JARVIS_LABS_API_KEY = payload.api_key
    if payload.base_url:
        settings.JARVIS_LABS_BASE_URL = payload.base_url
    if payload.model:
        settings.DEFAULT_MODEL = payload.model
    settings.MOCK_AI_PROVIDER = payload.is_mock

    # Persist to .env file for continuity across restarts
    try:
        env_lines = [
            f"JARVIS_LABS_API_KEY={settings.JARVIS_LABS_API_KEY}\n",
            f"JARVIS_LABS_BASE_URL={settings.JARVIS_LABS_BASE_URL}\n",
            f"DEFAULT_MODEL={settings.DEFAULT_MODEL}\n",
            f"MOCK_AI_PROVIDER={'true' if settings.MOCK_AI_PROVIDER else 'false'}\n"
        ]
        with open(".env", "w", encoding="utf-8") as f:
            f.writelines(env_lines)
    except Exception:
        pass

    masked_key = ""
    if settings.JARVIS_LABS_API_KEY:
        masked_key = settings.JARVIS_LABS_API_KEY[:4] + "..." + settings.JARVIS_LABS_API_KEY[-4:] if len(settings.JARVIS_LABS_API_KEY) > 8 else "********"

    return ProviderSettings(
        api_key=masked_key,
        base_url=settings.JARVIS_LABS_BASE_URL,
        model=settings.DEFAULT_MODEL,
        is_mock=settings.MOCK_AI_PROVIDER or not bool(settings.JARVIS_LABS_API_KEY)
    )

@router.post("/test-connection", response_model=ProviderTestResponse)
async def test_provider_connection(payload: ProviderSettings):
    api_key = payload.api_key or settings.JARVIS_LABS_API_KEY
    base_url = payload.base_url or settings.JARVIS_LABS_BASE_URL
    model = payload.model or settings.DEFAULT_MODEL
    is_mock = payload.is_mock

    if is_mock or not api_key:
        provider = IntelligentMockProvider()
    else:
        provider = JarvisLabsAdapter(api_key=api_key, base_url=base_url, default_model=model)

    res = await provider.test_connection()
    return ProviderTestResponse(
        success=res.get("success", False),
        message=res.get("message", ""),
        latency_ms=res.get("latency_ms", 0),
        models_available=res.get("models_available", [])
    )
