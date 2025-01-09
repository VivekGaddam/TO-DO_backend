import { Schema } from "mongoose";
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    task: { type: String, required: true },
    date: { type: Date, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});
const Task = mongoose.model("Task", taskSchema);
const User = mongoose.model("User", userSchema);
export { Task, User };
