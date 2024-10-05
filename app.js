const express = require("express")
const path = require("path")
const mongoose = require("mongoose")
require("dotenv").config()

const Task = require("./models/task.js")

const ExpressError = require("./utils/ExpressError.js")
const catchAsync = require("./utils/CatchAsync.js")

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

app.post("/tasks", catchAsync(async (req, res) => {
    const { todo, description, deadline } = req.body
    const dateDeadline = new Date(deadline)
    const task = new Task({ 
        todo, 
        description,  
        deadline: dateDeadline
    })
    await task.save()
    res.redirect("/tasks")
}))

app.patch("/tasks/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { isCompleted } = req.body
    const task = await Task.findByIdAndUpdate(id, { completed: isCompleted })
    if(!task) {
        return res.status(404).json({ message: "Task not found" })
    }
    res.json(task)
}))

app.delete("/tasks/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const task = await Task.findByIdAndDelete(id)
    if(!task) {
        return res.status(404).json({ message: "Task not found" })
    }
    res.json({ message: "Successfully deleted task" })
}))

app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if(!err.message) err.message = "Something went wrong"
    res.status(statusCode).send(err.message)
})

app.listen(PORT, () => {
    console.log(`Server started at PORT ${PORT}`)
})