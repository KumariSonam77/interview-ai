const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of resume and job description
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser,upload.single("resume"),interviewController.generateInterviewReportController);

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId,
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController);

interviewRouter.post("/report/:interviewId/evaluate", authMiddleware.authUser, interviewController.evaluateInterviewAnswerController);
interviewRouter.delete("/report/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController);
interviewRouter.get("/report/:interviewId/download", authMiddleware.authUser, interviewController.downloadInterviewReportController);

/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController);
 
module.exports = interviewRouter;