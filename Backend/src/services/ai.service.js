const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

const API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Free-tier friendly models. Pehla model try hoga, fail hone par agla.
// .env mein GEMINI_MODEL set karke primary model badal sakte ho.
const MODELS = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash-lite",
    "gemini-3.5-flash",
    
];

const MAX_RETRIES_PER_MODEL = 4;
const RETRYABLE_STATUS = [ 500, 502, 503, 504];
const MAX_INPUT_CHARS = 15000; // resume / JD bahut lamba ho to cut kar do

// ---------- Schema ----------
const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100),

    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
        })
    ),

    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
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

// Kabhi kabhi model JSON ko ```json ... ``` mein wrap kar deta hai
function parseJsonSafe(text) {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    return JSON.parse(cleaned);
}

// Ek model ke saath retry + exponential backoff
async function callModel(model, prompt) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        try {
            return await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.4,
                },
            });
        } catch (error) {
            if (!isRetryable(error) || attempt === MAX_RETRIES_PER_MODEL) {
                throw error;
            }

            // 2s, 4s, 8s ... + thoda random jitter
            const wait = 2000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500);

            console.log(
                `[${model}] failed (status ${error.status}). Retry ${attempt + 1}/${MAX_RETRIES_PER_MODEL} in ${Math.round(wait / 1000)}s...`
            );

            await delay(wait);
        }
    }
}

// Saare models ek ek karke try karo
async function generateWithFallback(prompt) {
    let lastError;

    for (const model of MODELS) {
        try {
            return await callModel(model, prompt);
        } catch (error) {
            lastError = error;
            console.log(`Model ${model} fail ho gaya, next model try kar rahe hain...`);
        }
    }

    throw lastError;
}

// ---------- Main function ----------
async function generateInterviewReport({ resume, jobDescription }) {
    try {
        if (!API_KEY) {
            throw new Error("GOOGLE_GENAI_API_KEY is missing in .env");
        }

        if (!resume || !jobDescription) {
            throw new Error("Resume and Job Description are required");
        }

        const safeResume = String(resume).slice(0, MAX_INPUT_CHARS);
        const safeJD = String(jobDescription).slice(0, MAX_INPUT_CHARS);

        const prompt = `
You are an expert technical interviewer and career advisor.

Analyze the candidate's resume against the job description.
Generate a detailed interview preparation report.

Return ONLY valid JSON (no markdown, no extra text) with these exact fields:

1. matchScore: Number between 0 and 100.
2. technicalQuestions: Array of objects with question, intention and answer.
3. behavioralQuestions: Array of objects with question, intention and answer.
4. skillGaps: Array of objects with skill and severity.
5. preparationPlan: Array of objects with day (number), focusArea and tasks (array of strings).
6. title: A short string title for the report (for example, the job role name).

Severity must be exactly one of: low, medium, high.

Make the questions relevant to the candidate's actual skills and the job requirements.
Do not invent skills or experience that are not present in the resume.

Resume:
${safeResume}

Job Description:
${safeJD}
`;

        // Agar AI ne galat JSON diya to ek baar aur try karenge
        let lastParseError;

        for (let attempt = 1; attempt <= 2; attempt++) {
            const response = await generateWithFallback(prompt);

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

module.exports = { generateInterviewReport };