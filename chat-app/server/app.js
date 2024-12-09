const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const path = require('path');
require("dotenv").config({ path: "../.env" });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4000"
    }
});

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(bodyParser.json());

// Middleware for authentication
const SECRET_TOKEN = process.env.SECRET_TOKEN;
const authMiddleware = (req, res, next) => {
    // Example of a simple token check
    const token = req.headers.authorization;
    if (!token || token !== SECRET_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

// Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
app.use('/auth', authRoutes);
app.use("/chat", chatRoutes);

// Serve static files for the client
app.use(express.static(path.join(__dirname, "../client"))); // Adjust path as needed

// Send API
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "index.html"));
});

// Active Users Storage
const activeUsers = new Map();

// Models
const Message = require("./models/Message");

// Uploading messages at login
app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 }); // Receive all messages sorted by time
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// WebSocket connection handler
io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    // Add new user
    socket.on("set_username", (username) => {
        activeUsers.set(socket.id, username);
        // Update list of Active Users  
        io.emit("activeUsers", Array.from(activeUsers.values()));
    });

    // Preparing to send a message
    socket.on("send_message", async (data) => {
        const { sender, content } = data;

        if (!sender || !content) {
            return;
        }

        // Save message in DB
        const newMessage = new Message({
            sender: sender,
            content: content,
        });

        try {
            await newMessage.save();
            // send to all users
            io.emit("receive_message", {
                sender: sender,
                content: content,
            });
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("sendMessage", ({ room, message }) => {
        if (!room || !message) {
            return socket.emit("error", { error: "Invalid data" });
        }
        io.to(room).emit("message", message);
    });

    socket.on("disconnect", () => {
        activeUsers.delete(socket.id);
        io.emit("activeUsers", Array.from(activeUsers.values()));
        console.log("User disconnected: " + socket.id);
    });
});

// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log("server running on http://localhost:" + PORT);
});