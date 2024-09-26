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

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/tasks", async (req, res) => {
    const tasks = await Task.find({})
    res.render("tasks/index", { tasks })
})

app.listen(PORT, () => {
    console.log(`Server started at PORT ${PORT}`)
})