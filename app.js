const express = require("express")
const path = require("path")
const mongoose = require("mongoose")
require("dotenv").config()

const Task = require("./models/task.js")

const app = express()
const PORT = 3000

mongoose.connect(process.env.MONGODB_URI)
    .then(() => { 
        console.log("Database Connected")
    })
    .catch((err) => {
        console.log("Error connecting to Database: ", err)
    })

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/tasks", async (req, res) => {
    const tasks = await Task.find({})
    res.render("tasks/index", { tasks })
})

app.post("/tasks", async (req, res) => {
    const { todo, description, deadline } = req.body
    const dateDeadline = new Date(deadline)
    const task = new Task({ 
        todo, 
        description,  
        deadline: dateDeadline
    })
    task.save()
    res.redirect("/tasks")
})

app.patch("/tasks/:id", async (req, res) => {
    const { id } = req.params
    const { isCompleted } = req.body
    try {
        const task = await Task.findByIdAndUpdate(id, { completed: isCompleted })
        if(!task) {
            return res.status(404).json({ message: "Task not found" })
        }
        res.json(task)
    } catch (error) {
        console.error("Error updating task:", error)
        res.status(500).json({ message: "Error updating task" })
    }
})

app.delete("/tasks/:id", async (req, res) => {
    const { id } = req.params
    try {
        const task = await Task.findByIdAndDelete(id)
        if(!task) {
            return res.status(404).json({ message: "Task not found" })
        }
        res.json({ message: "Successfully deleted task" })
    } catch (error) {
        console.error("Error deleting task:", error)
        res.status(500).json({ message: "Error deleting task" })
    }
})

app.listen(PORT, () => {
    console.log(`Server started at PORT ${PORT}`)
})