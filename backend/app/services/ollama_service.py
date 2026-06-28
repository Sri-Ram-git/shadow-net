import json
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

OLLAMA_PROMPT = """You are an emergency triage AI. Analyze the incident and respond with ONLY valid JSON.

Incident: {title}
Description: {description}
Location: {location}
Category: {category}

Respond with this exact JSON structure (no other text):
{{
  "severity": "P1|P2|P3|P4",
  "department": "string",
  "injured": 0,
  "critical": 0,
  "location": "string",
  "summary": "string"
}}

Severity guidelines:
- P1: Life-threatening, immediate danger
- P2: Serious but not life-threatening
- P3: Moderate, requires attention
- P4: Minor, non-urgent

Department options: Fire, Medical, Police, Rescue, Infrastructure, Hazard, General
"""


class OllamaService:
    def __init__(self):
        self.endpoint = settings.ollama_endpoint
        self.model = settings.ollama_model
        self.client = httpx.AsyncClient(timeout=120.0)

    async def analyze(self, title: str, description: str, location: str, category: str) -> dict:
        prompt = OLLAMA_PROMPT.format(
            title=title,
            description=description,
            location=location,
            category=category,
        )

        try:
            response = await self.client.post(
                f"{self.endpoint}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.1,
                    "max_tokens": 512,
                },
            )
            response.raise_for_status()
            result = response.json()
            raw_text = result.get("response", "")

            parsed = self._parse_response(raw_text)
            return parsed

        except httpx.ConnectError:
            logger.warning("Ollama not available, using fallback triage")
            return self._fallback_triage(title, description, location, category)
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return self._fallback_triage(title, description, location, category)

    def _parse_response(self, text: str) -> dict:
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            json_str = text[start:end]
            return json.loads(json_str)
        except (ValueError, json.JSONDecodeError):
            return {}

    def _fallback_triage(self, title: str, description: str, location: str, category: str) -> dict:
        text = f"{title} {description}".lower()

        if any(w in text for w in ["fire", "explosion", "blast", "burn"]):
            severity, department = "P1", "Fire"
        elif any(w in text for w in ["heart", "bleeding", "unconscious", "critical", "severe"]):
            severity, department = "P1", "Medical"
        elif any(w in text for w in ["flood", "earthquake", "collapse"]):
            severity, department = "P1", "Rescue"
        elif any(w in text for w in ["accident", "crash", "injury"]):
            severity, department = "P2", "Medical"
        elif any(w in text for w in ["leak", "gas", "spill", "hazard"]):
            severity, department = "P2", "Hazard"
        else:
            severity, department = "P3", "General"

        return {
            "severity": severity,
            "department": department,
            "injured": 1 if severity in ("P1", "P2") else 0,
            "critical": 1 if severity == "P1" else 0,
            "location": location,
            "summary": f"{department} response required for: {title[:100]}",
        }

    async def close(self):
        await self.client.aclose()
