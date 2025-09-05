# src/chat_memory.py
import os
import json
from datetime import datetime

# Directory where histories will be stored
HISTORY_DIR = "chat_histories"
os.makedirs(HISTORY_DIR, exist_ok=True)


def _safe_username(username: str) -> str:
    """Sanitize username for filesystem safety."""
    return "".join(ch if ch.isalnum() or ch in ("_", "-") else "_" for ch in username.strip()) or "guest"


def _get_file_path(username: str) -> str:
    """Return the path for the user's history file."""
    return os.path.join(HISTORY_DIR, f"{_safe_username(username)}.json")


def load_memory(username: str):
    """
    Load chat memory for a given username.
    Returns a list of messages: [{role: 'user'|'assistant', content: str, timestamp: str}, ...]
    """
    path = _get_file_path(username)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure structure
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []


def save_memory(username: str, messages):
    """
    Save the full message list for a user.
    messages should be a list of dicts with keys: role, content, timestamp (optional).
    """
    # Normalize messages: add timestamp if missing
    normalized = []
    for m in messages:
        if "timestamp" not in m:
            m = {
                "role": m.get("role", "user"),
                "content": m.get("content", ""),
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            }
        normalized.append(m)

    path = _get_file_path(username)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)


def clear_memory(username: str):
    """Delete the user's memory file, if it exists."""
    path = _get_file_path(username)
    if os.path.exists(path):
        os.remove(path)
