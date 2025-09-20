from flask import Flask, render_template, request, send_from_directory, jsonify
from dotenv import load_dotenv
import os
import sys

# ------------------ Load environment variables at startup ------------------ #
# This is lightweight and safe to do once at the beginning.
print("--> Loading environment variables...")
sys.stdout.flush()
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GCP_PROJECT = os.getenv("GCP_PROJECT")
GCP_LOCATION = os.getenv("GCP_LOCATION")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
print("--> Environment variables loaded.")
sys.stdout.flush()

# ------------------ Flask app ------------------ #
# Define the app in the global scope so it's ready to serve.
app = Flask(__name__, static_folder="static", template_folder="templates")


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
    # --- LAZY LOADING HAPPENS HERE ---
    # The server starts fast with low memory. This code only runs when a user sends a message.
    print("--> Chat request received. Lazily loading modules and initializing clients...")
    sys.stdout.flush()

    try:
        # 1. Import all heavy modules inside the function
        from langchain_openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
        from langchain.chains import create_retrieval_chain
        from langchain.chains.combine_documents import create_stuff_documents_chain
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_google_vertexai import ChatVertexAI
        from src.prompt import system_prompt1, system_prompt2
        from src.chat_memory import load_memory, save_memory

        # 2. Initialize clients inside the function
        # Embeddings
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=OPENAI_API_KEY)
        
        # Pinecone Vectorstore
        docsearch = PineconeVectorStore.from_existing_index(
            index_name="medical-chatbot", embedding=embeddings
        )
        retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})
        
        # Chat Model
        chatModel = ChatVertexAI(
            model="gemini-2.5-flash",
            project=GCP_PROJECT,
            location=GCP_LOCATION,
            temperature=0.3
        )
        
        print("--> Initialization complete. Processing user input...")
        sys.stdout.flush()

        # 3. Process the request using the locally initialized objects
        msg = request.form["msg"]
        username = request.form.get("username", "guest")
        mode = request.form.get("mode", "friend")

        memory = load_memory(username)
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

    except Exception as e:
        print(f"--> FATAL: An error occurred during request processing: {e}", file=sys.stderr)
        sys.stderr.flush()
        # Return an error to the user
        return jsonify({"error": "An internal error occurred. Please try again later."}), 500


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
