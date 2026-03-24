from lxml import etree

from core.models import ParsedResponse, TaxRecord
from core.utils import normalize_text, safe_decimal


def parse_qpx_response(raw_text: str) -> ParsedResponse:
    try:
        root = etree.fromstring(raw_text.encode("utf-8"))
    except Exception as exc:
        raise ValueError(f"QPX XML is invalid: {exc}") from exc

    result = ParsedResponse(source="QPX")

    tax_nodes = root.xpath(".//pricingDetail/solution/pricing/tax")

    if not tax_nodes:
        result.warnings.append("No <tax> nodes found under pricingDetail/solution/pricing.")
        return result

    for tax in tax_nodes:
        tax_code = normalize_text(tax.get("code"))

        # Ignore YR for QPX
        if tax_code == "YR":
            continue

        price_node = tax.find("price")
        sale_price_node = tax.find("salePrice")

        tax_point = normalize_text(tax.get("origin")) or normalize_text(tax.get("destination"))

        record = TaxRecord(
            source="QPX",
            reference_id=normalize_text(tax.get("sequenceNumber")),
            tax_code=tax_code,
            tax_type=normalize_text(tax.get("subcode")),
            nation=normalize_text(tax.get("country")),
            tax_point_tag=normalize_text(tax.get("recordX1TaxPointTag")),
            tax_point=tax_point,
            original_amount=safe_decimal(price_node.get("amount") if price_node is not None else None),
            original_currency=normalize_text(price_node.get("currency") if price_node is not None else None),
            sale_amount=safe_decimal(sale_price_node.get("amount") if sale_price_node is not None else None),
            sale_currency=normalize_text(sale_price_node.get("currency") if sale_price_node is not None else None),
            carrier=normalize_text(tax.get("carrier")),
            name=normalize_text(tax.get("name")),
            record_x1_tax_type=normalize_text(tax.get("recordX1TaxType")),
            raw={"xml": etree.tostring(tax, encoding="unicode")},
        )
        result.records.append(record)

    return result