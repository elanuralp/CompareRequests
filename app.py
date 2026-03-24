import streamlit as st

from core.comparator import compare_parsed_responses
from core.qpx_parser import parse_qpx_response
from core.tango_parser import parse_tango_response

st.set_page_config(page_title="Tax Comparator", layout="wide")


# ----------------------------
# Helpers
# ----------------------------
def sort_records(records):
    return sorted(
        records,
        key=lambda r: (
            r.tax_code or "",
            r.tax_type or "",
            r.tax_point or "",
            r.reference_id or "",
        )
    )
def record_to_row(record):
    return {
        "Tax Code": record.tax_code,
        "Tax Type": record.tax_type,
        "Tax Point": record.tax_point,
        "Tax Point Tag": record.tax_point_tag,
        "Nation": record.nation,
        "Original Amount": str(record.original_amount) if record.original_amount is not None else None,
        "Original Currency": record.original_currency,
        "Sale Amount": str(record.sale_amount) if record.sale_amount is not None else None,
        "Sale Currency": record.sale_currency,
        "Ref ID": record.reference_id,
    }


def show_mismatch_block(result):
    st.error(f"Mismatch → {' | '.join(result.business_key)}")
    for diff in result.differences:
        st.write(
            f"**{diff.field_name}** → "
            f"QPX: `{diff.left_value}` | TANGO: `{diff.right_value}`"
        )


# ----------------------------
# Header
# ----------------------------
st.title("✈️ QPX vs TANGO Tax Comparator")

st.markdown("""
Compare tax responses between **QPX (XML)** and **TANGO (JSON)**.

**Scope (MVP):**
- One-way
- 1 Adult (ADT)
- Non-stop
- Manual paste comparison
""")

st.divider()

# ----------------------------
# Input Section
# ----------------------------
st.subheader("📥 Input Responses")

col1, col2 = st.columns(2)

with col1:
    qpx_text = st.text_area(
        "QPX XML Response",
        height=300,
        placeholder="<response>...</response>",
    )

with col2:
    tango_text = st.text_area(
        "TANGO JSON Response",
        height=300,
        placeholder='{"taxCalculationSearchResult": [...]}',
    )

# ----------------------------
# Buttons
# ----------------------------
btn_col1, btn_col2 = st.columns(2)

with btn_col1:
    compare_clicked = st.button("🚀 Compare", use_container_width=True)

with btn_col2:
    clear_clicked = st.button("🧹 Clear", use_container_width=True)

if clear_clicked:
    qpx_text = ""
    tango_text = ""


# ----------------------------
# Compare Logic
# ----------------------------
if compare_clicked:

    if not qpx_text.strip():
        st.error("Please provide QPX XML.")
        st.stop()

    if not tango_text.strip():
        st.error("Please provide TANGO JSON.")
        st.stop()

    try:
        qpx = parse_qpx_response(qpx_text)
        tango = parse_tango_response(tango_text)
        summary = compare_parsed_responses(qpx, tango)
    except Exception as e:
        st.error(str(e))
        st.stop()

    # ----------------------------
    # Summary
    # ----------------------------
    st.subheader("📊 Summary")

    if summary.status == "PASS":
        st.success("✅ PASS")
    else:
        st.error("❌ FAIL")

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Matched", len(summary.matched))
    m2.metric("Mismatched", len(summary.mismatched))
    m3.metric("Missing in QPX", len(summary.missing_in_left))
    m4.metric("Missing in TANGO", len(summary.missing_in_right))

    # ----------------------------
    # Tabs
    # ----------------------------
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "Differences",
        "Missing",
        "QPX Records",
        "TANGO Records",
        "Mapping"
    ])

    # ----------------------------
    # Differences Tab
    # ----------------------------
    with tab1:
        if summary.mismatched:
            for result in summary.mismatched:
                show_mismatch_block(result)
        else:
            st.success("No mismatches found.")

    # ----------------------------
    # Missing Tab
    # ----------------------------
    with tab2:
        col1, col2 = st.columns(2)

        with col1:
            st.markdown("### Missing in QPX")
            if summary.missing_in_left:
                st.dataframe(
                    [record_to_row(r) for r in summary.missing_in_left],
                    use_container_width=True
                )
            else:
                st.success("None")

        with col2:
            st.markdown("### Missing in TANGO")
            if summary.missing_in_right:
                st.dataframe(
                    [record_to_row(r) for r in summary.missing_in_right],
                    use_container_width=True
                )
            else:
                st.success("None")

    # ----------------------------
    # QPX Records
    # ----------------------------
    with tab3:
        if qpx.records:
            qpx_sorted = sort_records(qpx.records)
            st.dataframe(
                [record_to_row(r) for r in qpx_sorted],
                use_container_width=True
            )
        else:
            st.info("No QPX records parsed.")

    with tab4:
        if tango.records:
            tango_sorted = sort_records(tango.records)
            st.dataframe(
                [record_to_row(r) for r in tango_sorted],
                use_container_width=True
            )
        else:
            st.info("No TANGO records parsed.")

    # ----------------------------
    # Mapping Tab
    # ----------------------------
    with tab5:
        st.markdown("### Mapping Assumptions")

        st.table([
            ["QPX Field", "TANGO Field", "Meaning"],
            ["price", "originalFare", "Original Fare"],
            ["salePrice", "saleFare", "Sale Fare"],
            ["subcode", "taxType", "Tax Type"],
            ["sequenceNumber", "refRecordId", "Reference ID"],
        ])