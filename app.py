from flask import Flask, render_template, jsonify, request
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import system_prompt1, system_prompt2
from datetime import datetime
import os, uuid

# 🔹 Import memory helpers
from src.chat_memory import load_memory, save_memory

# 🔹 Vertex AI imports
from google.cloud import aiplatform
from langchain_google_vertexai import ChatVertexAI

app = Flask(__name__)

# ------------------ Load Keys ------------------ #
load_dotenv()

# Pinecone + OpenAI
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY or ""
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY or ""

# Vertex AI
GCP_PROJECT = os.getenv("GCP_PROJECT", "marine-fusion-471317-u6")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# ✅ Ensure service account path is set for Vertex AI
if GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS

# ------------------ Embeddings ------------------ #
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=OPENAI_API_KEY
)

# ------------------ Pinecone Vectorstores ------------------ #
chat_index_name = "medical-chatbot"
docsearch = PineconeVectorStore.from_existing_index(
    index_name=chat_index_name,
    embedding=embeddings
)
retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})

journal_index_name = "journal-index"
journal_store = PineconeVectorStore.from_existing_index(
    index_name=journal_index_name,
    embedding=embeddings
)

# ------------------ Chat Model (Vertex AI Gemini) ------------------ #
chatModel = ChatVertexAI(
    model="gemini-2.5-flash",
    project=GCP_PROJECT,
    location=GCP_LOCATION,
    temperature=0.3
)

# ------------------ Routes ------------------ #
@app.route("/")
def index():
    return render_template("chat.html")

# ------------------ Chat ------------------ #
@app.route("/get", methods=["POST"])
def chat():
    msg = request.form["msg"]
    username = request.form.get("username", "guest")
    mode = request.form.get("mode", "friend")
    print(f"User: {msg} | Mode: {mode} | Username: {username}")

    memory = load_memory(username)
    memory_context = "\n".join([f"{m['role']}: {m['content']}" for m in memory])

    selected_prompt = system_prompt2 if mode == "therapist" else system_prompt1

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", selected_prompt + "\n\nConversation history:\n" + memory_context),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(chatModel, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    response = rag_chain.invoke({"input": msg})
    answer = response["answer"]

    memory.append({"role": "user", "content": msg})
    memory.append({"role": "assistant", "content": answer})
    save_memory(username, memory)

    print("Response:", answer)
    return str(answer)

# ------------------ Journal System ------------------ #
@app.route("/save_journal", methods=["POST"])
def save_journal():
    username = request.form["username"]
    entry = request.form["entry"]

    entry_id = f"{username}-{uuid.uuid4().hex}"
    vector = embeddings.embed_query(entry)

    journal_store._index.upsert([
        {
            "id": entry_id,
            "values": vector,
            "metadata": {
                "username": username,
                "text": entry,
                "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
        }
    ])

    return jsonify({"status": "success", "message": "Journal entry saved."})

@app.route("/get_journal", methods=["GET"])
def get_journal():
    username = request.args.get("username")

    results = journal_store._index.query(
        top_k=20,
        vector=[0] * 1536,  # dummy vector to filter only
        filter={"username": {"$eq": username}},
        include_metadata=True
    )

    journals = [
        {
            "text": match["metadata"]["text"],
            "date": match["metadata"]["date"]
        }
        for match in results["matches"]
    ]

    journals = sorted(journals, key=lambda x: x["date"], reverse=True)
    return jsonify(journals)

# ------------------ Run Server ------------------ #
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)