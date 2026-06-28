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


DEMO_RESPONSES = [
    {
        "incident_type": "Wildfire",
        "priority": "Immediate",
        "estimated_severity": "P1",
        "confidence": 88,
        "source": "AI Intelligence Report (Demo)",
        "executive_summary": "A rapidly spreading wildfire has been reported in the vicinity of the incident location. Current weather conditions including wind speed and low humidity are expected to accelerate fire spread. The fire front poses immediate threat to adjacent structures and natural habitats. Initial assessment indicates a complex fire behavior pattern requiring coordinated aerial and ground response. Evacuation protocols should be initiated for areas downwind of the fire perimeter. Recommended posture: Full emergency response with multi-agency coordination.",
        "confirmed_facts": [
            "Wildfire reported at incident location",
            "Fire shows active spread behavior",
            "Weather conditions favor continued fire growth",
            "Structures potentially threatened in fire path",
        ],
        "professional_assessment": [
            "The wildfire is demonstrating characteristics of a fast-moving surface fire with potential for crown fire development under current conditions.",
            "Dry fuel loads and predicted wind patterns suggest the fire may grow significantly within the next 2-3 hours without aggressive initial attack.",
            "Critical infrastructure including power lines and communication towers in the fire path require protective measures.",
        ],
        "hazard_analysis": [
            {"hazard": "Active Fire Front", "status": "High", "reason": "Fire is actively spreading with potential for rapid growth"},
            {"hazard": "Smoke Inhalation", "status": "High", "reason": "Smoke plume affecting downwind populated areas"},
            {"hazard": "Structural Ignition", "status": "Medium", "reason": "Structures within potential fire reach but may be defensible"},
            {"hazard": "Access Road Blockage", "status": "Medium", "reason": "Primary access routes may become compromised"},
        ],
        "risk_analysis": [
            {"risk": "Fire Escalation", "percentage": 82, "reason": "Dry conditions and wind create high escalation potential"},
            {"risk": "Life Safety", "percentage": 75, "reason": "Populated areas downwind face direct threat"},
            {"risk": "Property Loss", "percentage": 68, "reason": "Multiple structures in potential fire path"},
            {"risk": "Environmental Damage", "percentage": 55, "reason": "Fire in ecologically sensitive area"},
        ],
        "operational_recommendations": [
            {"priority": 1, "action": "Initiate immediate evacuation of threatened areas", "reason": "Fire progression rate exceeds safe evacuation timeline without early action"},
            {"priority": 2, "action": "Deploy aerial firefighting assets for initial attack", "reason": "Aerial suppression most effective in early stages before fire establishes"},
            {"priority": 3, "action": "Establish unified command with local fire agencies", "reason": "Multi-agency coordination essential for resource management and strategy alignment"},
            {"priority": 4, "action": "Set up fire observation posts for real-time tracking", "reason": "Continuous monitoring needed to adapt tactics as fire behavior evolves"},
            {"priority": 5, "action": "Pre-position medical resources for potential casualties", "reason": "Smoke inhalation and burn injuries require immediate medical capacity"},
        ],
        "resource_estimation": [
            {"resource": "Fire Crews", "estimated": 40, "reason": "Multiple strike teams needed for fire perimeter containment"},
            {"resource": "Aircraft", "estimated": 4, "reason": "Air tankers and helicopters for aerial suppression"},
            {"resource": "Ambulances", "estimated": 6, "reason": "Medical support for evacuation and firefighter safety"},
            {"resource": "Police Units", "estimated": 15, "reason": "Traffic control and evacuation area security"},
            {"resource": "Water Tenders", "estimated": 8, "reason": "Water supply for areas without hydrant access"},
        ],
        "escalation_forecast": {
            "next_15_minutes": ["Fire perimeter expanding under current wind conditions", "Initial attack resources arriving on scene", "Evacuation orders being issued for immediate threat zone"],
            "next_hour": ["Potential for structures to be threatened if wind shifts", "Mutual aid resources requested from neighboring jurisdictions", "Possible road closures in affected areas"],
            "next_6_hours": ["Fire may reach full containment perimeter if initial attack successful", "Structure protection priorities established based on threat assessment", "Long-term suppression strategy being developed by incident command"],
        },
        "reasoning_tree": [
            {"detected": "Incident title contains wildfire reference", "inference": "Active wildfire incident", "reason": "Title directly indicates wildfire scenario requiring immediate response"},
            {"detected": "Fire category selected in incident report", "inference": "Confirmed fire incident type", "reason": "Category selection corroborates title classification"},
            {"detected": "Active spread mentioned in description", "inference": "Fire is currently propagating", "reason": "Active fire behavior requires urgent intervention to prevent escalation"},
            {"detected": "No containment resources mentioned", "inference": "Fire is uncontrolled at time of reporting", "reason": "Uncontrolled fire necessitates immediate resource deployment"},
        ],
    },
    {
        "incident_type": "Mass Casualty Traffic Incident",
        "priority": "Immediate",
        "estimated_severity": "P1",
        "confidence": 85,
        "source": "AI Intelligence Report (Demo)",
        "executive_summary": "A serious multi-vehicle collision has occurred resulting in multiple casualties and significant traffic disruption. Initial reports indicate at least three vehicles involved with unknown number of trapped occupants. The incident has blocked a major arterial route, complicating emergency vehicle access. Medical triage and extrication operations are the immediate priorities. High likelihood of serious injuries requiring trauma center capacity activation. Recommended posture: Full emergency medical response with mass casualty incident protocols.",
        "confirmed_facts": [
            "Multi-vehicle collision reported",
            "Multiple casualties confirmed at scene",
            "Vehicles blocking traffic lanes",
            "Emergency services dispatched and en route",
        ],
        "professional_assessment": [
            "MCI protocols should be activated given the multiple casualty count and vehicle entrapment potential.",
            "Extrication operations will require heavy rescue equipment and coordination between fire and medical services.",
            "Traffic diversion and corridor management essential for emergency vehicle access and hospital transport routes.",
        ],
        "hazard_analysis": [
            {"hazard": "Vehicle Instability", "status": "High", "reason": "Damaged vehicles may shift during extrication operations"},
            {"hazard": "Fuel Spill", "status": "Medium", "reason": "Vehicle fuel tanks may be compromised in collision"},
            {"hazard": "Traffic Hazards", "status": "High", "reason": "Secondary collisions risk due to obstructed roadway"},
            {"hazard": "Fire Risk", "status": "Medium", "reason": "Electrical damage and fuel create ignition potential"},
        ],
        "risk_analysis": [
            {"risk": "Life Safety", "percentage": 85, "reason": "Multiple casualties with potentially severe injuries"},
            {"risk": "Traffic Disruption", "percentage": 90, "reason": "Major route blocked, causing widespread traffic impact"},
            {"risk": "Resource Strain", "percentage": 70, "reason": "MCI may strain local emergency medical resources"},
            {"risk": "Secondary Incidents", "percentage": 60, "reason": "Congestion and diversion routes increase accident risk"},
        ],
        "operational_recommendations": [
            {"priority": 1, "action": "Establish MCI command and initiate triage operations", "reason": "Standard MCI protocol requires immediate command structure and patient prioritization"},
            {"priority": 2, "action": "Request additional ambulances and trauma center activation", "reason": "Multiple serious casualties may exceed local EMS capacity"},
            {"priority": 3, "action": "Deploy heavy rescue for vehicle extrication", "reason": "Trapped casualties require specialized equipment and training for safe extraction"},
            {"priority": 4, "action": "Implement traffic diversion and establish EMS corridor", "reason": "Emergency vehicle access and patient transport routes must be maintained"},
            {"priority": 5, "action": "Activate hospital emergency preparedness plans", "reason": "Receiving hospitals need preparation for multiple trauma patients"},
        ],
        "resource_estimation": [
            {"resource": "Ambulances", "estimated": 8, "reason": "Multiple patient transport requirement for MCI"},
            {"resource": "Fire Rescue Units", "estimated": 4, "reason": "Extrication and scene safety operations"},
            {"resource": "Traffic Control", "estimated": 10, "reason": "Diversion and corridor management personnel"},
            {"resource": "Medical Teams", "estimated": 6, "reason": "Triage and treatment teams for casualty management"},
        ],
        "escalation_forecast": {
            "next_15_minutes": ["First responders arriving on scene and establishing command", "Initial triage being conducted to determine casualty numbers", "Traffic management units deploying for diversion setup"],
            "next_hour": ["Extrication operations underway for trapped occupants", "Patient transport to hospitals beginning", "Traffic impact extending to surrounding road network"],
            "next_6_hours": ["Scene investigation and vehicle removal operations", "Roadway clearance and restoration of traffic flow", "Hospital resource assessment and patient status updates"],
        },
        "reasoning_tree": [
            {"detected": "Multiple vehicles involved in collision", "inference": "Mass casualty incident likely", "reason": "Number of vehicles suggests potential for multiple casualties requiring MCI response"},
            {"detected": "Road blockage reported", "inference": "Significant traffic disruption", "reason": "Major route obstruction creates access challenges for emergency vehicles"},
            {"detected": "Medical category in incident report", "inference": "Medical response primary requirement", "reason": "Category confirms medical emergency as primary incident type"},
        ],
    },
    {
        "incident_type": "Infrastructure Failure",
        "priority": "High",
        "estimated_severity": "P2",
        "confidence": 80,
        "source": "AI Intelligence Report (Demo)",
        "executive_summary": "A critical infrastructure failure has been reported affecting essential utility services. The incident involves damage to electrical distribution infrastructure with potential for cascading impacts on dependent systems. Initial assessment indicates a localized failure with risk of wider disruption if not contained. Public safety is not immediately threatened but essential services including healthcare facilities may be affected. Recommended posture: Coordinated infrastructure response with utility company engagement.",
        "confirmed_facts": [
            "Infrastructure failure affecting utility services",
            "Electrical distribution system compromised",
            "Localized impact area confirmed",
            "Utility response teams notified and responding",
        ],
        "professional_assessment": [
            "The infrastructure failure appears to be electrical in nature based on reported characteristics, potentially involving transformer or distribution line damage.",
            "Cascading failure risk requires immediate isolation of affected circuits to prevent wider grid disruption.",
            "Critical facilities with backup power should be verified to ensure uninterrupted operation.",
        ],
        "hazard_analysis": [
            {"hazard": "Electrical Hazard", "status": "High", "reason": "Downed or damaged electrical equipment poses electrocution risk"},
            {"hazard": "Fire Risk", "status": "Medium", "reason": "Electrical faults may ignite surrounding materials"},
            {"hazard": "Service Disruption", "status": "High", "reason": "Essential services may lose power affecting public safety"},
        ],
        "risk_analysis": [
            {"risk": "Extended Outage", "percentage": 65, "reason": "Repair complexity may extend restoration timeline"},
            {"risk": "Critical Facility Impact", "percentage": 55, "reason": "Hospitals and emergency services may be affected"},
            {"risk": "Cascading Failure", "percentage": 45, "reason": "Potential for wider grid impact if not isolated"},
            {"risk": "Public Safety", "percentage": 40, "reason": "Traffic signals and street lighting affected at night"},
        ],
        "operational_recommendations": [
            {"priority": 1, "action": "Isolate affected electrical circuits to prevent cascading failure", "reason": "Grid protection requires immediate isolation of damaged infrastructure"},
            {"priority": 2, "action": "Verify backup power at critical facilities", "reason": "Hospitals and emergency services must maintain operations"},
            {"priority": 3, "action": "Deploy utility damage assessment teams", "reason": "Full extent of damage assessment needed for repair planning"},
            {"priority": 4, "action": "Implement traffic management at affected intersections", "reason": "Non-functioning traffic signals create accident risks"},
        ],
        "resource_estimation": [
            {"resource": "Utility Crews", "estimated": 6, "reason": "Electrical repair and restoration teams"},
            {"resource": "Traffic Control", "estimated": 4, "reason": "Intersection management during power outage"},
        ],
        "escalation_forecast": {
            "next_15_minutes": ["Damage assessment teams deploying", "Isolation procedures being implemented", "Critical facility verification underway"],
            "next_hour": ["Repair operations commencing on isolated sections", "Alternative power routing being evaluated", "Public information about outage being released"],
            "next_6_hours": ["Partial restoration of services expected", "Full damage assessment complete", "Long-term repair plan developed"],
        },
        "reasoning_tree": [
            {"detected": "Infrastructure category selected", "inference": "Infrastructure failure incident", "reason": "Primary classification indicates infrastructure incident"},
            {"detected": "Title references infrastructure damage", "inference": "Physical infrastructure compromised", "reason": "Title confirms damage to utility infrastructure"},
            {"detected": "Electrical systems involved", "inference": "Power distribution infrastructure affected", "reason": "Description indicates electrical infrastructure primary failure point"},
        ],
    },
]


class OllamaService:
    def __init__(self):
        self.endpoint = settings.ollama_endpoint
        self.model = settings.ollama_model
        self.demo_mode = settings.demo_mode
        self._demo_index = 0
        if self.demo_mode:
            logger.info("AI Engine running in DEMO MODE — returning realistic synthetic analyses")
        if not self.demo_mode:
            self.client = httpx.AsyncClient(timeout=120.0)

    async def analyze(self, title: str, description: str, location: str, category: str, latitude: float | None = None, longitude: float | None = None) -> dict:
        if self.demo_mode:
            return self._demo_response(title, description, location)

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

    def _demo_response(self, title: str, description: str, location: str) -> dict:
        idx = self._demo_index % len(DEMO_RESPONSES)
        self._demo_index += 1
        resp = dict(DEMO_RESPONSES[idx])
        resp["executive_summary"] = (
            f"[Demo AI] Incident reported at {location}: {title}. "
            + resp["executive_summary"]
        )
        resp["source"] = "AI Intelligence Report (Demo)"
        resp["reasoning_tree"] = [
            {"detected": f"Demo mode active — no real AI backend connected", "inference": "Synthetic analysis generated", "reason": "AI service running in demonstration mode for evaluation purposes"},
            *resp.get("reasoning_tree", []),
        ]
        return self._validate(resp, title, description, location)

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
            "source": "Incident Report (Fallback)",
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
        if hasattr(self, 'client') and self.client:
            await self.client.aclose()
