
require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/db")
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const {resume,jobDescription} = require("./src/services/temp")
const { generateInterviewReport } =require("./src/services/ai.service");
connectToDB()
generateInterviewReport({resume,jobDescription})


app.listen(3000,() =>{
    console.log("server is running on port 3000")
})