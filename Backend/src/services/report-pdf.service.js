function escapePdfText(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/[^\x20-\x7E]/g, " ");
}

function wrapText(value, width = 90) {
    const words = String(value || "").split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
        if ((line + " " + word).trim().length > width) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = (line + " " + word).trim();
        }
    });
    if (line) lines.push(line);
    return lines;
}

function createReportPdf(report) {
    const lines = [
        report.title,
        `Job match: ${report.matchScore ?? "N/A"}%`,
        `Created: ${new Date(report.createdAt).toLocaleDateString()}`,
        "",
        "MATCH EXPLANATION",
        report.matchExplanation,
        "",
        "RESUME STRENGTHS",
        ...(report.resumeStrengths || []).map((item) => `- ${item}`),
        "",
        "IMPROVEMENT SUGGESTIONS",
        ...(report.improvementSuggestions || []).map((item) => `- ${item}`),
        "",
        "SKILL GAPS",
        ...(report.skillGaps || []).map((item) => `- ${item.skill} (${item.severity})`),
        "",
        "TECHNICAL QUESTIONS",
        ...(report.technicalQuestions || []).flatMap((item, index) => [
            `${index + 1}. ${item.question} [${item.difficulty || "medium"}]`,
            `Answer: ${item.answer}`,
            ""
        ]),
        "BEHAVIORAL QUESTIONS",
        ...(report.behavioralQuestions || []).flatMap((item, index) => [
            `${index + 1}. ${item.question} [${item.difficulty || "medium"}]`,
            `Answer: ${item.answer}`,
            ""
        ]),
        "PROJECT QUESTIONS",
        ...(report.projectQuestions || []).flatMap((item, index) => [
            `${index + 1}. ${item.question} [${item.difficulty || "medium"}]`,
            `Answer: ${item.answer}`,
            ""
        ]),
        "PREPARATION ROADMAP",
        ...(report.preparationPlan || []).flatMap((item) => [
            `Day ${item.day}: ${item.focusArea}`,
            ...item.tasks.map((task) => `- ${task}`),
            ""
        ]),
        "ANSWER EVALUATION HISTORY",
        ...(report.answerEvaluations || []).flatMap((item) => [
            `Question: ${item.question}`,
            `Score: ${item.score}/10`,
            `Feedback: ${(item.suggestions || []).join("; ")}`,
            ""
        ])
    ];

    const content = [
        "BT",
        "/F1 10 Tf",
        "50 760 Td",
        ...lines.flatMap((line) => wrapText(line).map((wrapped) => `(${escapePdfText(wrapped)}) Tj 0 -14 Td`)),
        "ET"
    ].join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, "ascii");
}

module.exports = { createReportPdf };
