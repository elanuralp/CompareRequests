from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Optional


def safe_decimal(value: Any) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        text = str(value).strip()
        if text == "":
            return None
        return Decimal(text)
    except (InvalidOperation, ValueError, TypeError):
        return None


def get_nested(data: Dict[str, Any], path: str):
    current = data
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
        if current is None:
            return None
    return current


def normalize_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text if text != "" else None