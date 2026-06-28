import json
import httpx
import logging
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an experienced Emergency Operations Center Intelligence Officer. Your role is to analyze incident reports and produce professional intelligence briefings for command staff.

Cross-reference ALL available information: title, description, categories, location, and any provided time/location context. Never rely on just one field. Use the combination of evidence to determine the incident type.

=== INPUT ===
Title: {title}
Description: {description}
Location: {location}
Categories: {categories}
Reported: {timestamp}

=== ANALYSIS APPROACH ===
1. Read the complete report holistically
2. Determine incident type from title + description + categories combined — do NOT echo the category alone
3. Identify confirmed facts (directly stated in the report)
4. Make professional inferences (reasonable conclusions from evidence)
5. Estimate operational risks with confidence percentages
6. Estimate required resources based on incident type and severity
7. Forecast escalation timeline
8. Generate prioritized operational recommendations
9. Build reasoning tree showing your analytical chain

=== OUTPUT ===
Respond with ONLY valid JSON. No markdown.

{{
  "incident_type": "Specific, detailed incident classification derived from ALL input fields combined. Examples: 'Wildfire', 'Mass Casualty Road Traffic Incident', 'Electrical Infrastructure Failure', 'Structural Collapse with Fire'. Never simply echo the category.",
  "priority": "Immediate | High | Medium | Low",
  "estimated_severity": "P1 | P2 | P3 | P4",
  "confidence": 0-100,
  "source": "Incident Report",
  "executive_summary": "A thorough 4-6 sentence operational summary written by an experienced emergency officer. Must describe the situation, key risks, and recommended posture. Never leave this empty or generic.",
  "confirmed_facts": ["Only facts explicitly stated in the report. Each must be directly supported by the report text."],
  "professional_assessment": ["Professional operational assessments showing reasoned interpretation of the situation based on available evidence."],
  "hazard_analysis": [
    {{"hazard": "Specific hazard name", "status": "High | Medium | Low", "reason": "Why this hazard exists at this level"}}
  ],
  "risk_analysis": [
    {{"risk": "Risk description", "percentage": number 0-100, "reason": "Why this risk is estimated at this level based on operational knowledge"}}
  ],
  "operational_recommendations": [
    {{"priority": number 1-10, "action": "Specific operational action", "reason": "Why this action is necessary and what it achieves"}}
  ],
  "resource_estimation": [
    {{"resource": "Resource type", "estimated": number, "reason": "Professional estimate based on incident characteristics"}}
  ],
  "escalation_forecast": {{
    "next_15_minutes": ["Short-term risks and developments"],
    "next_hour": ["Medium-term developments"],
    "next_6_hours": ["Longer-term escalation possibilities"]
  }},
  "reasoning_tree": [
    {{"detected": "What was observed (from title, description, or categories)", "inference": "What the AI concludes", "reason": "Why this conclusion was reached"}}
  ]
}}

RULES:
1. Incident type MUST be specific and context-aware. For title 'Wild Fire' + category 'Fire', output 'Wildfire', NOT 'Unknown Incident'. For title 'Transformer Blast' + category 'Infrastructure,Fire', output 'Electrical Infrastructure Failure'.
2. Executive summary must be a meaningful operational briefing, never 'No summary available' or generic text.
3. Risk analysis must include estimated percentages with professional reasoning. Percentages should vary based on the specific incident.
4. Resource estimates must NEVER be zero. Every incident requires at least a minimum response.
5. Confirmed facts must be directly from the report. Do not fabricate.
6. For escalation forecast, provide specific predictions, not generic statements.
7. If you cannot determine something with high confidence, still provide your best professional estimate with a lower confidence score rather than returning 'Unknown'.
8. The reasoning tree must show complete analytical chains from detection to conclusion."""


class OllamaService:
    def __init__(self):
        self.endpoint = settings.ollama_endpoint
        self.model = settings.ollama_model
        self.client = httpx.AsyncClient(timeout=120.0)

    async def analyze(self, title: str, description: str, location: str, category: str, latitude: float | None = None, longitude: float | None = None) -> dict:
        prompt = SYSTEM_PROMPT.format(
            title=title,
            description=description,
            location=location,
            categories=category,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        try:
            response = await self.client.post(
                f"{self.endpoint}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.1,
                    "max_tokens": 2500,
                },
            )
            response.raise_for_status()
            result = response.json()
            raw_text = result.get("response", "")
            parsed = self._parse_response(raw_text)
            if parsed and self._is_valid(parsed):
                return self._validate(parsed, title, description, location)
            logger.warning("Ollama returned incomplete response, using structured fallback")
            return self._fallback(title, description, location)
        except httpx.ConnectError:
            logger.warning("Ollama not available, using structured fallback")
            return self._fallback(title, description, location)
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return self._fallback(title, description, location)

    def _is_valid(self, parsed: dict) -> bool:
        required = ["executive_summary", "confirmed_facts", "professional_assessment"]
        return all(parsed.get(k) for k in required)

    def _parse_response(self, text: str) -> dict | None:
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            return json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            logger.warning(f"Failed to parse Ollama response: {text[:200]}")
            return None

    def _validate(self, parsed: dict, title: str, description: str, location: str) -> dict:
        haz = parsed.get("hazard_analysis") or []
        risk = parsed.get("risk_analysis") or []
        recs = parsed.get("operational_recommendations") or []
        res = parsed.get("resource_estimation") or []
        tree = parsed.get("reasoning_tree") or []

        return {
            "incident_type": parsed.get("incident_type") or self._infer_type(title, description),
            "priority": parsed.get("priority") or "Medium",
            "estimated_severity": parsed.get("estimated_severity") or "P3",
            "confidence": max(0, min(100, parsed.get("confidence", 50))),
            "source": parsed.get("source") or "Incident Report",
            "executive_summary": parsed.get("executive_summary") or self._default_summary(title, location),
            "confirmed_facts": self._ensure_str_list(parsed.get("confirmed_facts")) or [f"Incident reported: {title}"],
            "professional_assessment": self._ensure_str_list(parsed.get("professional_assessment")) or ["Professional assessment in progress"],
            "hazard_analysis": [self._clean_hazard(h) for h in haz if isinstance(h, dict)],
            "risk_analysis": [self._clean_risk(r) for r in risk if isinstance(r, dict)],
            "operational_recommendations": [self._clean_rec(r) for r in recs if isinstance(r, dict)],
            "resource_estimation": self._clean_resources(res),
            "escalation_forecast": {
                "next_15_minutes": self._ensure_str_list(parsed.get("escalation_forecast", {}).get("next_15_minutes")) or ["Initial assessment phase"],
                "next_hour": self._ensure_str_list(parsed.get("escalation_forecast", {}).get("next_hour")) or ["Operational planning phase"],
                "next_6_hours": self._ensure_str_list(parsed.get("escalation_forecast", {}).get("next_6_hours")) or ["Full response execution"],
            },
            "reasoning_tree": [self._clean_tree_node(n) for n in tree if isinstance(n, dict)],
        }

    def _infer_type(self, title: str, description: str) -> str:
        combined = (title + " " + description).lower()
        if "fire" in combined or "wildfire" in combined or "burn" in combined:
            return "Fire Incident"
        if "flood" in combined or "water" in combined or "drown" in combined:
            return "Flood Incident"
        if "earthquake" in combined or "tremor" in combined or "shake" in combined:
            return "Earthquake Incident"
        if "accident" in combined or "crash" in combined or "collision" in combined:
            return "Accident Incident"
        if "medical" in combined or "injured" in combined or "patient" in combined or "heart" in combined:
            return "Medical Emergency"
        if "infrastructure" in combined or "power" in combined or "electric" in combined or "gas" in combined or "pipe" in combined:
            return "Infrastructure Failure"
        if "hazard" in combined or "spill" in combined or "chemical" in combined or "gas leak" in combined:
            return "Hazardous Material Incident"
        return f"Emergency: {title[:60]}"

    def _ensure_str_list(self, value) -> list[str]:
        if isinstance(value, list):
            return [str(v) for v in value if v]
        if isinstance(value, str):
            return [value]
        return []

    def _clean_hazard(self, h: dict) -> dict:
        return {
            "hazard": h.get("hazard") or "Unspecified hazard",
            "status": h.get("status") or "Medium",
            "reason": h.get("reason") or "Identified in incident context",
        }

    def _clean_risk(self, r: dict) -> dict:
        pct = r.get("percentage")
        return {
            "risk": r.get("risk") or "General risk",
            "percentage": max(0, min(100, int(pct))) if pct is not None else 50,
            "reason": r.get("reason") or "Estimated based on incident characteristics",
        }

    def _clean_rec(self, r: dict) -> dict:
        return {
            "priority": max(1, min(10, r.get("priority", 1))),
            "action": r.get("action") or "Assess situation",
            "reason": r.get("reason") or "Standard operational procedure",
        }

    def _clean_resources(self, res: list) -> list[dict]:
        if not res:
            return [{"resource": "Response Team", "estimated": 4, "reason": "Minimum response team for any incident"}]
        cleaned = []
        for r in res:
            if isinstance(r, dict):
                est = r.get("estimated")
                cleaned.append({
                    "resource": r.get("resource") or "Responders",
                    "estimated": max(1, int(est)) if est is not None else 2,
                    "reason": r.get("reason") or "Operational requirement",
                })
        return cleaned if cleaned else [{"resource": "Response Team", "estimated": 4, "reason": "Minimum response team for any incident"}]

    def _clean_tree_node(self, n: dict) -> dict:
        return {
            "detected": n.get("detected") or "Incident reported",
            "inference": n.get("inference") or "Assessment required",
            "reason": n.get("reason") or "Standard analytical process",
        }

    def _default_summary(self, title: str, location: str) -> str:
        return (
            f"An incident has been reported at {location} concerning: {title}. "
            f"Initial assessment indicates an emergency situation requiring coordinated response. "
            f"The reported details suggest immediate operational planning is necessary. "
            f"Response teams should be placed on standby. "
            f"A full situation assessment is being compiled. "
            f"Recommended posture: proceed with standard emergency response protocols."
        )

    def _fallback(self, title: str, description: str, location: str) -> dict:
        inferred_type = self._infer_type(title, description)
        return {
            "incident_type": inferred_type,
            "priority": "Medium",
            "estimated_severity": "P3",
            "confidence": 30,
            "source": "Incident Report",
            "executive_summary": (
                f"An incident has been reported at {location} concerning: {title}. "
                f"Based on initial information, this appears to be a {inferred_type.lower()} situation. "
                f"The AI intelligence system is currently operating in offline mode. "
                f"A duty officer should be assigned to manually assess this incident. "
                f"Recommended posture: proceed with standard assessment workflow."
            ),
            "confirmed_facts": [
                f"Incident reported with title: {title}",
                f"Location: {location}",
            ],
            "professional_assessment": [
                f"This incident appears to be a {inferred_type.lower()} based on the provided information.",
                "AI intelligence service is temporarily unavailable. Manual assessment is required.",
            ],
            "hazard_analysis": [
                {
                    "hazard": "Pending assessment",
                    "status": "Medium",
                    "reason": "AI intelligence service unavailable. Manual hazard assessment required.",
                }
            ],
            "risk_analysis": [
                {"risk": "General operational risk", "percentage": 50, "reason": "Standard risk level pending detailed assessment"},
                {"risk": "Response complexity", "percentage": 40, "reason": "Based on available incident information"},
            ],
            "operational_recommendations": [
                {
                    "priority": 1,
                    "action": "Assign duty officer for manual assessment",
                    "reason": "AI intelligence system is offline. Human expert evaluation required.",
                },
                {
                    "priority": 2,
                    "action": "Contact reporting party for additional information",
                    "reason": "Current data may be insufficient for complete operational planning.",
                },
            ],
            "resource_estimation": [
                {"resource": "Duty Officer", "estimated": 1, "reason": "Minimum staffing for assessment"},
                {"resource": "Response Team", "estimated": 4, "reason": "Standard initial response team size"},
            ],
            "escalation_forecast": {
                "next_15_minutes": ["Duty officer assignment and initial assessment underway"],
                "next_hour": ["Manual assessment complete, resource planning can begin"],
                "next_6_hours": ["Full operational response plan ready for execution"],
            },
            "reasoning_tree": [
                {
                    "detected": f"Incident title: {title}",
                    "inference": inferred_type,
                    "reason": f"Title and location indicate a {inferred_type.lower()} scenario requiring emergency response.",
                },
                {
                    "detected": "AI analysis service unavailable",
                    "inference": "Manual assessment workflow required",
                    "reason": "Standard operating procedure dictates human-led assessment when automated systems are offline.",
                },
            ],
        }

    async def close(self):
        await self.client.aclose()
