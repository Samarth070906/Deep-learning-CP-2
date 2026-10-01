#!/usr/bin/env python
"""Embedding utilities for TrustAgent evidence retrieval.

Uses sentence-transformers/all-MiniLM-L6-v2 to produce 384-dim L2-normalised
embeddings.  Embeddings for the generated dataset are computed once and cached
to ``<data_dir>/embeddings.npy`` alongside a JSON manifest that maps each
embedding row back to the original record_id.  Subsequent calls load from
cache unless ``force_recompute=True``.

Design note
-----------
The model's ``.encode()`` call already L2-normalises when we pass
``normalize_embeddings=True``.  Normalised vectors let us use FAISS
``IndexFlatIP`` so that inner-product == cosine similarity — simpler
scoring semantics than raw L2 distance.
"""

import json
import os
from pathlib import Path
from typing import List, Optional

import numpy as np

# Lazy-loaded to avoid heavy imports until actually needed
_model = None

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


def _get_model():
    """Return (and cache) the SentenceTransformer model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: List[str], batch_size: int = 64) -> np.ndarray:
    """Embed a list of strings and return an (N, 384) float32 array.

    Embeddings are L2-normalised so inner-product == cosine similarity.
    """
    model = _get_model()
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=False,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return embeddings.astype(np.float32)


def embed_query(text: str) -> np.ndarray:
    """Embed a single query string.  Returns shape (1, 384)."""
    return embed_texts([text])


