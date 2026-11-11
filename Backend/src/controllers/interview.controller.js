const { PDFParse } = require("pdf-parse");
const { generateInterviewReport, evaluateInterviewAnswer } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const { createReportPdf } = require("../services/report-pdf.service");


async function generateInterviewReportController(req, res) {
    const resumeFile = req.file;

    if (!resumeFile) {
        return res.status(400).json({ message: "Please upload a PDF resume" });
    }
    if (!resumeFile.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        return res.status(400).json({ message: "The uploaded file is not a valid PDF" });
    }

    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length < 30) {
        return res.status(400).json({
            message: "Please provide a job description with at least 30 characters",
        });
    }

    const parser = new PDFParse({ data: Uint8Array.from(resumeFile.buffer) });
    const resumeContent = await parser.getText();
    await parser.destroy();

    const interviewReportByAi = await generateInterviewReport({
        resume:resumeContent.text,
        jobDescription: jobDescription.trim()
    })
    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        jobDescription: jobDescription.trim(),
        ...interviewReportByAi
    })

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
    if (!require("mongoose").isValidObjectId(interviewId)) {
        return res.status(404).json({
            message: "Interview report not found"
        });
    }
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
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
    const { search = "", minScore, sort = "newest" } = req.query;
    const query = { user: req.user.id };
    if (search.trim()) {
        query.title = { $regex: search.trim(), $options: "i" };
    }
    if (minScore && Number.isFinite(Number(minScore))) {
        query.matchScore = { $gte: Number(minScore) };
    }
    const interviewReports = await interviewReportModel.find(query)
        .sort(sort === "score" ? { matchScore: -1 } : { createdAt: -1 })
        .select("-resume -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -answerEvaluations");

    res.status(200).json({
        message: "Interview reports fetched successfully",
        interviewReports
    });
}

async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params;
    if (!require("mongoose").isValidObjectId(interviewId)) {
        return res.status(404).json({ message: "Interview report not found" });
    }
    const deleted = await interviewReportModel.findOneAndDelete({
        _id: interviewId,
        user: req.user.id
    });
    if (!deleted) {
        return res.status(404).json({ message: "Interview report not found" });
    }
    res.status(200).json({ message: "Interview report deleted successfully" });
}

async function downloadInterviewReportController(req, res) {
    const { interviewId } = req.params;
    if (!require("mongoose").isValidObjectId(interviewId)) {
        return res.status(404).json({ message: "Interview report not found" });
    }
    const report = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id
    });
    if (!report) {
        return res.status(404).json({ message: "Interview report not found" });
    }
    const pdf = createReportPdf(report);
    const filename = `${String(report.title || "interview-report").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdf.length
    });
    res.send(pdf);
}

async function evaluateInterviewAnswerController(req, res) {
    const { interviewId } = req.params;
    const { question, answer } = req.body;

    if (!require("mongoose").isValidObjectId(interviewId)) {
        return res.status(404).json({ message: "Interview report not found" });
    }
    if (!question?.trim() || !answer?.trim()) {
        return res.status(400).json({ message: "Question and answer are required" });
    }
    if (answer.trim().length < 20) {
        return res.status(400).json({ message: "Please write at least 20 characters for a useful evaluation" });
    }
    if (answer.trim().length > 8000) {
        return res.status(400).json({ message: "Answer must be 8,000 characters or fewer" });
    }

    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
    if (!report) {
        return res.status(404).json({ message: "Interview report not found" });
    }

    const allQuestions = [
        ...(report.technicalQuestions || []),
        ...(report.behavioralQuestions || []),
        ...(report.projectQuestions || [])
    ];
    const selectedQuestion = allQuestions.find((item) => item.question === question.trim());
    if (!selectedQuestion) {
        return res.status(400).json({ message: "Selected question does not belong to this report" });
    }

    const evaluation = await evaluateInterviewAnswer({
        question: selectedQuestion.question,
        answer: answer.trim(),
        resume: report.resume,
        jobDescription: report.jobDescription
    });
    report.answerEvaluations = report.answerEvaluations || [];
    report.answerEvaluations.push({
        question: selectedQuestion.question,
        answer: answer.trim(),
        ...evaluation
    });
    await report.save();

    res.status(201).json({
        message: "Answer evaluated successfully",
        evaluation: report.answerEvaluations[report.answerEvaluations.length - 1]
    });
}

module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, deleteInterviewReportController, downloadInterviewReportController, evaluateInterviewAnswerController };