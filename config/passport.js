const passport = require("passport")
const User = require("../models/user.js")

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        if(!user)
            throw new Errow("User not found")
        done(null, user)
    } catch(err) {
        done(err, null)
    }
})

module.exports = passport