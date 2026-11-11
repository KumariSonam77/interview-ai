const mongoose = require("mongoose")

async function connectToDB(){
    try{
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to datbase")
    }
    catch (err){
        console.error("Database connection failed:", err.message)
        process.exitCode = 1
    }
}
module.exports = connectToDB