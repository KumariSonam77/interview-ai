const express = require("express");
const authController = require("../controllers/auth.controller");
const authRouter = express.Router();

/**
 * @route POST/api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUserController);

/**
 * @route POST/api/auth/login
 * @description login user with email and password
 * @access public
 */

authRouter.post("/login",authController.loginUserController)

/**
 * @route GET/api/auth/logout
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

authRouter.get("/logout",authController.logoutUserController)

module.exports = authRouter