# src/utils.py
from datetime import datetime, timedelta
import json

def get_weekly_journals(matches, days=7):
    """
    Given Pinecone matches, filter to only keep last `days` entries.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)
    entries = []
    for match in matches:
        meta = match.get("metadata", {})
        try:
            entry_date = datetime.strptime(meta["date"], "%Y-%m-%d %H:%M:%S")
            if entry_date >= cutoff:
                entries.append(meta["text"])
        except Exception:
            continue
    return entries


def average_sentiment_response(response_text):
    """
    Safely parse the LLM sentiment JSON response.
    """
    try:
        return json.loads(response_text)
    except Exception:
        return {"score": None, "summary": response_text}


def format_response(status="success", data=None, message=""):
    """
    Standardized API response wrapper.
    """
    return {
        "status": status,
        "data": data or {},
        "message": message
    }
