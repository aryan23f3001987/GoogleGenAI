# src/sentiment.py
from datetime import datetime, timedelta
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
import os, json
from dotenv import load_dotenv

# ------------------ Setup ------------------ #

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY or ""

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")
)

# Load Journal index
journal_index_name = "journal-index"   # make sure this matches your Pinecone index
journal_store = PineconeVectorStore.from_existing_index(
    index_name=journal_index_name,
    embedding=embeddings
)

# Chat model for analysis
chatModel = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.getenv("OPENAI_API_KEY")
)

# ------------------ Functions ------------------ #
def get_weekly_journals(username: str, days: int = 7):
    """
    Fetch journal entries for the last `days` (default: 7) for a given user.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    results = journal_store._index.query(
        top_k=100,
        vector=[0] * 1536,   # dummy vector (we filter by username only)
        filter={"username": {"$eq": username}},
        include_metadata=True
    )

    recent_entries = []
    for match in results.get("matches", []):
        meta = match.get("metadata", {})
        try:
            entry_date = datetime.strptime(meta["date"], "%Y-%m-%d %H:%M:%S")
            if entry_date >= cutoff:
                recent_entries.append(meta["text"])
        except Exception:
            continue

    return recent_entries


def average_sentiment(entries: list):
    """
    Given a list of journal entries, analyze and return sentiment score + summary.
    """
    if not entries:
        return {"score": None, "summary": "No journal entries this week."}

    combined_text = "\n".join(entries)

    prompt = f"""
    You are analyzing a user's journals from the past week.

    Journals:
    {combined_text}

    Task:
    - Return a sentiment score between 0 (very negative) and 1 (very positive).
    - Write a short summary (2-3 sentences) of the emotional state.

    Return strictly in JSON:
    {{
      "score": <number between 0 and 1>,
      "summary": "<short text>"
    }}
    """

    response = chatModel.invoke(prompt)

    try:
        result = json.loads(response.content)
    except Exception:
        result = {"score": None, "summary": response.content}

    return result
