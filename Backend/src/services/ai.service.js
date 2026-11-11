const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

const API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY });

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const MAX_RETRIES = 3;
const RETRYABLE_STATUS = [ 500, 502, 503, 504];
const MAX_INPUT_CHARS = 15000; // resume / JD bahut lamba ho to cut kar do

// ---------- Schema ----------
const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100),
    matchExplanation: z.string(),
    matchedSkills: z.array(z.object({
        skill: z.string(),
        evidence: z.string(),
    })),
    partialSkills: z.array(z.object({
        skill: z.string(),
        evidence: z.string(),
    })),
    resumeStrengths: z.array(z.string()),
    improvementSuggestions: z.array(z.string()),

    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            difficulty: z.enum(["easy", "medium", "hard"]),
        })
    ),

    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            difficulty: z.enum(["easy", "medium", "hard"]),
        })
    ),

    projectQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            difficulty: z.enum(["easy", "medium", "hard"]),
        })
    ),

    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.enum(["low", "medium", "high"]),
        })
    ),

    preparationPlan: z.array(
        z.object({
            day: z.number(),
            focusArea: z.string(),
            tasks: z.array(z.string()),
        })
    ),
    

    title: z.string().default("Interview Report").describe("Title of the report"),
});

const answerEvaluationSchema = z.object({
    score: z.number().min(0).max(10),
    dimensions: z.object({
        technicalAccuracy: z.number().min(0).max(10),
        relevance: z.number().min(0).max(10),
        clarity: z.number().min(0).max(10),
        completeness: z.number().min(0).max(10),
        communication: z.number().min(0).max(10),
    }),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    suggestions: z.array(z.string()),
    improvedAnswer: z.string(),
});

// ---------- Helpers ----------
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error) {
    const status = Number(error.status || error.code);
    if (RETRYABLE_STATUS.includes(status)) return true;

    // Network errors (no HTTP status)
    const msg = String(error.message || "").toLowerCase();
    return (
        msg.includes("fetch failed") ||
        msg.includes("timeout") ||
        msg.includes("econnreset") ||
        msg.includes("etimedout")
    );
}

function createAiError(code, message, status) {
    const aiError = new Error(message);
    aiError.code = code;
    aiError.status = status;
    return aiError;
}

// Kabhi kabhi model JSON ko ```json ... ``` mein wrap kar deta hai
function parseJsonSafe(text) {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    return JSON.parse(cleaned);
}

// Retry transient provider failures without switching away from the configured model.
async function callModel(prompt) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.4,
                },
            });
        } catch (error) {
            const status = Number(error.status || error.code);
            if (status === 429) {
                throw createAiError(
                    "AI_QUOTA_EXCEEDED",
                    "Gemini free-tier quota is temporarily exhausted. Please try again later.",
                    429
                );
            }
            if (status === 401 || status === 403) {
                throw createAiError(
                    "AI_ACCESS_DENIED",
                    "Gemini API access was denied. Check the backend API key and model access.",
                    status
                );
            }
            if (!isRetryable(error) || attempt === MAX_RETRIES) {
                throw error;
            }

            // 2s, 4s, 8s ... + thoda random jitter
            const wait = 2000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500);

            console.log(
                `[${GEMINI_MODEL}] failed (status ${error.status}). Retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(wait / 1000)}s...`
            );

            await delay(wait);
        }
    }
}

// ---------- Main function ----------
async function generateInterviewReport({ resume, jobDescription }) {
    try {
        if (!API_KEY) {
            throw createAiError(
                "AI_CONFIGURATION_ERROR",
                "GOOGLE_GENAI_API_KEY is missing in .env",
                500
            );
        }

        if (!resume || !jobDescription) {
            throw new Error("Resume and Job Description are required");
        }

        const safeResume = String(resume).slice(0, MAX_INPUT_CHARS);
        const safeJD = String(jobDescription).trim().slice(0, MAX_INPUT_CHARS);

        const prompt = `
You are an expert technical interviewer and career advisor.

Analyze the candidate's resume against the job description.
Generate a detailed interview preparation report.

Return ONLY valid JSON (no markdown, no extra text) with these exact fields:

1. matchScore: Number between 0 and 100 based only on evidence in the resume and requirements in the job description.
2. matchExplanation: One concise explanation of the score, mentioning evidence and important limitations.
3. matchedSkills: Array of skill/evidence objects for requirements clearly supported by the resume.
4. partialSkills: Array of skill/evidence objects for requirements partially supported or needing more proof.
5. resumeStrengths: Array of strengths explicitly supported by the resume.
6. improvementSuggestions: Array of practical resume or preparation improvements grounded in the supplied documents.
7. technicalQuestions: Array of objects with question, intention, answer and difficulty.
8. behavioralQuestions: Array of objects with question, intention, answer and difficulty.
9. projectQuestions: Array of objects based only on projects explicitly named or described in the resume.
10. skillGaps: Array of objects with skill and severity for job requirements not sufficiently evidenced.
11. preparationPlan: Array of objects with day (number), focusArea and tasks (array of strings).
12. title: A short string title for the report (for example, the job role name).

Severity must be exactly one of: low, medium, high.
Difficulty must be exactly one of: easy, medium, hard.

Make the questions relevant to the candidate's actual skills and the job requirements.
Do not invent skills, projects, achievements, scores, or experience that are not present in the resume.
If evidence is absent, put the requirement in partialSkills or skillGaps instead of claiming it is matched.
Include a balanced set of questions across all three difficulty levels where the source material supports it.

Resume:
${safeResume}

Job Description:
${safeJD}
`;

        // Agar AI ne galat JSON diya to ek baar aur try karenge
        let lastParseError;

        for (let attempt = 1; attempt <= 2; attempt++) {
            const response = await callModel(prompt);

            const text = response && response.text;

            if (!text) {
                lastParseError = new Error("Gemini returned an empty response");
                continue;
            }

            try {
                const result = parseJsonSafe(text);
                const validated = interviewReportSchema.safeParse(result);

                if (!validated.success) {
                    lastParseError = new Error(
                        "Invalid AI response: " + JSON.stringify(validated.error.issues)
                    );
                    continue;
                }

                console.log("Interview report generated successfully");
                return validated.data;
            } catch (parseError) {
                lastParseError = new Error("AI returned invalid JSON: " + parseError.message);
            }
        }

        throw lastParseError;
    } catch (error) {
        console.error("Interview Report Error:", error.message);
        throw error;
    }
}

async function evaluateInterviewAnswer({ question, answer, resume, jobDescription }) {
    try {
        if (!API_KEY) {
            throw createAiError("AI_CONFIGURATION_ERROR", "GOOGLE_GENAI_API_KEY is missing in .env", 500);
        }

        const prompt = `
You are an interview coach evaluating a candidate's answer.
Use only the supplied question, answer, resume, and job description.
Do not invent experience or claim facts not supported by the resume.

Return ONLY valid JSON with exactly these fields:
score: number from 0 to 10.
dimensions: object with technicalAccuracy, relevance, clarity, completeness, communication, each from 0 to 10.
strengths: array of specific strengths.
weaknesses: array of specific weaknesses.
suggestions: array of actionable improvements.
improvedAnswer: a concise sample answer that improves the candidate's answer without inventing experience.

Question:
${String(question).trim().slice(0, 4000)}

Candidate answer:
${String(answer).trim().slice(0, 8000)}

Resume context:
${String(resume || "").slice(0, 8000)}

Job description:
${String(jobDescription || "").slice(0, 8000)}
`;

        let lastError;
        for (let attempt = 1; attempt <= 2; attempt++) {
            const response = await callModel(prompt);
            const text = response && response.text;
            if (!text) {
                lastError = new Error("Gemini returned an empty evaluation");
                continue;
            }

            try {
                const validated = answerEvaluationSchema.safeParse(parseJsonSafe(text));
                if (validated.success) return validated.data;
                lastError = new Error("Invalid AI evaluation: " + JSON.stringify(validated.error.issues));
            } catch (error) {
                lastError = new Error("AI returned invalid evaluation JSON: " + error.message);
            }
        }
        throw lastError;
    } catch (error) {
        console.error("Answer Evaluation Error:", error.message);
        throw error;
    }
}

module.exports = { generateInterviewReport, evaluateInterviewAnswer };