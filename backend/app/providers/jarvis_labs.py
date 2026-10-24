import time
import json
import re
import httpx
from typing import Dict, Any, Optional, List
from app.providers.base import BaseAIProvider, ProviderResponse
from app.config import settings

class JarvisLabsAdapter(BaseAIProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: int = 90,
        max_retries: int = 2
    ):
        self.api_key = api_key or settings.JARVIS_LABS_API_KEY
        self.base_url = (base_url or settings.JARVIS_LABS_BASE_URL).rstrip('/')
        self.default_model = default_model or settings.DEFAULT_MODEL
        self.timeout = timeout
        self.max_retries = max_retries

    async def test_connection(self) -> Dict[str, Any]:
        """Tests connectivity and authentication with the Jarvis Labs DeepSeek endpoint."""
        if not self.api_key:
            return {
                "success": False,
                "message": "Jarvis Labs API Key is not configured. Please enter your API key in Settings.",
                "latency_ms": 0,
                "models_available": []
            }

        start = time.time()
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # 1. First attempt /models endpoint
                models_url = f"{self.base_url}/models"
                try:
                    resp = await client.get(models_url, headers=headers)
                    latency = int((time.time() - start) * 1000)
                    if resp.status_code == 200:
                        data = resp.json()
                        model_list = [m["id"] for m in data.get("data", [])] if "data" in data else []
                        return {
                            "success": True,
                            "message": f"Successfully connected to Jarvis Labs ({self.default_model}) ({latency}ms).",
                            "latency_ms": latency,
                            "models_available": model_list or [self.default_model]
                        }
                    elif resp.status_code in (401, 403):
                        return {
                            "success": False,
                            "message": f"Authentication failed (HTTP {resp.status_code}). Please verify your Jarvis Labs API key.",
                            "latency_ms": latency,
                            "models_available": []
                        }
                except Exception:
                    pass

                # 2. Direct ping test with minimal prompt to /chat/completions
                chat_url = f"{self.base_url}/chat/completions"
                test_payload = {
                    "model": self.default_model,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 10
                }
                chat_resp = await client.post(chat_url, headers=headers, json=test_payload)
                latency = int((time.time() - start) * 1000)
                if chat_resp.status_code == 200:
                    return {
                        "success": True,
                        "message": f"Successfully connected to Jarvis Labs DeepSeek V4 Flash endpoint ({latency}ms).",
                        "latency_ms": latency,
                        "models_available": [self.default_model]
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Endpoint returned HTTP {chat_resp.status_code}: {chat_resp.text[:200]}",
                        "latency_ms": latency,
                        "models_available": []
                    }
            except Exception as e:
                latency = int((time.time() - start) * 1000)
                return {
                    "success": False,
                    "message": f"Network error connecting to Jarvis Labs ({self.base_url}): {str(e)}",
                    "latency_ms": latency,
                    "models_available": []
                }

    @staticmethod
    def _extract_reasoning_and_content(raw_content: str, message_dict: Dict[str, Any]) -> tuple[str, Optional[str]]:
        """
        DeepSeek models often produce reasoning inside <think>...</think> tags
        or in message_dict['reasoning_content'].
        Separates reasoning from the actual deliverable content so schema validation succeeds.
        """
        reasoning = message_dict.get("reasoning_content")

        think_match = re.search(r'<think>([\s\S]*?)</think>', raw_content, re.IGNORECASE)
        if think_match:
            embedded_reasoning = think_match.group(1).strip()
            if not reasoning:
                reasoning = embedded_reasoning
            # Strip <think>...</think> from main content
            clean_content = re.sub(r'<think>[\s\S]*?</think>', '', raw_content, flags=re.IGNORECASE).strip()
            return clean_content, reasoning

        return raw_content, reasoning

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
        """Executes a completion request against Jarvis Labs DeepSeek V4 endpoint."""
        chosen_model = model or self.default_model
        start_time = time.time()

        messages = []
        if system_prompt and system_prompt.strip():
            messages.append({"role": "system", "content": system_prompt.strip()})

        # Augment prompt transparently if structured JSON or multiple rows are requested
        user_content = prompt
        if output_mode == "structured_json" and json_schema:
            schema_str = json.dumps(json_schema, indent=2)
            if row_mode == "multiple" and row_count > 1:
                user_content += (
                    f"\n\nIMPORTANT: Return a JSON object containing a 'rows' array with exactly {row_count} records. "
                    f"Each record MUST strictly conform to this JSON schema:\n{schema_str}\n"
                    f"Respond ONLY with valid JSON."
                )
            else:
                user_content += (
                    f"\n\nIMPORTANT: Return valid JSON that strictly conforms to this JSON schema:\n{schema_str}\n"
                    f"Respond ONLY with valid JSON."
                )
        elif row_mode == "multiple" and row_count > 1:
            user_content += (
                f"\n\nIMPORTANT: Return exactly {row_count} distinct items/records in a JSON object with a 'rows' list."
            )

        messages.append({"role": "user", "content": user_content})

        payload: Dict[str, Any] = {
            "model": chosen_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 16384
        }

        # If model supports reasoning efforts
        if reasoning_effort and reasoning_effort != "off":
            payload["reasoning_effort"] = reasoning_effort

        if output_mode == "structured_json":
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        chat_url = f"{self.base_url}/chat/completions"
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(chat_url, headers=headers, json=payload)
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if not choices:
                            raise Exception("Jarvis Labs returned an empty choices list.")
                        
                        message = choices[0].get("message", {})
                        raw_content = message.get("content", "")
                        clean_content, reasoning = self._extract_reasoning_and_content(raw_content, message)

                        usage = data.get("usage", {})
                        tokens_used = usage.get("total_tokens", 0)
                        elapsed_ms = int((time.time() - start_time) * 1000)

                        return ProviderResponse(
                            content=clean_content,
                            reasoning_content=reasoning,
                            raw_response=data,
                            model=chosen_model,
                            tokens_used=tokens_used,
                            duration_ms=elapsed_ms,
                            is_mock=False
                        )
                    elif resp.status_code == 429:
                        last_error = f"Rate limited (HTTP 429): {resp.text}"
                        time.sleep(1.5 * (attempt + 1))
                        continue
                    else:
                        raise Exception(f"Jarvis Labs API returned HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                last_error = str(e)
                if attempt < self.max_retries:
                    time.sleep(1.0 * (attempt + 1))
                    continue

        raise Exception(f"Jarvis Labs generation failed after {self.max_retries + 1} attempts. Last error: {last_error}")
