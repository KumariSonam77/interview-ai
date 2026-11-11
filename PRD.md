# Interview AI Product Requirements Document

## Product overview

Interview AI helps candidates turn a resume and target job description into a personalized interview preparation workspace. It combines saved reports, practice questions, AI answer feedback, and a preparation roadmap.

## Problem statement

Candidates often prepare with generic questions that do not reflect their resume or the role they want. They need a focused way to identify evidence gaps, practice relevant questions, and receive actionable feedback without repeatedly rebuilding their preparation plan.

## Target users

- Students preparing for internships and entry-level roles.
- Developers changing jobs or targeting a new specialization.
- Candidates who want resume-grounded technical and behavioral practice.

## Core features

### Implemented

- Account registration, login, logout, and protected routes.
- PDF resume upload and parsing.
- Gemini-powered report generation using `gemini-3.5-flash-lite`.
- Evidence-based match score and explanation.
- Matched, partial, and missing skill analysis.
- Technical, behavioral, and project questions with suggested answers.
- Question difficulty levels and preparation roadmap.
- Saved MongoDB reports and authenticated report history.
- Report search, score filtering, sorting, opening, deletion, and PDF download.
- AI answer evaluator with score dimensions, feedback, improved answer, and saved evaluation history.
- Responsive dark/pink SaaS-style UI.

### Planned

- Company-name extraction and explicit company field in the report schema.
- Automated end-to-end tests with a disposable MongoDB instance.
- Profile editing and account deletion.
- Richer PDF pagination and branded export templates.
- Optional report tagging and date-range filters.

## User workflows

1. Register or log in.
2. Upload a PDF resume and paste a job description.
3. Generate one AI report; save it in MongoDB.
4. Review the overview, skills, questions, project questions, and roadmap.
5. Select a question and submit an original answer for evaluation.
6. Review saved attempts and retry the question.
7. Return to history to search, filter, open, download, or delete reports.

## Functional requirements

- The system must require authentication for private report operations.
- A report request must include a valid PDF resume and job description.
- The backend must keep the Gemini key out of frontend code.
- The configured AI model must remain `gemini-3.5-flash-lite`.
- Generated reports and answer evaluations must be saved to MongoDB.
- Users must only access, download, evaluate, or delete their own reports.
- Existing reports must be loaded from MongoDB without another AI request.
- Quota, missing-key, invalid-input, and missing-record errors must be explicit.
- Report history must support search, score filtering, and sorting.

## Non-functional requirements

- Preserve the free-tier-only AI constraint.
- Keep API responses validated and avoid exposing resume text in history listings.
- Enforce a 3 MB PDF upload limit.
- Maintain responsive layouts for mobile and desktop.
- Prefer existing dependencies and concise, maintainable modules.
- Never store secrets in source control.

## Acceptance criteria

- A valid authenticated user can generate and later reopen a saved report.
- An unauthenticated request to a private endpoint is rejected.
- A user cannot retrieve, download, evaluate, or delete another user’s report.
- Invalid files and insufficient job descriptions receive validation errors.
- A saved report can be searched, filtered, sorted, downloaded, and deleted.
- An answer evaluation returns a score, dimensions, strengths, weaknesses, suggestions, and improved answer.
- Frontend build and lint complete successfully.
- Backend modules pass syntax and load checks.
- Live AI and database tests are run only when credentials, quota, and MongoDB are available.

## Current limitations

- The current environment does not provide a live MongoDB integration test run.
- The current environment does not provide valid Gemini credentials/quota for live AI testing.
- The backend test script is still a placeholder.
- Company name is not represented as a first-class report field.
- PDF export is intentionally lightweight and text-focused.

## Future improvements

- Add automated API tests using isolated test data.
- Add rate limiting and request observability.
- Add structured company and role metadata.
- Add richer export formatting and downloadable evaluation summaries.
- Add user profile and preferences.
