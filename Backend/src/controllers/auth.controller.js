const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

function authCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production"
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    }
}

function validateJwtConfiguration() {
    if (!process.env.JWT_SECRET) {
        const error = new Error("JWT_SECRET is missing in .env");
        error.status = 500;
        throw error;
    }
}

/**
 * @route POST/api/auth/register
 * @description Register a new user,expects username,email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!username || !email || !password){
        return res.status(400).json({
            message:"please provide username,email and password"
        })
    }
    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }
    validateJwtConfiguration();
    const isUserAlreadyExists = await userModel.findOne({
        $or:[{username},{email}]
    })
    if (isUserAlreadyExists){
        return res.status(400).json({
            message:"Account alreay exists with this email address or username"
        })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await userModel.create({
        username,
        email,
        password:hash
    })
    const token = jwt.sign(
        {id: user._id,username: user.username},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token", token, authCookieOptions())
    res.status(201).json({
        message:"User registered successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}
/**
 * @name loginUserController
 * @description login a user,expects email and password in the request body
 * @access public
 */
async function loginUserController(req,res){
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "Please provide email and password"
        });
    }
    const user = await userModel.findOne({email})
    if (!user) {
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }
    const isPasswordValid= await bcrypt.compare(password, user.password)
    if(!isPasswordValid){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }
    validateJwtConfiguration();
     const token = jwt.sign(
        {id: user._id,username: user.username},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token", token, authCookieOptions())
    
    res.status(200).json({
        message:"User loggedIn successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email

        }
    })
    
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res){
    const token = req.cookies.token

    if(token){
        await tokenBlacklistModel.create({token})
    }

    res.clearCookie("token", authCookieOptions())

    res.status(200).json({
        message:"User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access private
 */
async function getMeController(req,res){
    const user = await userModel.findById(req.user.id)
    if (!user) {
        return res.status(404).json({
            message: "User account not found"
        });
    }
    res.status(200).json({
        message:"User details fetched successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })

}


module.exports = {
    registerUserController,loginUserController,logoutUserController,getMeController
}