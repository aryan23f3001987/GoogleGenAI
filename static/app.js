// ------------------ Chatbot ------------------ //
function sendMessage() {
    const msg = document.getElementById("chatInput").value;
    const mode = document.getElementById("modeToggle").checked ? "therapist" : "friend";

    fetch("/get", {
        method: "POST",
        body: new URLSearchParams({
            msg: msg,
            mode: mode
        })
    })
    .then(res => res.text())
    .then(data => {
        const chatBox = document.getElementById("chatBox");
        const userMsg = document.createElement("p");
        userMsg.innerHTML = `<b>You:</b> ${msg}`;
        chatBox.appendChild(userMsg);

        const botMsg = document.createElement("p");
        botMsg.innerHTML = `<b>Bot:</b> ${data}`;
        chatBox.appendChild(botMsg);

        document.getElementById("chatInput").value = "";
    });
}

// ------------------ Journal ------------------ //
function saveJournal() {
    const entry = document.getElementById("journalEntry").value;
    const username = localStorage.getItem("username") || "guest"; // replace with login system

    fetch("/save_journal", {
        method: "POST",
        body: new URLSearchParams({
            username: username,
            entry: entry
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        document.getElementById("journalEntry").value = "";
        loadJournal();
    });
}

function loadJournal() {
    const username = localStorage.getItem("username") || "guest";

    fetch(`/get_journal?username=${username}`)
    .then(res => res.json())
    .then(entries => {
        const historyDiv = document.getElementById("journalHistory");
        historyDiv.innerHTML = "";
        entries.forEach(j => {
            const p = document.createElement("p");
            p.innerHTML = `<b>${j.date}:</b> ${j.text}`;
            historyDiv.appendChild(p);
        });
    });
}

// ------------------ Auto-load Journal ------------------ //
window.onload = loadJournal;