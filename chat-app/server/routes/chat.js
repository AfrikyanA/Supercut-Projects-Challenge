const express = require("express");
const Message = require("../models/Message.js");
const router = express.Router();

// Fetch chat history
router.get("/history", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 }).limit(50); // Получение последних 50 сообщений
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Error fetching chat history: " + err.message });
    }
});

// Save a new message
router.post("/send", async (req, res) => {
    try {
        const { username, content } = req.body;

        if (!username || !content) {
            return res.status(400).json({ error: "Username and content are required" });
        }

        const newMessage = new Message({
            username,
            content,
            createdAt: new Date(),
        });

        await newMessage.save();
        res.status(201).json({ message: "Message sent successfully", data: newMessage });
    } catch (err) {
        res.status(500).json({ error: "Error sending message: " + err.message });
    }
});

module.exports = router;