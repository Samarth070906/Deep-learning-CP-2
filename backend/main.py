import sys
import os
import shutil
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List

from backend import models, database
from trustagent.pipeline.run import run_pipeline
from trustagent.pipeline.claim_extractor import extract_claims, extract_text_from_pdf

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="TrustAgent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class VerifyRequest(BaseModel):
    agent_response: str
    context: Dict[str, Any]

class VerifyMultiRequest(BaseModel):
    """Request with long text that needs claim extraction."""
    agent_output: str
    context: Dict[str, Any]

# ── Original single-claim endpoint (backward compatible) ──────────────
@app.post("/verify")
def verify_claim(req: VerifyRequest, db: Session = Depends(get_db)):
    try:
        result = run_pipeline(req.agent_response, req.context)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        record = models.VerificationRecord(
            claim=req.agent_response,
            context_data=req.context,
            trust_score=result["trust_score"],
            decision=result["decision"],
            explanation=result["explanation"],
            claims_output=result["claims"]
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# ── Multi-claim verification (text input) ─────────────────────────────
@app.post("/verify/multi")
def verify_multi_claims(req: VerifyMultiRequest, db: Session = Depends(get_db)):
    """
    Accepts a long agent output, extracts individual claims using spaCy,
    then verifies each claim independently and returns a combined report.
    """
    try:
        # Step 1: Extract claims
        claims = extract_claims(req.agent_output)
        
        if not claims:
            raise HTTPException(
                status_code=400,
                detail="No verifiable claims could be extracted from the input text. "
                       "Make sure the text mentions known products with specific attributes."
            )
        
        # Step 2: Verify each claim
        claim_results = []
        for claim_text in claims:
            result = run_pipeline(claim_text, req.context)
            claim_results.append({
                "extracted_claim": claim_text,
                "result": result
            })
        
        # Step 3: Compute aggregate metrics
        valid_results = [cr for cr in claim_results if "error" not in cr["result"]]
        
        if not valid_results:
            raise HTTPException(status_code=400, detail="All extracted claims failed verification.")
        
        trust_scores = [cr["result"]["trust_score"] for cr in valid_results]
        avg_trust_score = sum(trust_scores) / len(trust_scores)
        min_trust_score = min(trust_scores)
        
        decisions = [cr["result"]["decision"] for cr in valid_results]
        if "BLOCK" in decisions:
            overall_decision = "BLOCK"
        elif "HUMAN_REVIEW" in decisions:
            overall_decision = "HUMAN_REVIEW"
        else:
            overall_decision = "APPROVE"
        
        # Step 4: Build combined report
        combined_report = {
            "input_text": req.agent_output,
            "total_claims_extracted": len(claims),
            "total_claims_verified": len(valid_results),
            "overall_trust_score": float(f"{avg_trust_score:.2f}"),
            "min_trust_score": float(f"{min_trust_score:.2f}"),
            "overall_decision": overall_decision,
            "decision_summary": {
                "APPROVE": decisions.count("APPROVE"),
                "HUMAN_REVIEW": decisions.count("HUMAN_REVIEW"),
                "BLOCK": decisions.count("BLOCK"),
            },
            "per_claim_results": claim_results,
        }
        
        # Step 5: Save to database
        record = models.VerificationRecord(
            claim=req.agent_output[:500],  # Truncate for DB
            context_data=req.context,
            trust_score=avg_trust_score,
            decision=overall_decision,
            explanation=f"Verified {len(valid_results)} claims. "
                        f"Overall: {overall_decision} (avg score: {avg_trust_score:.1f})",
            claims_output=claim_results
        )
        db.add(record)
        db.commit()
        
        return combined_report
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# ── PDF upload endpoint ───────────────────────────────────────────────
@app.post("/verify/pdf")
async def verify_pdf(
    file: UploadFile = File(...),
    unit: str = Form(""),
    visually_verifiable: bool = Form(False),
    source_reliability: float = Form(0.5),
    action_risk: float = Form(0.5),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF containing AI agent output.
    Extracts text, splits into claims, verifies each.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Save uploaded file to temp location
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, file.filename)
    
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract text from PDF
        extracted_text = extract_text_from_pdf(tmp_path)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the PDF.")
        
        # Extract claims
        claims = extract_claims(extracted_text)
        
        if not claims:
            raise HTTPException(
                status_code=400,
                detail="No verifiable claims found in the PDF. "
                       "Make sure it mentions known products with specific attributes."
            )
        
        context = {
            "unit": unit,
            "visually_verifiable": visually_verifiable,
            "source_reliability": source_reliability,
            "action_risk": action_risk,
        }
        
        # Verify each claim
        claim_results = []
        for claim_text in claims:
            result = run_pipeline(claim_text, context)
            claim_results.append({
                "extracted_claim": claim_text,
                "result": result
            })
        
        valid_results = [cr for cr in claim_results if "error" not in cr["result"]]
        
        if not valid_results:
            raise HTTPException(status_code=400, detail="All extracted claims failed verification.")
        
        trust_scores = [cr["result"]["trust_score"] for cr in valid_results]
        avg_trust_score = sum(trust_scores) / len(trust_scores)
        min_trust_score = min(trust_scores)
        
        decisions = [cr["result"]["decision"] for cr in valid_results]
        if "BLOCK" in decisions:
            overall_decision = "BLOCK"
        elif "HUMAN_REVIEW" in decisions:
            overall_decision = "HUMAN_REVIEW"
        else:
            overall_decision = "APPROVE"
        
        combined_report = {
            "source": f"PDF: {file.filename}",
            "extracted_text_preview": extracted_text[:500] + ("..." if len(extracted_text) > 500 else ""),
            "total_claims_extracted": len(claims),
            "total_claims_verified": len(valid_results),
            "overall_trust_score": float(f"{avg_trust_score:.2f}"),
            "min_trust_score": float(f"{min_trust_score:.2f}"),
            "overall_decision": overall_decision,
            "decision_summary": {
                "APPROVE": decisions.count("APPROVE"),
                "HUMAN_REVIEW": decisions.count("HUMAN_REVIEW"),
                "BLOCK": decisions.count("BLOCK"),
            },
            "per_claim_results": claim_results,
        }
        
        # Save to database
        record = models.VerificationRecord(
            claim=f"[PDF: {file.filename}] {extracted_text[:300]}",
            context_data=context,
            trust_score=avg_trust_score,
            decision=overall_decision,
            explanation=f"PDF '{file.filename}': Verified {len(valid_results)} claims. "
                        f"Overall: {overall_decision} (avg score: {avg_trust_score:.1f})",
            claims_output=claim_results
        )
        db.add(record)
        db.commit()
        
        return combined_report
        
    finally:
        # Clean up temp files
        shutil.rmtree(tmp_dir, ignore_errors=True)

# ── Claim extraction preview (useful for debugging) ───────────────────
@app.post("/extract-claims")
def preview_claims(req: VerifyMultiRequest):
    """Preview which claims would be extracted from the text (no verification)."""
    claims = extract_claims(req.agent_output)
    return {
        "input_text": req.agent_output,
        "extracted_claims": claims,
        "count": len(claims),
    }

@app.get("/history")
def get_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = db.query(models.VerificationRecord).order_by(models.VerificationRecord.created_at.desc()).offset(skip).limit(limit).all()
    return records
