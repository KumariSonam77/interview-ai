const express = require("express")
const cookieparser = require("cookie-parser")
const cors = require("cors")
const multer = require("multer")
const app = express()

app.use(express.json())
app.use(cookieparser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
/*using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "Resume must be 3 MB or smaller"
            : "Only PDF resume files are supported";
        return res.status(400).json({ message });
    }

    if (err.code === "AI_QUOTA_EXCEEDED") {
        return res.status(429).json({ message: err.message });
    }

    if (err.code === "AI_ACCESS_DENIED" || err.code === "AI_CONFIGURATION_ERROR") {
        return res.status(err.status || 503).json({ message: err.message });
    }

    console.error("Unhandled request error:", err);
    res.status(err.status || 500).json({
        message: err.status === 500 ? err.message : "Something went wrong. Please try again."
    });
})

module.exports = app