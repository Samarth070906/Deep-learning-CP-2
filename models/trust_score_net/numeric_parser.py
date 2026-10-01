import re

# Common currency symbols and codes for auto-detection
_CURRENCY_SYMBOLS = r"[\$£€₹¥₩]"
_CURRENCY_CODES = r"(?:USD|EUR|GBP|INR|JPY|CAD|AUD|KRW)"

def extract_number_with_unit(text: str, unit: str):
    """Extract a number anchored to a specific unit string."""
    if not text:
        return None
    if unit:
        # Match number right before the unit
        pattern = r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*" + re.escape(unit)
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            return float(matches[-1].replace(",", ""))
        # Also try unit before the number (e.g. "$29")
        pattern_pre = re.escape(unit) + r"\s*(\d+(?:,\d{3})*(?:\.\d+)?)"
        matches_pre = re.findall(pattern_pre, text, re.IGNORECASE)
        if matches_pre:
            return float(matches_pre[-1].replace(",", ""))
        return None
    else:
        return None

def _auto_extract_price(text: str):
    """
    Auto-detect prices in text even without a user-specified unit.
    Handles patterns like: $29, $189.99, 9.99 USD, €49.99, ₹1,299
    """
    if not text:
        return None
    
    # Pattern 1: Symbol before number → $29, $189.99, €49.99, ₹1,299
    pattern_sym_before = _CURRENCY_SYMBOLS + r"\s*(\d+(?:,\d{3})*(?:\.\d+)?)"
    matches = re.findall(pattern_sym_before, text)
    if matches:
        return float(matches[0].replace(",", ""))
    
    # Pattern 2: Number before currency code → 9.99 USD, 189.99 EUR
    pattern_code_after = r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*" + _CURRENCY_CODES
    matches = re.findall(pattern_code_after, text, re.IGNORECASE)
    if matches:
        return float(matches[0].replace(",", ""))
    
    # Pattern 3: "is <number>" or "costs <number>" — precise anchor to avoid
    # matching model numbers like "2nd Generation"
    pattern_is_num = r"\b(?:is|costs|cost|was|at)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\b"
    matches = re.findall(pattern_is_num, text, re.IGNORECASE)
    if matches:
        # Filter out tiny numbers (1, 2, 3) which are likely model/version numbers
        valid = [float(m.replace(",", "")) for m in matches if float(m.replace(",", "")) >= 5.0]
        if valid:
            return valid[0]
    
    # Pattern 4: "for <number>" common in claims (with or without currency symbol)
    pattern_for = r"for\s+" + _CURRENCY_SYMBOLS + r"?\s*(\d+(?:,\d{3})*(?:\.\d+)?)"
    matches = re.findall(pattern_for, text, re.IGNORECASE)
    if matches:
        return float(matches[0].replace(",", ""))
    
    # Pattern 5: "price of ... is <number>" — long-range anchor
    pattern_price_of = r"price\b.*?\bis\s+(\d+(?:,\d{3})*(?:\.\d+)?)"
    matches = re.findall(pattern_price_of, text, re.IGNORECASE)
    if matches:
        return float(matches[0].replace(",", ""))
    
    return None

def get_numeric_deviation(claim_text: str, evidence_text: str, unit: str = None):
    """
    Extracts the numeric deviation between claim and evidence texts.
    
    If a unit is provided, uses unit-anchored extraction.
    If no unit is provided, auto-detects prices using currency symbols and patterns.
    
    Returns deviation_pct (0.0 to 1.0) or -1.0 if not parseable or not numeric.
    """
    if unit:
        # Use precise unit-anchored extraction
        val_claim = extract_number_with_unit(claim_text, unit)
        val_evidence = extract_number_with_unit(evidence_text, unit)
    else:
        # Auto-detect prices from both texts
        val_claim = _auto_extract_price(claim_text)
        val_evidence = _auto_extract_price(evidence_text)
    
    if val_claim is None or val_evidence is None:
        return -1.0
        
    if val_evidence == 0:
        if val_claim == 0:
            return 0.0
        return 1.0
        
    deviation_pct = abs(val_claim - val_evidence) / val_evidence
    return min(deviation_pct, 1.0)
