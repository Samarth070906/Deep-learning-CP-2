import sys
from duckduckgo_search import DDGS
from typing import Dict, Any

def search_live_web(query: str, domain: str = "amazon.com") -> Dict[str, Any]:
    """
    Fallback mechanism: searches the live web using DuckDuckGo when
    the local vector database fails to find a high-confidence match.
    
    Args:
        query: The claim text to search for
        domain: The domain to restrict search to (e.g., 'amazon.com')
    """
    print(f"  [Fallback] Querying DuckDuckGo for: '{query}'")
    
    # We append the site operator to only trust specific websites
    search_query = f"{query} site:{domain}"
    
    combined_text = ""
    try:
        with DDGS() as ddgs:
            # Get top 3 search results
            results = list(ddgs.text(search_query, max_results=3))
            
            if not results:
                print("  [Fallback] No results found on web.")
                return {
                    "record_id": "web_search_failed",
                    "entity": "Unknown",
                    "attribute": "general",
                    "domain": "web",
                    "label": "NO_EVIDENCE",
                    "sources": {
                        "text": "No evidence could be found on the internet.",
                        "image_path": "",
                        "document_excerpt": None
                    },
                    "visually_verifiable": False
                }
                
            print(f"  [Fallback] Found {len(results)} results from {domain}.")
            
            # Combine snippets into a single paragraph
            snippets = [r.get('body', '') for r in results]
            combined_text = " ".join(snippets)
            
    except Exception as e:
        print(f"  [Fallback] Web search failed: {e}")
        combined_text = "Web search failed."
        
    # Format the web result exactly like a database record
    return {
        "record_id": "web_search_result",
        "entity": "Web Search Entity",
        "attribute": "general",
        "domain": "web",
        "label": "CONSISTENT",  # Treat web text as ground truth
        "sources": {
            "text": combined_text,
            "image_path": "",
            "document_excerpt": None
        },
        "visually_verifiable": False
    }

if __name__ == "__main__":
    # Quick test
    res = search_live_web("price of iPhone 16 Pro Max", "apple.com")
    print(res["sources"]["text"])
