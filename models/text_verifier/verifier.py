import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

_model_name = "cross-encoder/nli-deberta-v3-base" 
_tokenizer = None
_model = None

def _get_model():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(_model_name)
        _model = AutoModelForSequenceClassification.from_pretrained(_model_name)
        _model.eval()
    return _tokenizer, _model

def verify_text(claim: str, evidence_text: str) -> tuple[str, float]:
    """
    Verifies a claim against textual evidence using zero-shot NLI.
    
    Returns:
        (label, score)
        label is one of: "SUPPORT", "CONTRADICT", "NO_EVIDENCE"
    """
    if not evidence_text:
        return "NO_EVIDENCE", 0.0

    tokenizer, model = _get_model()
    
    features = tokenizer(claim, evidence_text, padding=True, truncation=True, return_tensors="pt")
    
    with torch.no_grad():
        scores = model(**features).logits
        
    # cross-encoder/nli-deberta-v3-base labels: 0: contradiction, 1: entailment, 2: neutral
    probs = torch.nn.functional.softmax(scores, dim=1)[0]
    
    prob_contradiction = probs[0].item()
    prob_entailment = probs[1].item()
    prob_neutral = probs[2].item()
    
    # ----------------------------------------------------
    # UPGRADE B: Risk-Averse Safety Thresholding
    # ----------------------------------------------------
    # If there is even a 25% chance that the AI claim is a hallucination
    # or contradicts the evidence, we immediately flag it as a contradiction
    # to force a HUMAN_REVIEW. This is critical for enterprise safety.
    CONTRADICTION_THRESHOLD = 0.25
    
    if prob_contradiction >= CONTRADICTION_THRESHOLD:
        return "CONTRADICT", prob_contradiction
    elif prob_entailment > prob_neutral:
        return "SUPPORT", prob_entailment
    else:
        return "NO_EVIDENCE", prob_neutral
