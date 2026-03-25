import { describe, it, expect } from "vitest";
import { parseQpxResponse } from "./lib/parsers/qpxParser";
import { parseTangoResponse } from "./lib/parsers/tangoParser";
import { compareParsedResponses } from "./lib/comparator";

const QPX_NSIIST = `<result debugDurationMilliseconds="0" durationMilliseconds="457" id="cpz3ni5YwnjKtrwzjOVEmXxTA" session="TiV0k5dMzVOTa71OPlaO4Zbma" solutionCount="1" solutionSet="0PCxm8vLTMqSTeBpvmAh3qF">
  <pricingDetail>
    <solution id="CwFlcMDGYvUSkAEy573DlQ001">
      <pricing paxCount="1" ptc="ADT">
        <tax code="D7" country="CM" name="Cameroon Fiscal Stamp" origin="NSI" recordX1TaxPointTag="D" recordX1TaxType="001" sequenceNumber="108125" status="APPLIED" subcode="001">
          <price amount="120000" currency="XAF"/>
          <salePrice amount="8871.44" currency="TRY"/>
        </tax>
        <tax code="U9" country="CM" name="Cameroon Regional Aviation Security Charge Rsar" origin="NSI" recordX1TaxPointTag="D" recordX1TaxType="001" sequenceNumber="105000" status="APPLIED" subcode="001">
          <price amount="1500" currency="XAF"/>
          <salePrice amount="110.90" currency="TRY"/>
        </tax>
        <tax code="VX" country="CM" name="Cameroon Safety Tax" origin="NSI" recordX1TaxPointTag="D" recordX1TaxType="001" sequenceNumber="8750" status="APPLIED" subcode="001">
          <price amount="14385" currency="XAF"/>
          <salePrice amount="1063.47" currency="TRY"/>
        </tax>
        <tax code="VY" country="CM" name="Cameroon Development Tax International" origin="NSI" recordX1TaxPointTag="D" recordX1TaxType="001" sequenceNumber="20000" status="APPLIED" subcode="001">
          <price amount="21550" currency="XAF"/>
          <salePrice amount="1593.17" currency="TRY"/>
        </tax>
        <tax code="VZ" country="CM" name="Cameroon Passenger Service Charge" origin="NSI" recordX1TaxPointTag="D" recordX1TaxType="001" sequenceNumber="30000" status="APPLIED" subcode="001">
          <price amount="14385" currency="XAF"/>
          <salePrice amount="1063.47" currency="TRY"/>
        </tax>
        <tax carrier="TK" code="YR" name="TK YR surcharge" origin="NSI" sequenceNumber="8020793" status="APPLIED" subcode="F">
          <price amount="166.00" currency="USD"/>
          <salePrice amount="6991.64" currency="TRY"/>
        </tax>
      </pricing>
    </solution>
  </pricingDetail>
</result>`;

const TANGO_NSIIST = {
  taxCalculationSearchResult: [
    {
      refRecordId: "CM_VZ_001_U_D_F_30000_xso5n",
      nation: "CM",
      taxCode: "VZ",
      taxType: "001",
      taxPointTag: "D",
      taxPoint: "NSI",
      originalFare: { amount: { stringValue: "14385" }, currencyCode: "XAF" },
      saleFare: { amount: { stringValue: "1063.47" }, currencyCode: "TRY" },
      valueCapped: false,
    },
    {
      refRecordId: "CM_U9_001_U_D_F_105000_a32q4",
      nation: "CM",
      taxCode: "U9",
      taxType: "001",
      taxPointTag: "D",
      taxPoint: "NSI",
      originalFare: { amount: { stringValue: "1500" }, currencyCode: "XAF" },
      saleFare: { amount: { stringValue: "110.90" }, currencyCode: "TRY" },
      valueCapped: false,
    },
    {
      refRecordId: "CM_VX_001_U_D_F_8750_p1ypn",
      nation: "CM",
      taxCode: "VX",
      taxType: "001",
      taxPointTag: "D",
      taxPoint: "NSI",
      originalFare: { amount: { stringValue: "14385" }, currencyCode: "XAF" },
      saleFare: { amount: { stringValue: "1063.47" }, currencyCode: "TRY" },
      valueCapped: false,
    },
    {
      refRecordId: "CM_D7_001_U_D_F_108125_pemb9",
      nation: "CM",
      taxCode: "D7",
      taxType: "001",
      taxPointTag: "D",
      taxPoint: "NSI",
      originalFare: { amount: { stringValue: "120000" }, currencyCode: "XAF" },
      saleFare: { amount: { stringValue: "8871.44" }, currencyCode: "TRY" },
      valueCapped: false,
    },
    {
      refRecordId: "CM_VY_001_U_D_F_20000_tzxxd",
      nation: "CM",
      taxCode: "VY",
      taxType: "001",
      taxPointTag: "D",
      taxPoint: "NSI",
      originalFare: { amount: { stringValue: "21550" }, currencyCode: "XAF" },
      saleFare: { amount: { stringValue: "1593.17" }, currencyCode: "TRY" },
      valueCapped: false,
    },
  ],
};

describe("QPX vs TANGO — NSI-IST C RBD (real payloads)", () => {
  describe("parseQpxResponse", () => {
    it("parses 5 tax records (YR excluded)", () => {
      const result = parseQpxResponse(QPX_NSIIST);

      expect(result.records).toHaveLength(5);
      expect(result.warnings).toHaveLength(0);

      const codes = result.records.map((r) => r.tax_code).sort();
      expect(codes).toEqual(["D7", "U9", "VX", "VY", "VZ"]);
    });

    it("skips YR surcharge", () => {
      const result = parseQpxResponse(QPX_NSIIST);

      expect(result.records.find((r) => r.tax_code === "YR")).toBeUndefined();
    });

    it("extracts tax_point from origin attribute", () => {
      const result = parseQpxResponse(QPX_NSIIST);

      for (const record of result.records) {
        expect(record.tax_point).toBe("NSI");
        expect(record.tax_point_tag).toBe("D");
        expect(record.nation).toBe("CM");
      }
    });

    it("extracts subcode as tax_type", () => {
      const result = parseQpxResponse(QPX_NSIIST);

      for (const record of result.records) {
        expect(record.tax_type).toBe("001");
      }
    });

    it("parses price amount as original_amount", () => {
      const result = parseQpxResponse(QPX_NSIIST);

      const d7 = result.records.find((r) => r.tax_code === "D7");
      expect(d7?.original_amount).toBe(120000);
      expect(d7?.original_currency).toBe("XAF");
    });

    it("parses salePrice as sale_amount", () => {
      const result = parseQpxResponse(QPX_NSIIST);

      const d7 = result.records.find((r) => r.tax_code === "D7");
      expect(d7?.sale_amount).toBe(8871.44);
      expect(d7?.sale_currency).toBe("TRY");
    });
  });

  describe("parseTangoResponse", () => {
    it("parses all 5 records", () => {
      const result = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      expect(result.records).toHaveLength(5);
      expect(result.warnings).toHaveLength(0);
    });

    it("extracts all tax codes correctly", () => {
      const result = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      const codes = result.records.map((r) => r.tax_code).sort();
      expect(codes).toEqual(["D7", "U9", "VX", "VY", "VZ"]);
    });

    it("extracts originalFare correctly", () => {
      const result = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      const d7 = result.records.find((r) => r.tax_code === "D7");
      expect(d7?.original_amount).toBe(120000);
      expect(d7?.original_currency).toBe("XAF");
    });

    it("extracts saleFare correctly", () => {
      const result = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      const d7 = result.records.find((r) => r.tax_code === "D7");
      expect(d7?.sale_amount).toBe(8871.44);
      expect(d7?.sale_currency).toBe("TRY");
    });

    it("extracts taxPoint, nation, taxPointTag correctly", () => {
      const result = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      for (const record of result.records) {
        expect(record.tax_point).toBe("NSI");
        expect(record.tax_point_tag).toBe("D");
        expect(record.nation).toBe("CM");
        expect(record.tax_type).toBe("001");
      }
    });
  });

  describe("compareParsedResponses — QPX vs TANGO", () => {
    it("should produce PASS — all records match", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      const result = compareParsedResponses(qpx, tango);

      expect(result.status).toBe("PASS");
      expect(result.matched).toHaveLength(5);
      expect(result.mismatched).toHaveLength(0);
      expect(result.missing_in_left).toHaveLength(0);
      expect(result.missing_in_right).toHaveLength(0);
    });

    it("should match all 5 tax codes by business key", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      const result = compareParsedResponses(qpx, tango);

      const matchedCodes = result.matched.map((m) => m.business_key[0]).sort();
      expect(matchedCodes).toEqual(["D7", "U9", "VX", "VY", "VZ"]);
    });

    it("amounts should match with 0.01 tolerance (original amounts differ — different currencies)", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      const result = compareParsedResponses(qpx, tango);

      expect(result.status).toBe("PASS");
    });
  });

  describe("data consistency checks", () => {
    it("QPX and TANGO should have the same number of non-YR tax records", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      expect(qpx.records).toHaveLength(tango.records.length);
    });

    it("all QPX original amounts should be in XAF", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);

      for (const record of qpx.records) {
        expect(record.original_currency).toBe("XAF");
      }
    });

    it("all QPX sale amounts should be in TRY", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);

      for (const record of qpx.records) {
        expect(record.sale_currency).toBe("TRY");
      }
    });

    it("all TANGO original amounts should be in XAF", () => {
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      for (const record of tango.records) {
        expect(record.original_currency).toBe("XAF");
      }
    });

    it("all TANGO sale amounts should be in TRY", () => {
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      for (const record of tango.records) {
        expect(record.sale_currency).toBe("TRY");
      }
    });

    it("all records should share the same tax_point and nation", () => {
      const qpx = parseQpxResponse(QPX_NSIIST);
      const tango = parseTangoResponse(JSON.stringify(TANGO_NSIIST));

      for (const record of [...qpx.records, ...tango.records]) {
        expect(record.tax_point).toBe("NSI");
        expect(record.nation).toBe("CM");
        expect(record.tax_point_tag).toBe("D");
        expect(record.tax_type).toBe("001");
      }
    });
  });
});
