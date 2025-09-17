from flask import Flask, render_template, request, send_from_directory, jsonify
from dotenv import load_dotenv
import os

# 🔹 Lazy imports (heavy modules)
chatModel = None
docsearch = None
retriever = None

# 🔹 Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")

# ------------------ Load environment variables ------------------ #
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GCP_PROJECT = os.getenv("GCP_PROJECT", "marine-fusion-471317-u6")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY or ""
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY or ""
if GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS

# ------------------ Serve React frontend ------------------ #
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return render_template("index.html")

# ------------------ Chat API ------------------ #
@app.route("/get", methods=["POST"])
def chat():
    global chatModel, docsearch, retriever

    # Lazy-load heavy modules only on first request
    if chatModel is None:
        from langchain_openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
        from langchain.chains import create_retrieval_chain
        from langchain.chains.combine_documents import create_stuff_documents_chain
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_google_vertexai import ChatVertexAI
        from src.prompt import system_prompt1, system_prompt2
        from src.chat_memory import load_memory, save_memory

        # 🔹 Embeddings
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=OPENAI_API_KEY)

        # 🔹 Pinecone Vectorstore
        chat_index_name = "medical-chatbot"
        docsearch = PineconeVectorStore.from_existing_index(index_name=chat_index_name, embedding=embeddings)
        retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})

        # 🔹 Chat Model
        chatModel = ChatVertexAI(model="gemini-2.5-flash", project=GCP_PROJECT, location=GCP_LOCATION, temperature=0.3)

        # 🔹 Save these for endpoint use
        app.config["system_prompt1"] = system_prompt1
        app.config["system_prompt2"] = system_prompt2
        app.config["load_memory"] = load_memory
        app.config["save_memory"] = save_memory
        app.config["create_stuff_documents_chain"] = create_stuff_documents_chain
        app.config["create_retrieval_chain"] = create_retrieval_chain
        app.config["ChatPromptTemplate"] = ChatPromptTemplate

    # ------------------ Handle Request ------------------ #
    msg = request.form["msg"]
    username = request.form.get("username", "guest")
    mode = request.form.get("mode", "friend")

    load_memory = app.config["load_memory"]
    save_memory = app.config["save_memory"]
    create_stuff_documents_chain = app.config["create_stuff_documents_chain"]
    create_retrieval_chain = app.config["create_retrieval_chain"]
    ChatPromptTemplate = app.config["ChatPromptTemplate"]
    system_prompt1 = app.config["system_prompt1"]
    system_prompt2 = app.config["system_prompt2"]

    memory = load_memory(username)
    memory_context = "\n".join([f"{m['role']}: {m['content']}" for m in memory])

    selected_prompt = system_prompt2 if mode == "therapist" else system_prompt1

    prompt = ChatPromptTemplate.from_messages([
        ("system", selected_prompt + "\n\nConversation history:\n" + memory_context),
        ("human", "{input}"),
    ])

    question_answer_chain = create_stuff_documents_chain(chatModel, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    response = rag_chain.invoke({"input": msg})
    answer = response["answer"]

    memory.append({"role": "user", "content": msg})
    memory.append({"role": "assistant", "content": answer})
    save_memory(username, memory)

    return jsonify({"response": answer})

# ------------------ Note ------------------ #
# Do NOT include app.run() when using Gunicorn on Render
# Run with: gunicorn app:app --bind 0.0.0.0:$PORT --workers 4
# It will run with
# export FLASK_APP=app.py
# flask run --host=0.0.0.0 --port=8080