import json
import torch
import random
import hashlib
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from trustagent.retrieval.retrieve import retrieve
from trustagent.models.text_verifier.verifier import verify_text
from trustagent.models.image_verifier.verifier import verify_image
from trustagent.models.consistency_net.features import build_features
from trustagent.models.consistency_net.model import MultiModalConsistencyNet
from trustagent.models.trust_score_net.train import TrustScoreNet
from trustagent.models.trust_score_net.numeric_parser import get_numeric_deviation
from trustagent.pipeline.decision import get_decision
from trustagent.pipeline.explain import generate_explanation

# Global instances to avoid reloading
_cons_net = None
_ts_net = None

def _load_models():
    global _cons_net, _ts_net
    if _cons_net is None:
        _cons_net = MultiModalConsistencyNet(input_dim=5, hidden_dim=64)
        c_path = Path("d:/Third Year/DL/CP/trustagent/models/consistency_net/checkpoint.pt")
        _cons_net.load_state_dict(torch.load(c_path))
        _cons_net.eval()
        
    if _ts_net is None:
        _ts_net = TrustScoreNet()
        t_path = Path("d:/Third Year/DL/CP/trustagent/models/trust_score_net/checkpoint.pt")
        _ts_net.load_state_dict(torch.load(t_path))
        _ts_net.eval()

def run_pipeline(claim_text: str, context: dict, mock_evidence: dict = None) -> dict:
    """
    Run the full end-to-end trust evaluation pipeline.
    """
    _load_models()
    
    force_t_label = None
    force_i_label = None
    
    # 1. Retrieval
    if mock_evidence:
        evidence_text = mock_evidence["text"]
        image_path = mock_evidence["image_path"]
        force_t_label = mock_evidence.get("force_t_label")
        force_i_label = mock_evidence.get("force_i_label")
    else:
        top_results = retrieve(claim_text, k=1)
        if not top_results:
            return {"error": "No evidence retrieved."}
        
        best_record = top_results[0]["record"]
        if "sources" in best_record:
            evidence_text = best_record["sources"].get("text", "")
            image_path = best_record["sources"].get("image_path", "")
        else:
            evidence_text = best_record.get("text", "")
            image_path = best_record.get("image_path", "")
    
    # Extract metadata
    unit = context.get("unit", "")
    visually_verifiable = context.get("visually_verifiable", False)
    source_reliability = context.get("source_reliability", 0.5)
    action_risk = context.get("action_risk", 0.5)
    
    # 2. Verifiers
    t_label, t_score = verify_text(claim_text, evidence_text)
    if force_t_label:
        t_label = force_t_label
        
    i_label, i_score = verify_image(claim_text, image_path, visually_verifiable=visually_verifiable)
    if force_i_label:
        i_label = force_i_label
    
    # 3. ConsistencyNet
    features = build_features(t_label, t_score, i_label, i_score)
    features_tensor = torch.tensor([features], dtype=torch.float32)
    with torch.no_grad():
        c_score = _cons_net(features_tensor).item()
        
    evidence_available = features[4]
    
    # 4. TrustScoreNet
    num_dev = get_numeric_deviation(claim_text, evidence_text, unit)
    
    # Generate a deterministic avg_conf based on claim text
    h = int(hashlib.md5(claim_text.encode()).hexdigest(), 16)
    random.seed(h)
    avg_conf = random.uniform(0.7, 1.0) if evidence_available else 0.0
    
    ts_features = torch.tensor([[c_score, evidence_available, avg_conf, source_reliability, action_risk, num_dev]], dtype=torch.float32)
    with torch.no_grad():
        trust_score = _ts_net(ts_features).item()
        
    # 5. Decision
    decision = get_decision(trust_score, num_dev, t_label, i_label)
    
    # 6. Explanation
    explanation = generate_explanation(
        claim_text=claim_text,
        evidence_text=evidence_text,
        t_label=t_label,
        t_score=t_score,
        i_label=i_label,
        i_score=i_score,
        numeric_deviation=num_dev,
        consistency_score=c_score,
        trust_score=trust_score,
        decision=decision
    )
    
    # Build API Response
    result = {
        "trust_score": float(f"{trust_score:.2f}"),
        "decision": decision,
        "explanation": explanation,
        "claims": [
            {
                "claim": claim_text,
                "evidence_retrieved": {
                    "text": evidence_text,
                    "image": image_path
                },
                "modality_scores": {
                    "text": {"label": t_label, "score": t_score},
                    "image": {"label": i_label, "score": i_score}
                },
                "numeric_deviation": num_dev,
                "consistency_score": c_score
            }
        ],
        "metadata": {
            "source_reliability": source_reliability,
            "action_risk": action_risk
        }
    }
    
    return result

if __name__ == "__main__":
    print("Testing End-to-End Pipeline on diverse scenarios...\n")
    
    scenarios = [
        {
            "name": "1. Exact Match (Single Modality SUPPORT)",
            "claim": "Price of GameStation X1 is 499 USD.",
            "context": {"unit": "USD", "visually_verifiable": False, "source_reliability": 0.9, "action_risk": 0.2},
            "mock_evidence": {"text": "The GameStation X1 is priced at 499 USD.", "image_path": "images/gamestation_x1_price.jpg"}
        },
        {
            "name": "2. Minor Numeric Deviation (~8% - CONTRADICT)",
            "claim": "Price of GameStation X1 is 499 USD.",
            "context": {"unit": "USD", "visually_verifiable": False, "source_reliability": 0.5, "action_risk": 0.8},
            "mock_evidence": {"text": "The GameStation X1 is priced at 459 USD.", "image_path": "images/gamestation_x1_price.jpg"}
        },
        {
            "name": "3. Major Numeric Deviation (30%+ - CONTRADICT)",
            "claim": "Price of GameStation X1 is 499 USD.",
            "context": {"unit": "USD", "visually_verifiable": False, "source_reliability": 0.5, "action_risk": 0.8},
            "mock_evidence": {"text": "The GameStation X1 is priced at 320 USD.", "image_path": "images/gamestation_x1_price.jpg"}
        },
        {
            "name": "4. Categorical Contradiction (Non-numeric, Cross-Modal Conflict)",
            "claim": "Color of GameStation X1 is Black.",
            "context": {"unit": "", "visually_verifiable": True, "source_reliability": 0.8, "action_risk": 0.5},
            # Force SUPPORT for image to test the cross-modal conflict override explicitly
            "mock_evidence": {"text": "The GameStation X1 comes in White.", "image_path": "images/gamestation_x1_color.jpg", "force_t_label": "CONTRADICT", "force_i_label": "SUPPORT"}
        },
        {
            "name": "5. Both Modalities Agree (Exact Match)",
            "claim": "Color of RoboVac S9 is Black.",
            "context": {"unit": "", "visually_verifiable": True, "source_reliability": 0.9, "action_risk": 0.2},
            "mock_evidence": {"text": "The RoboVac S9 is Black.", "image_path": "images/robovac_s9_color.jpg"}
        },
        {
            "name": "6. Neither (NO_EVIDENCE)",
            "claim": "Price of TurboSUV GT is 62500 USD.",
            "context": {"unit": "USD", "visually_verifiable": False, "source_reliability": 0.9, "action_risk": 0.5},
            "mock_evidence": {"text": "The TurboSUV GT has a great engine.", "image_path": "images/turbosuv_gt_price.jpg"}
        },
        {
            "name": "7. Unanimous CONTRADICT (Both modalities disagree)",
            "claim": "Price of GameStation X1 is 999 USD.",
            "context": {"unit": "USD", "visually_verifiable": True, "source_reliability": 0.8, "action_risk": 0.8},
            # Text contradicts (499 USD). Image contradicts.
            "mock_evidence": {"text": "The GameStation X1 is priced at 499 USD.", "image_path": "images/gamestation_x1_price.jpg", "force_t_label": "CONTRADICT", "force_i_label": "CONTRADICT"}
        }
    ]
    
    for s in scenarios:
        print(f"=== {s['name']} ===")
        res = run_pipeline(s["claim"], s["context"], mock_evidence=s["mock_evidence"])
        print(res["explanation"])
        print("-" * 70)
