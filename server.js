import express from "express";
import mongoose from "mongoose";
import { Task, User } from "./models/todomodel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";  // Add this import

const app = express();
app.use(express.json());
app.use(cors());  

const JWT_SECRET = "secret";

// MongoDB Connection
mongoose.connect('mongodb+srv://vivekgaddam02:ci2hzcq7gO2Nsrc3@todo.tjbuj.mongodb.net/?retryWrites=true&w=majority&appName=Todo', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Access Denied. No token provided.");
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).send("Invalid token.");
    }
};

app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send("User already exists. Please log in.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Register successful", token });
    } catch (error) {
        res.status(500).send("Error registering user: " + error.message);
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send("Invalid credentials.");
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).send("Error during login: " + error.message);
    }
});

app.post("/add", authenticateToken, async (req, res) => {
    const { task, date } = req.body;

    try {
        const newTask = await Task.create({
            task,
            date,
            userId: req.user.id
        });

        res.status(201).send("Task added successfully.");
    } catch (err) {
        res.status(500).send("Error adding task: " + err.message);
    }
});

app.get("/all", authenticateToken, async (req, res) => {
    try {
        const allTasks = await Task.find({ userId: req.user.id });
        res.status(200).json(allTasks);
    } catch (err) {
        res.status(500).send("Error fetching tasks: " + err.message);
    }
});

app.delete("/delete/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedTask = await Task.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!deletedTask) {
            return res.status(404).send("Task not found.");
        }

        res.status(200).send("Task deleted successfully.");
    } catch (err) {
        res.status(500).send("Error deleting task: " + err.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
