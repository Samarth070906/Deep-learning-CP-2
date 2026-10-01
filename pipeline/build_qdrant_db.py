import time
from pathlib import Path
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
QDRANT_DIR = BASE_DIR / "data" / "qdrant_db"
QDRANT_DIR.mkdir(parents=True, exist_ok=True)

# 1. Initialize Qdrant (Serverless Local Disk Mode)
print("Initializing Qdrant Vector Database...")
client = QdrantClient(path=str(QDRANT_DIR))

# Create collection if it doesn't exist
COLLECTION_NAME = "products"
if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )
    print(f"Created new collection: {COLLECTION_NAME}")

# 2. Load the Dataset in Streaming Mode (Prevents RAM crashes for millions of rows)
print("Connecting to Hugging Face dataset stream (Electronics Category)...")
dataset = load_dataset("McAuley-Lab/Amazon-Reviews-2023", "raw_meta_Electronics", split="full", streaming=True, trust_remote_code=True)

# 3. Load Embedding Model onto your RTX 2050
print("Loading MiniLM model onto GPU...")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', device='cuda')

# Configuration for processing
TARGET_COUNT = 1000000  # 1 Million products
BATCH_SIZE = 64         # Safe batch size for 4GB VRAM
batch_texts = []
batch_payloads = []
processed_count = 0
start_time = time.time()

print(f"Beginning to stream and embed up to {TARGET_COUNT} products...")

try:
    for i, item in enumerate(dataset):
        if processed_count >= TARGET_COUNT:
            break
            
        title = item.get('title', f"Product_{i}")
        price = item.get('price', "Unknown")
        
        # Safely extract description
        description = item.get('description', [])
        if isinstance(description, list) and len(description) > 0:
            desc_text = description[0]
        elif isinstance(description, str):
            desc_text = description
        else:
            desc_text = title
            
        # Create the ground-truth text
        evidence_text = f"The price of {title} is {price}. Description: {desc_text}"
        
        # Prepare metadata (payload) for Qdrant
        payload = {
            "record_id": f"amazon_{i}",
            "entity": title,
            "attribute": "general",
            "domain": "e-commerce",
            "label": "CONSISTENT",
            "text": evidence_text,
            "image_path": "",
            "visually_verifiable": False
        }
        
        batch_texts.append(evidence_text)
        batch_payloads.append(payload)
        
        # When batch is full, embed and upload to Qdrant
        if len(batch_texts) >= BATCH_SIZE:
            # Generate vectors
            embeddings = model.encode(batch_texts, show_progress_bar=False, convert_to_numpy=True)
            
            # Create Qdrant Points
            points = [
                PointStruct(
                    id=processed_count + j,
                    vector=embeddings[j].tolist(),
                    payload=batch_payloads[j]
                )
                for j in range(len(batch_texts))
            ]
            
            # Upload to Qdrant
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
            
            processed_count += len(batch_texts)
            batch_texts = []
            batch_payloads = []
            
            # Print progress every 1000 items
            if processed_count % 1000 == 0 or processed_count == BATCH_SIZE:
                elapsed = time.time() - start_time
                rate = processed_count / elapsed
                print(f"Processed {processed_count}/{TARGET_COUNT} products | Rate: {rate:.1f} items/sec")

    # Process any remaining items in the last partial batch
    if batch_texts:
        embeddings = model.encode(batch_texts, show_progress_bar=False, convert_to_numpy=True)
        points = [
            PointStruct(id=processed_count + j, vector=embeddings[j].tolist(), payload=batch_payloads[j])
            for j in range(len(batch_texts))
        ]
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        processed_count += len(batch_texts)

except KeyboardInterrupt:
    print("\nProcess interrupted by user. Saved progress to database.")

print(f"\nSuccess! Embedded and saved {processed_count} products to Qdrant local database.")
print(f"Total time: {(time.time() - start_time) / 60:.1f} minutes")
