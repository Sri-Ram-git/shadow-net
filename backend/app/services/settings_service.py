from app.repositories.settings_repository import SettingsRepository


VALIDATION_RULES: dict[str, dict] = {
    "ai_model": {"type": "string", "options": ["phi3:mini", "llama3:latest", "mistral:latest"]},
    "ai_temperature": {"type": "float", "min": 0.0, "max": 2.0},
    "ai_max_tokens": {"type": "int", "min": 128, "max": 32768},
    "heartbeat_interval": {"type": "int", "min": 100, "max": 60000},
    "log_level": {"type": "string", "options": ["trace", "debug", "info", "warn", "error"]},
    "default_priority": {"type": "string", "options": ["P1", "P2", "P3", "P4"]},
    "sync_interval": {"type": "int", "min": 10, "max": 3600},
}

DEFAULT_SETTINGS: dict[str, str] = {
    "ai_model": "phi3:mini",
    "ai_temperature": "0.3",
    "ai_max_tokens": "2048",
    "heartbeat_interval": "1500",
    "self_healing": "true",
    "pod_recovery": "true",
    "replication_enabled": "true",
    "sync_mode": "online",
    "compression": "true",
    "encryption": "true",
    "conflict_resolution": "timestamp-win",
    "default_priority": "P2",
    "auto_ai_analysis": "true",
    "auto_resource_estimation": "true",
    "auto_severity_detection": "true",
    "auto_classification": "true",
    "auto_summary": "true",
    "auto_pdf": "false",
    "auto_dispatch": "false",
    "log_level": "info",
    "theme": "dark",
    "compact_mode": "false",
    "sidebar_size": "medium",
    "animations": "true",
    "reduced_motion": "false",
    "monospace_json": "false",
    "date_format": "24h",
    "timezone": "utc",
}


class SettingsService:
    def __init__(self, repo: SettingsRepository):
        self._repo = repo

    async def get_all(self) -> dict[str, str]:
        stored = await self._repo.get_all()
        for k, v in DEFAULT_SETTINGS.items():
            stored.setdefault(k, v)
        return stored

    async def get(self, key: str) -> str:
        stored = await self._repo.get(key)
        if stored is not None:
            return stored
        return DEFAULT_SETTINGS.get(key, "")

    async def set(self, key: str, value: str, updated_by: str = "operator") -> dict:
        rule = VALIDATION_RULES.get(key)
        if rule:
            error = self._validate(key, value, rule)
            if error:
                return {"ok": False, "error": error}
        await self._repo.set(key, value, updated_by)
        return {"ok": True}

    async def set_many(self, items: dict[str, str], updated_by: str = "operator") -> dict:
        errors = {}
        for key, value in items.items():
            rule = VALIDATION_RULES.get(key)
            if rule:
                error = self._validate(key, value, rule)
                if error:
                    errors[key] = error
        if errors:
            return {"ok": False, "errors": errors}
        count = await self._repo.set_many(items, updated_by)
        return {"ok": True, "count": count}

    def _validate(self, key: str, value: str, rule: dict) -> str | None:
        t = rule["type"]
        if t == "string":
            if "options" in rule and value not in rule["options"]:
                return f"'{value}' is not valid for {key}. Options: {', '.join(rule['options'])}"
        elif t == "int":
            try:
                v = int(value)
            except ValueError:
                return f"'{value}' is not a valid integer for {key}"
            if v < rule.get("min", float("-inf")) or v > rule.get("max", float("inf")):
                return f"{key} must be between {rule.get('min')} and {rule.get('max')}"
        elif t == "float":
            try:
                v = float(value)
            except ValueError:
                return f"'{value}' is not a valid number for {key}"
            if v < rule.get("min", float("-inf")) or v > rule.get("max", float("inf")):
                return f"{key} must be between {rule.get('min')} and {rule.get('max')}"
        return None
