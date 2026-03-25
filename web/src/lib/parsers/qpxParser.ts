import type { ParsedResponse, TaxRecord } from "../types";
import { normalizeText, safeDecimal } from "../utils";

export function parseQpxResponse(rawText: string): ParsedResponse {
  let parser: DOMParser;
  let root: Document;
  try {
    parser = new DOMParser();
    root = parser.parseFromString(rawText, "text/xml");
    const errorNode = root.querySelector("parsererror");
    if (errorNode) {
      throw new Error("QPX XML is invalid");
    }
  } catch (exc) {
    throw new Error(`QPX XML is invalid: ${exc}`);
  }

  const result: ParsedResponse = { source: "QPX", records: [], warnings: [] };

  const taxNodes = root.evaluate(
    ".//pricingDetail/solution/pricing/tax",
    root,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  if (taxNodes.snapshotLength === 0) {
    result.warnings.push("No <tax> nodes found under pricingDetail/solution/pricing.");
    return result;
  }

  for (let i = 0; i < taxNodes.snapshotLength; i++) {
    const tax = taxNodes.snapshotItem(i) as Element;

    const taxCode = normalizeText(tax.getAttribute("code"));
    if (taxCode === "YR") continue;

    const priceNode = tax.querySelector("price");
    const salePriceNode = tax.querySelector("salePrice");

    const taxPoint =
      normalizeText(tax.getAttribute("origin")) ||
      normalizeText(tax.getAttribute("destination"));

    const record: TaxRecord = {
      source: "QPX",
      reference_id: normalizeText(tax.getAttribute("sequenceNumber")),
      tax_code: taxCode,
      tax_type: normalizeText(tax.getAttribute("subcode")),
      nation: normalizeText(tax.getAttribute("country")),
      tax_point_tag: normalizeText(tax.getAttribute("recordX1TaxPointTag")),
      tax_point: taxPoint,
      original_amount: safeDecimal(
        priceNode?.getAttribute("amount") ?? null
      ),
      original_currency: normalizeText(
        priceNode?.getAttribute("currency") ?? null
      ),
      sale_amount: safeDecimal(
        salePriceNode?.getAttribute("amount") ?? null
      ),
      sale_currency: normalizeText(
        salePriceNode?.getAttribute("currency") ?? null
      ),
      carrier: normalizeText(tax.getAttribute("carrier")),
      name: normalizeText(tax.getAttribute("name")),
      record_x1_tax_type: normalizeText(tax.getAttribute("recordX1TaxType")),
      raw: { xml: tax.innerHTML },
    };

    result.records.push(record);
  }

  return result;
}
