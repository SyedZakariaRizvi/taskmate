const express = require("express")
const path = require("path")
const mongoose = require("mongoose")
const session = require("express-session")
require("dotenv").config()

const passport = require("./config/passport.js")
require("./config/passportLocal.js")

const { isAuthenticated, isAuthor } = require("./middlewares/auth.js")

const Task = require("./models/task.js")
const User = require("./models/user.js")

const Joi = require("joi")

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

const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24,
        maxAge: Date.now() + 1000 * 60 * 60 * 24
    }
}
app.use(session(sessionConfig))

app.use(passport.initialize())
app.use(passport.session())

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/tasks", isAuthenticated, async (req, res) => {
    const { user } = req

    await user.populate("tasks")
    const { tasks } = user
    res.render("tasks/index", { tasks })
})

app.post("/tasks", isAuthenticated, catchAsync(async (req, res) => {
    const { user } = req

    const taskSchema = Joi.object({
        task: Joi.object({
            todo: Joi.string().min(5).max(30).required(),
            description: Joi.string().min(10).max(100).required(),
            deadline: Joi.date().iso().required()
        }).required()
    })

    const { error } = taskSchema.validate(req.body)
    
    if(error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    }

    const { todo, description, deadline } = req.body.task
    const dateDeadline = new Date(deadline)
    const task = new Task({ 
        todo, 
        description,  
        deadline: dateDeadline
    })
    const findUser = await User.findById(user._id)
    findUser.tasks.push(task)
    await task.save()
    await findUser.save()
    res.redirect("/tasks")
}))

app.patch("/tasks/:id", isAuthenticated, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params
    const { isCompleted } = req.body
    const task = await Task.findByIdAndUpdate(id, { completed: isCompleted })
    if(!task) {
       throw new ExpressError("Task not found", 404)
    }
    res.json(task)
}))

app.delete("/tasks/:id", isAuthenticated, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params
    const task = await Task.findByIdAndDelete(id)
    if(!task) {
        throw new ExpressError("Task not found", 404)
    }
    res.json({ message: "Successfully deleted task" })
}))

app.get("/users/register", (req, res) => {
    res.render("auth/register")
})

app.post("/users/register", catchAsync(async (req, res) => {
    const { fullname, username, password } = req.body

    const user = new User({ 
        fullname,
        username,
        password
    })  
    await user.save()
    res.redirect("/tasks")
}))

app.get("/users/login", (req, res) => {
    res.render("auth/login")
})

app.post("/users/login", passport.authenticate("local"), (req, res) => {
    res.redirect("/tasks")
})

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