import json
import re
from typing import Any, Dict, List, Optional

from core.models import ParsedResponse, TaxRecord
from core.utils import get_nested, normalize_text, safe_decimal


def extract_sequence_number_from_ref_record_id(ref_record_id: Optional[str]) -> Optional[str]:
    if not ref_record_id:
        return None

    match = re.search(r"_([0-9]+)_[^_]+$", ref_record_id)
    if match:
        return match.group(1)

    return None


def parse_tango_response(raw_text: str) -> ParsedResponse:
    raw_text = (
        raw_text.strip()
        .replace("\ufeff", "")
        .replace("\u00a0", " ")
        .replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
    )

    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"TANGO JSON is invalid: {exc}") from exc

    result = ParsedResponse(source="TANGO")
    rows: List[Dict[str, Any]] = payload.get("taxCalculationSearchResult", [])

    if not isinstance(rows, list):
        raise ValueError("TANGO JSON does not contain a valid 'taxCalculationSearchResult' list.")

    for item in rows:
        if not isinstance(item, dict):
            result.warnings.append("Skipped one non-object item in taxCalculationSearchResult.")
            continue

        full_ref = normalize_text(item.get("refRecordId"))

        record = TaxRecord(
            source="TANGO",
            reference_id=extract_sequence_number_from_ref_record_id(full_ref),
            tax_code=normalize_text(item.get("taxCode")),
            tax_type=normalize_text(item.get("taxType")),
            nation=normalize_text(item.get("nation")),
            tax_point_tag=normalize_text(item.get("taxPointTag")),
            tax_point=normalize_text(item.get("taxPoint")),
            original_amount=safe_decimal(get_nested(item, "originalFare.amount.stringValue")),
            original_currency=normalize_text(get_nested(item, "originalFare.currencyCode")),
            sale_amount=safe_decimal(get_nested(item, "saleFare.amount.stringValue")),
            sale_currency=normalize_text(get_nested(item, "saleFare.currencyCode")),
            value_capped=item.get("valueCapped"),
            raw=item,
        )
        result.records.append(record)

    return result