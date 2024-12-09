// Get elements
const authContainer = document.getElementById("auth-container");
const chatContainer = document.getElementById("chat-container");
const authForm = document.getElementById("auth-form");
const messageDisplay = document.getElementById("message-display");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const activeUsersList = document.getElementById("active-users-list");
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");

const PORT = 4000;
// WebSocket setup
const socket = io(`ws://localhost:${PORT}`);

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("receive_message", (data) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", data.sender == username ? "user" : "other");
    messageElement.textContent = `${data.sender}: ${data.content}`;
    messageDisplay.appendChild(messageElement);
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
});

socket.on("activeUsers", (users) => {
    activeUsersList.innerHTML = "";
    users.forEach((user) => {
        const userElement = document.createElement("li");
        userElement.textContent = user;

        userElement.classList.add("fade-in");
        activeUsersList.appendChild(userElement);
    });
});

socket.on("error", (error) => {
    console.error("WebSocket error:", error);
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});

async function loadMessages() {
    try {
        const response = await fetch("/messages", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        const messages = await response.json();
        messages.forEach((message) => {
            const messageElement = document.createElement("div");
            messageElement.classList.add(
                "message",
                message.sender == username ? "user" : "other"
            );
            messageElement.textContent = `${message.sender}: ${message.content}`;
            messageDisplay.appendChild(messageElement);
        });
        messageDisplay.scrollTop = messageDisplay.scrollHeight;
    } catch (error) {
        console.error("Failed to load messages:", error);
    }
}

// Authentication
let username = "";

loginButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        if (!response.ok) {
            throw new Error("Invalid credentials");
        }

        const data = await response.json();
        localStorage.setItem("token", data.token);
        username = usernameInput;

        // send the username to the server
        socket.emit("set_username", username);

        // Load message history
        await loadMessages();

        authContainer.style.display = "none";
        chatContainer.style.display = "flex";
    } catch (error) {
        alert(error.message);
    }
});

signupButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    try {
        const response = await fetch("/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        if (!response.ok) {
            throw new Error("Error creating user");
        }

        alert("User created successfully. Please log in.");
    } catch (error) {
        alert(error.message);
    }
});

// Sending a message
sendButton.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (messageText === "") {
        return;
    }

    socket.emit("send_message", { sender: username, content: messageText });
    messageInput.value = "";
});
