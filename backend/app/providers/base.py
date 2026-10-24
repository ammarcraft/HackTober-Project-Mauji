from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

class ProviderResponse(BaseModel):
    content: str
    reasoning_content: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None
    model: str
    tokens_used: Optional[int] = 0
    duration_ms: int = 0
    is_mock: bool = False

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        output_mode: str = "auto",
        json_schema: Optional[Dict[str, Any]] = None,
        row_mode: str = "single",
        row_count: int = 1,
        reasoning_effort: Optional[str] = "high",
        temperature: float = 0.7,
        max_tokens: int = 16384
    ) -> ProviderResponse:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass
