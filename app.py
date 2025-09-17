from flask import Flask, render_template, request, send_from_directory, jsonify
from dotenv import load_dotenv
import os
import sys

# ------------------ Globals ------------------ #
chatModel = None
docsearch = None
retriever = None

print("--> Starting application initialization...")
sys.stdout.flush()

# ------------------ Flask app ------------------ #
# Define the app early so it exists even if initialization fails.
app = Flask(__name__, static_folder="static", template_folder="templates")

try:
    # ------------------ Load environment variables ------------------ #
    print("--> Loading environment variables...")
    sys.stdout.flush()
    load_dotenv()
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GCP_PROJECT = os.getenv("GCP_PROJECT")
    GCP_LOCATION = os.getenv("GCP_LOCATION")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    # Check for essential variables
    if not all([PINECONE_API_KEY, OPENAI_API_KEY, GCP_PROJECT, GCP_LOCATION]):
        raise ValueError("One or more essential environment variables (PINECONE, OPENAI, GCP) are missing.")

    os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
    if GOOGLE_APPLICATION_CREDENTIALS:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
    print("--> Environment variables loaded.")
    sys.stdout.flush()

    # ------------------ Preload heavy modules at startup ------------------ #
    print("--> Importing LangChain modules...")
    sys.stdout.flush()
    from langchain_openai import OpenAIEmbeddings
    from langchain_pinecone import PineconeVectorStore
    from langchain.chains import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_google_vertexai import ChatVertexAI
    from src.prompt import system_prompt1, system_prompt2
    from src.chat_memory import load_memory, save_memory
    print("--> LangChain modules imported.")
    sys.stdout.flush()

    # Embeddings
    print("--> Initializing OpenAI Embeddings...")
    sys.stdout.flush()
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=OPENAI_API_KEY)
    print("--> OpenAI Embeddings initialized successfully.")
    sys.stdout.flush()

    # Pinecone Vectorstore
    print("--> Initializing Pinecone VectorStore...")
    sys.stdout.flush()
    docsearch = PineconeVectorStore.from_existing_index(
        index_name="medical-chatbot", embedding=embeddings
    )
    retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})
    print("--> Pinecone VectorStore initialized successfully.")
    sys.stdout.flush()

    # Chat Model
    print("--> Initializing VertexAI Chat Model...")
    sys.stdout.flush()
    chatModel = ChatVertexAI(
        model="gemini-1.5-flash",  # Using a known stable model name
        project=GCP_PROJECT,
        location=GCP_LOCATION,
        temperature=0.3
    )
    print("--> VertexAI Chat Model initialized successfully.")
    sys.stdout.flush()

    # Save in app.config
    app.config.update({
        "system_prompt1": system_prompt1,
        "system_prompt2": system_prompt2,
        "load_memory": load_memory,
        "save_memory": save_memory,
        "create_stuff_documents_chain": create_stuff_documents_chain,
        "create_retrieval_chain": create_retrieval_chain,
        "ChatPromptTemplate": ChatPromptTemplate
    })

except Exception as e:
    print(f"--> FATAL: An error occurred during initialization: {e}", file=sys.stderr)
    sys.stderr.flush()
    # This will cause the Gunicorn process to exit and show the error clearly in logs.
    raise

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
    # Use global models defined at startup
    global chatModel, retriever

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
    # Create context from last few messages to avoid overly long prompts
    memory_context = "\n".join([f"{m['role']}: {m['content']}" for m in memory[-6:]])
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


print("--> Initialization complete. Gunicorn can now start the server.")
sys.stdout.flush()

if __name__ == "__main__":
    # This block is for local development only. Gunicorn does not run this.
    print("--> Starting Flask development server.")
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
# ------------------ Deployment Notes ------------------ #
# Local testing:
# export FLASK_APP=app.py
# flask run --host=0.0.0.0 --port=8080
# Deployment (Render):
# gunicorn app:app --bind 0.0.0.0:$PORT --workers 1
