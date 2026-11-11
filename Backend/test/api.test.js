const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const hasTestDatabase = Boolean(process.env.TEST_MONGO_URI);
const hasTestJwtSecret = Boolean(process.env.TEST_JWT_SECRET);
const hasGeminiCredentials = Boolean(
    process.env.TEST_GOOGLE_GENAI_API_KEY ||
    process.env.TEST_GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GEMINI_API_KEY
);
const canRunLiveTests = hasTestDatabase && hasTestJwtSecret;
const canRunAiTests = canRunLiveTests && hasGeminiCredentials;

if (process.env.TEST_MONGO_URI && process.env.MONGO_URI &&
    process.env.TEST_MONGO_URI === process.env.MONGO_URI) {
    throw new Error("TEST_MONGO_URI must be different from MONGO_URI");
}

if (process.env.TEST_JWT_SECRET) {
    process.env.JWT_SECRET = process.env.TEST_JWT_SECRET;
}
if (process.env.TEST_GOOGLE_GENAI_API_KEY) {
    process.env.GOOGLE_GENAI_API_KEY = process.env.TEST_GOOGLE_GENAI_API_KEY;
}
if (process.env.TEST_GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.TEST_GEMINI_API_KEY;
}

const app = require("../src/app");
const userModel = require("../src/models/user.model");
const reportModel = require("../src/models/interviewReport.model");
const blacklistModel = require("../src/models/blacklist.model");

let server;
let baseUrl;
let ownerCookie;
let ownerUser;
let reportId;

function responseCookie(response) {
    const cookie = response.headers.get("set-cookie");
    return cookie ? cookie.split(";")[0] : "";
}

async function request(path, options = {}, cookie = "") {
    const headers = new Headers(options.headers || {});
    if (cookie) headers.set("Cookie", cookie);
    return fetch(`${baseUrl}${path}`, { ...options, headers });
}

async function json(response) {
    return response.json();
}

function validPdfBuffer() {
    const body = "BT /F1 12 Tf 72 720 Td (Resume test) Tj ET";
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Length " + body.length + " >>\nstream\n" + body + "\nendstream"
    ];
    let output = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(output.length);
        output += (index + 1) + " 0 obj\n" + object + "\nendobj\n";
    });
    const xref = output.length;
    output += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
        output += String(offset).padStart(10, "0") + " 00000 n \n";
    });
    output += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";
    return Buffer.from(output);
}

async function registerUser(suffix) {
    const response = await request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: `test-user-${suffix}-${Date.now()}`,
            email: `test-${suffix}-${Date.now()}@example.test`,
            password: "TestPassword123"
        })
    });
    assert.equal(response.status, 201);
    return { cookie: responseCookie(response), body: await json(response) };
}

test("rejects invalid public authentication input", async () => {
    server = server || app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const registerResponse = await request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    assert.equal(registerResponse.status, 400);

    const loginResponse = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    assert.equal(loginResponse.status, 400);
});

test("rejects protected routes without a JWT", async () => {
    const response = await request("/api/interview/");
    assert.equal(response.status, 401);

    const malformedTokenResponse = await request("/api/interview/", {}, "token=not-a-jwt");
    assert.equal(malformedTokenResponse.status, process.env.JWT_SECRET ? 401 : 503);
});

test("runs authentication and protected-route integration flow", {
    skip: !canRunLiveTests && "NOT RUN: set TEST_MONGO_URI and TEST_JWT_SECRET"
}, async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI);
    await Promise.all([
        userModel.deleteMany({ email: /@example\.test$/ }),
        reportModel.deleteMany({}),
        blacklistModel.deleteMany({})
    ]);

    const registered = await registerUser("owner");
    ownerCookie = registered.cookie;
    ownerUser = registered.body.user;
    assert.ok(ownerUser.id);

    const meResponse = await request("/api/auth/get-me", {}, ownerCookie);
    assert.equal(meResponse.status, 200);
    assert.equal((await json(meResponse)).user.id, ownerUser.id);

    const invalidLogin = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "missing@example.test", password: "WrongPassword123" })
    });
    assert.equal(invalidLogin.status, 400);

    const logoutResponse = await request("/api/auth/logout", { method: "GET" }, ownerCookie);
    assert.equal(logoutResponse.status, 200);
    const loggedOutResponse = await request("/api/auth/get-me", {}, ownerCookie);
    assert.equal(loggedOutResponse.status, 401);

    const loginResponse = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: ownerUser.email,
            password: "TestPassword123"
        })
    });
    assert.equal(loginResponse.status, 200);
    ownerCookie = responseCookie(loginResponse);
});

test("validates resume uploads and job descriptions", {
    skip: !canRunLiveTests && "NOT RUN: set TEST_MONGO_URI and TEST_JWT_SECRET"
}, async () => {
    const invalidFile = new FormData();
    invalidFile.append("jobDescription", "This is a sufficiently long job description for validation.");
    invalidFile.append("resume", new Blob(["not a PDF"], { type: "application/pdf" }), "resume.pdf");
    const invalidFileResponse = await request("/api/interview/", {
        method: "POST",
        body: invalidFile
    }, ownerCookie);
    assert.equal(invalidFileResponse.status, 400);

    const invalidJob = new FormData();
    invalidJob.append("jobDescription", "Too short");
    invalidJob.append("resume", new Blob([validPdfBuffer()], { type: "application/pdf" }), "resume.pdf");
    const invalidJobResponse = await request("/api/interview/", {
        method: "POST",
        body: invalidJob
    }, ownerCookie);
    assert.equal(invalidJobResponse.status, 400);
});

test("creates and retrieves an AI report without regenerating on retrieval", {
    skip: !canRunAiTests && "NOT RUN: requires TEST_MONGO_URI, TEST_JWT_SECRET, Gemini key, and free quota"
}, async () => {
    const form = new FormData();
    form.append("jobDescription", "We need a JavaScript developer with React, Node.js, Express, MongoDB, testing, and API design experience.");
    form.append("resume", new Blob([validPdfBuffer()], { type: "application/pdf" }), "resume.pdf");
    const createResponse = await request("/api/interview/", { method: "POST", body: form }, ownerCookie);
    assert.equal(createResponse.status, 201);
    const created = await json(createResponse);
    reportId = created.interviewReport._id;
    assert.ok(reportId);

    const getResponse = await request(`/api/interview/report/${reportId}`, {}, ownerCookie);
    assert.equal(getResponse.status, 200);
    const fetched = await json(getResponse);
    assert.equal(fetched.interviewReport._id, reportId);
});

test("evaluates an answer and persists evaluation history", {
    skip: !canRunAiTests && "NOT RUN: requires TEST_MONGO_URI, TEST_JWT_SECRET, Gemini key, and free quota"
}, async () => {
    const report = await reportModel.findById(reportId);
    const question = report.technicalQuestions[0] || report.behavioralQuestions[0] || report.projectQuestions[0];
    assert.ok(question, "AI report did not include a question");

    const response = await request(`/api/interview/report/${reportId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question: question.question,
            answer: "I would explain the design, tradeoffs, error handling, and testing strategy using only the experience shown in my resume."
        })
    }, ownerCookie);
    assert.equal(response.status, 201);
    const result = await json(response);
    assert.ok(result.evaluation.score >= 0 && result.evaluation.score <= 10);
    assert.ok(result.evaluation.improvedAnswer);
});

test("prevents cross-user access and deletes only the owner report", {
    skip: !canRunLiveTests && "NOT RUN: set TEST_MONGO_URI and TEST_JWT_SECRET"
}, async () => {
    if (!reportId) return;
    const other = await registerUser("other");
    const forbiddenGet = await request(`/api/interview/report/${reportId}`, {}, other.cookie);
    assert.equal(forbiddenGet.status, 404);
    const forbiddenDelete = await request(`/api/interview/report/${reportId}`, { method: "DELETE" }, other.cookie);
    assert.equal(forbiddenDelete.status, 404);

    const download = await request(`/api/interview/report/${reportId}/download`, {}, ownerCookie);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-type"), "application/pdf");

    const deleted = await request(`/api/interview/report/${reportId}`, { method: "DELETE" }, ownerCookie);
    assert.equal(deleted.status, 200);
    const missing = await request(`/api/interview/report/${reportId}`, {}, ownerCookie);
    assert.equal(missing.status, 404);
});

test.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState) await mongoose.disconnect();
});
