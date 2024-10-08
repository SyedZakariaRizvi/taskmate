module.exports.isAuthenticated = (req, res, next) => {
    if(!req.user) {
        return res.redirect("/users/login")
    }
    next()
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params
    if(!req.user.tasks.some(task => task._id.equals(id))) {
        return res.redirect("/tasks")
    }
    next()
}