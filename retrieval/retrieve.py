#!/usr/bin/env python
"""Core retrieval function for TrustAgent.

``retrieve(claim_text, k=3)`` embeds the input claim and returns the top-k
most similar source records from the generated dataset, together with their
cosine-similarity scores.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

from .embed import embed_query


def retrieve(
    claim_text: str,
    k: int = 3,
    data_path: Optional[str] = None,
    index_path: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Return the top-k most similar source records for an input claim."""
    from .web_search import search_live_web
    
    # 1. First, check if Qdrant massive database is built
    qdrant_dir = Path(__file__).resolve().parent.parent / "data" / "qdrant_db"
    
    if qdrant_dir.exists():
        from qdrant_client import QdrantClient
        client = QdrantClient(path=str(qdrant_dir))
        
        if client.collection_exists("products"):
            query_emb = embed_query(claim_text)[0].tolist()
            hits = client.query_points(collection_name="products", query=query_emb, limit=k).points
            
            # If Qdrant finds a strong match, return it
            if hits and hits[0].score >= 0.50:
                print(f"  [Qdrant] Found match with score {hits[0].score:.2f}")
                return [{"record": h.payload, "score": h.score, "rank": r} for r, h in enumerate(hits, 1)]
            
            # Else, trigger Web Fallback
            print(f"  [Hybrid Fallback] Qdrant score too low ({hits[0].score if hits else 0}). Triggering Web Search...")
            web_record = search_live_web(claim_text)
            return [{"record": web_record, "score": 1.0, "rank": 1}]

    # 2. If Qdrant isn't ready or missing collection
    print(f"  [Hybrid Fallback] Qdrant DB not found or missing 'products'. Triggering Web Search...")
    web_record = search_live_web(claim_text)
    return [{"record": web_record, "score": 1.0, "rank": 1}]

