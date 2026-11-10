const pdfParse = require("pdf-Parse");
const  {generateInterviewReport}  = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");


async function generateInterviewReportController(req, res) {
    const resumeFile = req.file;
    
    const resumeContent = await ( new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
    const { jobDescription } = req.body;
    const interviewReportByAi = await generateInterviewReport({
        resume:resumeContent.text,
        jobDescription: jobDescription
    })
    const interviewReport = await new interviewReportModel({
        user: req.user._id,
        resume: resumeContent.text,
        jobDescription: jobDescription,
        ...interviewReportByAi
    }).save()

    res.status(201).json({
        message: "Interview report generated successfully",
        interviewReport
    });

}

/**
 * @description controller to get interview report by interviewId
 */

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params;
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user._id });
    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found"
        });
    }
    res.status(200).json({
        message: "Interview report fetched successfully",
        interviewReport
    });
}

/**
 * @description controller to get all interview reports of logged in user
 */

async function getAllInterviewReportsController(req, res) {
    const interviewReports = (await interviewReportModel.find({ user: req.user._id })).
    toSort({ createdAt: -1 }).
    select("-resume -jobDescription -_v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

    res.status(200).json({
        message: "Interview reports fetched successfully",
        interviewReports
    });
}

module.exports = {generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController};