import { describe, it, expect } from "vitest";
import { parseQpxResponse } from "./lib/parsers/qpxParser";
import { parseTangoResponse } from "./lib/parsers/tangoParser";

const QPX_VALID = `<response>
  <pricingDetail>
    <solution>
      <pricing>
        <tax code="US" subcode="001" origin="JFK" country="US" sequenceNumber="1">
          <price amount="100" currency="USD"/>
          <salePrice amount="95" currency="USD"/>
        </tax>
        <tax code="YR" subcode="002" origin="LAX" country="US">
          <price amount="10" currency="USD"/>
          <salePrice amount="10" currency="USD"/>
        </tax>
      </pricing>
    </solution>
  </pricingDetail>
</response>`;

const QPX_EMPTY = `<response><pricingDetail></pricingDetail></response>`;

const QPX_INVALID = `<not-valid><`;

const TANGO_VALID = JSON.stringify({
  taxCalculationSearchResult: [
    {
      refRecordId: "LEG_1_ADT_O_001_NUC",
      taxCode: "US",
      taxType: "001",
      nation: "US",
      taxPointTag: "P",
      taxPoint: "JFK",
      originalFare: { amount: { stringValue: "100" }, currencyCode: "USD" },
      saleFare: { amount: { stringValue: "95" }, currencyCode: "USD" },
    },
    {
      refRecordId: "LEG_2_ADT_O_002_NUC",
      taxCode: "UK",
      taxType: "002",
      nation: "UK",
      taxPoint: "LHR",
      originalFare: { amount: { stringValue: "200" }, currencyCode: "GBP" },
      saleFare: { amount: { stringValue: "190" }, currencyCode: "GBP" },
    },
  ],
});

const TANGO_EMPTY = JSON.stringify({ taxCalculationSearchResult: [] });

const TANGO_INVALID = `{ not valid json }`;

const TANGO_NO_ARRAY = JSON.stringify({ someOtherKey: [] });

describe("parseQpxResponse", () => {
  it("parses valid XML and returns records", () => {
    const result = parseQpxResponse(QPX_VALID);

    expect(result.source).toBe("QPX");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].tax_code).toBe("US");
    expect(result.records[0].tax_type).toBe("001");
    expect(result.records[0].tax_point).toBe("JFK");
    expect(result.records[0].nation).toBe("US");
    expect(result.records[0].original_amount).toBe(100);
    expect(result.records[0].original_currency).toBe("USD");
    expect(result.records[0].sale_amount).toBe(95);
    expect(result.records[0].sale_currency).toBe("USD");
    expect(result.records[0].reference_id).toBe("1");
  });

  it("skips YR tax code", () => {
    const result = parseQpxResponse(QPX_VALID);

    expect(result.records.find((r) => r.tax_code === "YR")).toBeUndefined();
    expect(result.records).toHaveLength(1);
  });

  it("returns warning when no tax nodes found", () => {
    const result = parseQpxResponse(QPX_EMPTY);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.records).toHaveLength(0);
  });

  it("throws on invalid XML", () => {
    expect(() => parseQpxResponse(QPX_INVALID)).toThrow();
  });
});

describe("parseTangoResponse", () => {
  it("parses valid JSON and returns records", () => {
    const result = parseTangoResponse(TANGO_VALID);

    expect(result.source).toBe("TANGO");
    expect(result.records).toHaveLength(2);

    expect(result.records[0].tax_code).toBe("US");
    expect(result.records[0].tax_type).toBe("001");
    expect(result.records[0].tax_point).toBe("JFK");
    expect(result.records[0].nation).toBe("US");
    expect(result.records[0].original_amount).toBe(100);
    expect(result.records[0].original_currency).toBe("USD");
    expect(result.records[0].sale_amount).toBe(95);
    expect(result.records[0].sale_currency).toBe("USD");
  });

  it("extracts sequence number from refRecordId", () => {
    const result = parseTangoResponse(TANGO_VALID);

    expect(result.records[0].reference_id).toBe("001");
    expect(result.records[1].reference_id).toBe("002");
  });

  it("handles nested fare fields", () => {
    const result = parseTangoResponse(TANGO_VALID);

    expect(result.records[1].original_amount).toBe(200);
    expect(result.records[1].original_currency).toBe("GBP");
    expect(result.records[1].sale_amount).toBe(190);
    expect(result.records[1].sale_currency).toBe("GBP");
  });

  it("returns empty records for empty array", () => {
    const result = parseTangoResponse(TANGO_EMPTY);

    expect(result.records).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseTangoResponse(TANGO_INVALID)).toThrow();
  });

  it("throws when taxCalculationSearchResult is missing", () => {
    expect(() => parseTangoResponse(TANGO_NO_ARRAY)).toThrow();
  });

  it("skips non-object items with warning", () => {
    const mixed = JSON.stringify({
      taxCalculationSearchResult: [
        { refRecordId: "LEG_1", taxCode: "US", taxType: "001", taxPoint: "JFK" },
        "not an object",
        { refRecordId: "LEG_2", taxCode: "UK", taxType: "002", taxPoint: "LHR" },
      ],
    });

    const result = parseTangoResponse(mixed);

    expect(result.records).toHaveLength(2);
    expect(result.warnings.some((w) => w.includes("non-object"))).toBe(true);
  });
});
