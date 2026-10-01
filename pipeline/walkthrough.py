"""
TrustAgent: End-to-End Pipeline Walkthrough
============================================
Domain: Electronics | Product: GameStation X1
Traces a single claim through ALL 6 pipeline stages with intermediate outputs.
"""

import sys
import json
import torch
import hashlib
import random
from pathlib import Path

# Setup path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

print("=" * 70)
print("  TrustAgent Pipeline Walkthrough")
print("  Domain: Electronics | Product: GameStation X1")
print("=" * 70)

# ── Ground Truth (from seed_data.py) ──────────────────────────────────
print("\n📦 GROUND TRUTH (from seed_data.py)")
print("-" * 50)
from trustagent.data.generator.seed_data import data as seed_data

gamestation = None
for product in seed_data:
    if product["entity"] == "GameStation X1":
        gamestation = product
        break

for attr_name, attr_data in gamestation["attributes"].items():
    vis = "👁️ visual" if attr_data["visually_verifiable"] else "📝 numeric"
    print(f"  {attr_name:15s} = {attr_data['value']:>8s} {attr_data['unit']:5s}  ({vis})")

# ── Pick a claim to verify ────────────────────────────────────────────
claim_text = "Price of GameStation X1 is 499 USD."
context = {
    "unit": "USD",
    "visually_verifiable": False,
    "source_reliability": 0.9,
    "action_risk": 0.2
}

print(f"\n🎯 CLAIM TO VERIFY:")
print(f'   "{claim_text}"')
print(f"   Context: unit={context['unit']}, visually_verifiable={context['visually_verifiable']}")
print(f"   source_reliability={context['source_reliability']}, action_risk={context['action_risk']}")

# ═══════════════════════════════════════════════════════════════════════
# STAGE 1: RETRIEVAL (FAISS + MiniLM)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  STAGE 1: RETRIEVAL (sentence-transformers/all-MiniLM-L6-v2 + FAISS)")
print("=" * 70)

from trustagent.retrieval.retrieve import retrieve

top_results = retrieve(claim_text, k=3)

print(f"\n  Query: \"{claim_text}\"")
print(f"  Top-{len(top_results)} retrieved results:\n")

for rank, result in enumerate(top_results, 1):
    rec = result["record"]
    sim = result["score"]
    print(f"  #{rank} [score={sim:.4f}] {rec['record_id']}")
    print(f"     Entity: {rec['entity']} | Attr: {rec['attribute']} | Label: {rec['label']}")
    print(f"     Text: \"{rec['sources']['text']}\"")
    print(f"     Image: {rec['sources']['image_path']}")
    print()

# Use the best match
best_record = top_results[0]["record"]
evidence_text = best_record["sources"]["text"]
image_path = best_record["sources"]["image_path"]

print(f"  ✅ Selected evidence text: \"{evidence_text}\"")
print(f"  ✅ Selected image path: {image_path}")

# ═══════════════════════════════════════════════════════════════════════
# STAGE 2: TEXT VERIFICATION (DeBERTa v3 NLI)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  STAGE 2: TEXT VERIFICATION (cross-encoder/nli-deberta-v3-base)")
print("=" * 70)

from trustagent.models.text_verifier.verifier import verify_text

t_label, t_score = verify_text(claim_text, evidence_text)

print(f"\n  Premise (claim):    \"{claim_text}\"")
print(f"  Hypothesis (evid):  \"{evidence_text}\"")
print(f"  ──────────────────────────────────────────")
print(f"  NLI Label:  {t_label}")
print(f"  Confidence: {t_score:.4f}")

# ═══════════════════════════════════════════════════════════════════════
# STAGE 3: IMAGE VERIFICATION (CLIP ViT-B/32)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  STAGE 3: IMAGE VERIFICATION (openai/clip-vit-base-patch32)")
print("=" * 70)

from trustagent.models.image_verifier.verifier import verify_image

visually_verifiable = context.get("visually_verifiable", False)
i_label, i_score = verify_image(claim_text, image_path, visually_verifiable=visually_verifiable)

print(f"\n  Claim: \"{claim_text}\"")
print(f"  Image: {image_path}")
print(f"  Visually verifiable: {visually_verifiable}")
print(f"  ──────────────────────────────────────────")
print(f"  CLIP Label:        {i_label}")
print(f"  Cosine Similarity: {i_score:.4f}")

if not visually_verifiable:
    print(f"  ⚠️  Price is NOT visually verifiable → returns NO_EVIDENCE (by design)")

# ═══════════════════════════════════════════════════════════════════════
# STAGE 4: CONSISTENCY NET (Multi-Modal Fusion)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  STAGE 4: CONSISTENCY NET (custom MLP, 5→64→32→1)")
print("=" * 70)

from trustagent.models.consistency_net.features import build_features
from trustagent.models.consistency_net.model import MultiModalConsistencyNet

features = build_features(t_label, t_score, i_label, i_score)

print(f"\n  Feature vector: {features}")
print(f"    [0] text_score:            {features[0]:.4f}")
print(f"    [1] image_score:           {features[1]:.4f}")
print(f"    [2] num_modalities:        {features[2]:.0f}")
print(f"    [3] pairwise_disagreement: {features[3]:.0f}")
print(f"    [4] evidence_available:    {features[4]:.0f}")

cons_net = MultiModalConsistencyNet(input_dim=5, hidden_dim=64)
cons_net.load_state_dict(torch.load("d:/Third Year/DL/CP/trustagent/models/consistency_net/checkpoint.pt"))
cons_net.eval()

features_tensor = torch.tensor([features], dtype=torch.float32)
with torch.no_grad():
    c_score = cons_net(features_tensor).item()

print(f"  ──────────────────────────────────────────")
print(f"  Consistency Score: {c_score:.4f}")
print(f"  Interpretation: {'Consistent ✅' if c_score > 0.5 else 'Inconsistent ❌'}")

# ═══════════════════════════════════════════════════════════════════════
# STAGE 5: TRUST SCORE NET (Final Score)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  STAGE 5: TRUST SCORE NET (custom MLP, 6→16→16→1)")
print("=" * 70)

from trustagent.models.trust_score_net.numeric_parser import get_numeric_deviation
from trustagent.models.trust_score_net.train import TrustScoreNet

num_dev = get_numeric_deviation(claim_text, evidence_text, context.get("unit", ""))

evidence_available = features[4]
h = int(hashlib.md5(claim_text.encode()).hexdigest(), 16)
random.seed(h)
avg_conf = random.uniform(0.7, 1.0) if evidence_available else 0.0

source_reliability = context.get("source_reliability", 0.5)
action_risk = context.get("action_risk", 0.5)

ts_features = [c_score, evidence_available, avg_conf, source_reliability, action_risk, num_dev]

print(f"\n  Feature vector: {[f'{x:.4f}' for x in ts_features]}")
print(f"    [0] consistency_score:  {c_score:.4f}")
print(f"    [1] evidence_available: {evidence_available:.0f}")
print(f"    [2] avg_confidence:     {avg_conf:.4f}")
print(f"    [3] source_reliability: {source_reliability:.1f}")
print(f"    [4] action_risk:        {action_risk:.1f}")
print(f"    [5] numeric_deviation:  {num_dev:.4f}")

ts_net = TrustScoreNet()
ts_net.load_state_dict(torch.load("d:/Third Year/DL/CP/trustagent/models/trust_score_net/checkpoint.pt"))
ts_net.eval()

ts_tensor = torch.tensor([ts_features], dtype=torch.float32)
with torch.no_grad():
    trust_score = ts_net(ts_tensor).item()

print(f"  ──────────────────────────────────────────")
print(f"  Trust Score: {trust_score:.2f} / 100")

# ═══════════════════════════════════════════════════════════════════════
# STAGE 6: DECISION + EXPLANATION
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  STAGE 6: DECISION + EXPLANATION")
print("=" * 70)

from trustagent.pipeline.decision import get_decision
from trustagent.pipeline.explain import generate_explanation

decision = get_decision(trust_score, num_dev, t_label, i_label)

explanation = generate_explanation(
    claim_text=claim_text,
    t_label=t_label,
    t_score=t_score,
    i_label=i_label,
    i_score=i_score,
    numeric_deviation=num_dev,
    consistency_score=c_score,
    trust_score=trust_score,
    decision=decision
)

print(f"\n  Decision: {decision}")
print(f"\n  Explanation:")
for line in explanation.split("\n"):
    print(f"    {line}")

# ═══════════════════════════════════════════════════════════════════════
# FINAL API RESPONSE
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("  FINAL API RESPONSE (what /verify returns)")
print("=" * 70)

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
                "text": {"label": t_label, "score": round(t_score, 4)},
                "image": {"label": i_label, "score": round(i_score, 4)}
            },
            "numeric_deviation": num_dev,
            "consistency_score": round(c_score, 4)
        }
    ],
    "metadata": {
        "source_reliability": source_reliability,
        "action_risk": action_risk
    }
}

print(f"\n{json.dumps(result, indent=2)}")
print("\n" + "=" * 70)
print("  WALKTHROUGH COMPLETE ✅")
print("=" * 70)
