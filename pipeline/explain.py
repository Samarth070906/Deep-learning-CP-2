import re
from trustagent.pipeline.decision import MINOR_DEVIATION_THRESHOLD

def _extract_numbers(text: str) -> list[float]:
    """Helper XAI function to extract all numbers from a string."""
    numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
    return [float(n) for n in numbers]

def generate_explanation(
    claim_text: str,
    evidence_text: str,
    t_label: str,
    t_score: float,
    i_label: str,
    i_score: float,
    numeric_deviation: float,
    consistency_score: float,
    trust_score: float,
    decision: str
) -> str:
    lines = []
    lines.append(f"Claim: '{claim_text}'")
    
    # Evidence Checked
    mods = []
    if t_label != "NO_EVIDENCE": mods.append("Text")
    if i_label != "NO_EVIDENCE": mods.append("Image")
        
    if not mods:
        lines.append("Evidence Checked: None (Neither Text nor Image provided valid evidence).")
    else:
        lines.append(f"Evidence Checked: {' and '.join(mods)}.")
        if t_label == "NO_EVIDENCE":
            lines.append(" - Note: Text evidence was checked but yielded NO EVIDENCE.")
            
    # Agreement / Disagreement
    if not mods:
        lines.append("Result: Cannot verify due to lack of evidence.")
    else:
        supports = any(l == "SUPPORT" for l in [t_label, i_label])
        contradicts = any(l == "CONTRADICT" for l in [t_label, i_label])
        is_mixed = supports and contradicts
        
        if supports and not contradicts:
            lines.append("Result: Evidence AGREES with the claim.")
        elif contradicts and not supports:
            lines.append("Result: Evidence DISAGREES with the claim.")
        else:
            lines.append("Result: Mixed evidence (some support, some contradiction).")
            
        # ----------------------------------------------------
        # UPGRADE A: The Explainability Engine (XAI)
        # ----------------------------------------------------
        if contradicts:
            # 1. Try to find an exact numeric mismatch
            claim_nums = _extract_numbers(claim_text)
            evidence_nums = _extract_numbers(evidence_text)
            
            # If both have numbers but they don't share any, it's a numeric mismatch
            if claim_nums and evidence_nums and not set(claim_nums).intersection(set(evidence_nums)):
                lines.append(f" - XAI Diagnosis: Numeric mismatch detected.")
                lines.append(f"   (Claim stated: {claim_nums}, but Evidence stated: {evidence_nums})")
            # 2. Fallback to standard deviation tracking
            elif numeric_deviation != -1.0 and numeric_deviation > 0.0:
                dev_pct = numeric_deviation * 100.0
                lines.append(f" - XAI Diagnosis: The evidence differs numerically by {dev_pct:.1f}%.")
            # 3. Categorical mismatch
            else:
                lines.append(" - XAI Diagnosis: The text contains a categorical or contextual contradiction.")
                lines.append(f"   (Evidence retrieved: \"{evidence_text[:100]}...\")")
        
        elif supports and numeric_deviation == 0.0:
             lines.append(f" - XAI Diagnosis: The numeric values match exactly.")
                
    # Final Score & Decision
    lines.append(f"Decision: {decision} (Trust Score: {trust_score:.1f}/100)")
    
    return "\n".join(lines)
