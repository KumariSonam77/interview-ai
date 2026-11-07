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
module.exports = {generateInterviewReportController}