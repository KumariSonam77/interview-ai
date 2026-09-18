const express = require("express")
const cookieparser = require("cookie-parser")
const app = express()

app.use(express.json())
app.use(cookieparser())
/* require all the routes here */
const authRouter = require("./routes/auth.routes")

/*using all the routes here */
app.use("/api/auth", authRouter)

module.exports = app