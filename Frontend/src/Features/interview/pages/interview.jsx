import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import "../style/interview.scss";
import { useInterview } from "../hooks/useinterview";
import { evaluateInterviewAnswer } from "../services/interview.api";
import { deleteInterviewReport, downloadInterviewReport } from "../services/interview.api";

const sections = [
  { id: "overview", label: "Report overview" },
  { id: "technical", label: "Technical questions" },
  { id: "behavioral", label: "HR & behavioral" },
  { id: "projects", label: "Project questions" },
  { id: "roadmap", label: "Preparation roadmap" },
];

const QuestionList = ({ title, questions, activeQuestion, setActiveQuestion }) => {
  const question = questions[activeQuestion];
  if (!questions.length) return <div className="state-card">No questions were returned for this section.</div>;

  return (
    <div className="question-view">
      <div className="question-header">
        <div><p className="eyebrow">Practice session</p><h1>{title}</h1></div>
        <span className="question-count">{questions.length} questions</span>
      </div>
      <div className="question-list" role="tablist">
        {questions.map((item, index) => (
          <button className={`question-tab ${index === activeQuestion ? "active" : ""}`} key={item.question} onClick={() => setActiveQuestion(index)} type="button">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.question}</strong>
            <em className={`difficulty ${item.difficulty || "medium"}`}>{item.difficulty || "medium"}</em>
          </button>
        ))}
      </div>
      <article className="answer-card">
        <div className="answer-card-topline"><span>Question {activeQuestion + 1}</span><span className={`difficulty ${question.difficulty || "medium"}`}>{question.difficulty || "medium"}</span></div>
        <h2>{question.question}</h2>
        <div className="answer-section"><p className="section-label">Why this is asked</p><p>{question.intention}</p></div>
        <div className="answer-section answer-copy"><p className="section-label">Suggested answer</p><p>{question.answer}</p></div>
      </article>
    </div>
  );
};

const EvidenceList = ({ title, items, tone }) => (
  <div className={`evidence-panel ${tone || ""}`}>
    <h3>{title}</h3>
    {items?.length ? <ul>{items.map((item) => <li key={item.skill}><strong>{item.skill}</strong><span>{item.evidence}</span></li>)}</ul> : <p className="muted">No items identified in the generated report.</p>}
  </div>
);

const AnswerEvaluator = ({ interviewId, question, evaluations, onEvaluated }) => {
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const attempts = evaluations.filter((item) => item.question === question.question);

  const submitAnswer = async (event) => {
    event.preventDefault();
    if (answer.trim().length < 20) {
      setError("Write at least 20 characters so the coach can evaluate your answer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await evaluateInterviewAnswer(interviewId, { question: question.question, answer });
      setEvaluation(data.evaluation);
      setAnswer("");
      onEvaluated(data.evaluation);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to evaluate this answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="evaluator-card" aria-labelledby="evaluator-title">
      <div className="evaluator-heading"><div><p className="eyebrow">Practice out loud</p><h2 id="evaluator-title">Evaluate your answer</h2></div><span className="evaluator-hint">Free-tier AI evaluation</span></div>
      <p className="evaluator-copy">Write your own response, then get feedback on accuracy, relevance, clarity, completeness, and communication.</p>
      <form onSubmit={submitAnswer}>
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write how you would answer this question..." maxLength={8000} rows={5} />
        <div className="evaluator-actions"><span>{answer.length.toLocaleString()} / 8,000</span><button className="button primary-button" type="submit" disabled={loading}>{loading ? "Evaluating..." : "Submit answer"} <span>→</span></button></div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {evaluation && <EvaluationResult evaluation={evaluation} />}
      {!!attempts.length && <div className="attempt-history"><strong>Previous attempts</strong>{attempts.slice().reverse().map((attempt) => <span key={attempt._id || attempt.createdAt}>{attempt.score}/10 · {new Date(attempt.createdAt).toLocaleDateString()}</span>)}</div>}
    </section>
  );
};

const EvaluationResult = ({ evaluation }) => (
  <div className="evaluation-result">
    <div className="evaluation-score"><strong>{evaluation.score}</strong><span>/10 score</span></div>
    <div className="dimension-grid">{Object.entries(evaluation.dimensions || {}).map(([name, value]) => <div key={name}><span>{name.replace(/([A-Z])/g, " $1")}</span><b>{value}/10</b><i><em style={{ width: `${value * 10}%` }} /></i></div>)}</div>
    <div className="evaluation-columns">
      <div><h3>Strengths</h3><ul>{evaluation.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div><h3>Improve next</h3><ul>{[...evaluation.weaknesses, ...evaluation.suggestions].map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div>
    <div className="improved-answer"><h3>Improved sample answer</h3><p>{evaluation.improvedAnswer}</p></div>
  </div>
);

const Interview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { report, loading, error, getReportById } = useInterview();
  const [activeSection, setActiveSection] = useState("overview");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [evaluations, setEvaluations] = useState([]);
  const [managementError, setManagementError] = useState("");

  useEffect(() => {
    if (!report || report._id !== interviewId) getReportById(interviewId);
  }, [getReportById, interviewId, report]);

  if (loading || !report) {
    return <main className="interview-page"><div className="state-card">{error || "Loading your personalized report..."}</div></main>;
  }

  const score = Math.round(report.matchScore || 0);
  const savedEvaluations = evaluations.length ? evaluations : report.answerEvaluations || [];

  const handleDownload = async () => {
    try {
      const blob = await downloadInterviewReport(interviewId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.title || "interview-report"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setManagementError(requestError.response?.data?.message || "Unable to download this report.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this saved interview report? This cannot be undone.")) return;
    try {
      await deleteInterviewReport(interviewId);
      navigate("/home");
    } catch (requestError) {
      setManagementError(requestError.response?.data?.message || "Unable to delete this report.");
    }
  };
  const questions = activeSection === "technical" ? report.technicalQuestions || []
    : activeSection === "behavioral" ? report.behavioralQuestions || [] : report.projectQuestions || [];

  const renderOverview = () => (
    <div className="overview-view">
      <div className="question-header"><div><p className="eyebrow">Resume analysis</p><h1>What your report says</h1></div><span className="question-count">Evidence-based insights</span></div>
      <div className="analysis-grid">
        <EvidenceList title="Matched skills" items={report.matchedSkills} tone="positive" />
        <EvidenceList title="Partially matched" items={report.partialSkills} tone="partial" />
        <EvidenceList title="Missing or weak evidence" items={(report.skillGaps || []).map((item) => ({ ...item, evidence: `${item.severity} priority gap` }))} tone="gap" />
      </div>
      <div className="insight-grid">
        <div className="insight-card"><h3>Resume strengths</h3><ul>{(report.resumeStrengths || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="insight-card"><h3>Improvement suggestions</h3><ul>{(report.improvementSuggestions || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <div className="match-explanation"><p className="section-label">How to read your score</p><p>{report.matchExplanation || "The score reflects the evidence available in your resume compared with the supplied job description."}</p></div>
      <div className="evaluation-history-panel">
        <div className="panel-title"><p className="eyebrow">Practice history</p><h2>Previous answer evaluations</h2></div>
        {savedEvaluations.length ? <div className="evaluation-history-list">{savedEvaluations.slice().reverse().map((item) => <article key={item._id || `${item.question}-${item.createdAt}`}><div><strong>{item.question}</strong><span>{new Date(item.createdAt).toLocaleDateString()}</span></div><b>{item.score}/10</b><p>{item.suggestions?.[0] || item.weaknesses?.[0] || "Review the detailed feedback in the practice section."}</p></article>)}</div> : <p className="muted">Your evaluated answers will appear here after your first practice attempt.</p>}
      </div>
    </div>
  );

  const renderRoadmap = () => (
    <div className="question-view roadmap-view">
      <div className="question-header"><div><p className="eyebrow">Next steps</p><h1>Preparation roadmap</h1></div><span className="question-count">{report.preparationPlan?.length || 0} days</span></div>
      <div className="roadmap-list">{(report.preparationPlan || []).map((day) => <article className="roadmap-day" key={day.day}><span className="day-number">{String(day.day).padStart(2, "0")}</span><div><h2>{day.focusArea}</h2><ul>{day.tasks.map((task) => <li key={task}>{task}</li>)}</ul></div></article>)}</div>
    </div>
  );

  return (
    <main className="interview-page">
      <header className="interview-header">
        <Link className="brand" to="/home" aria-label="Interview AI home"><span className="brand-mark">i</span><span>interview<span className="brand-accent">.ai</span></span></Link>
        <nav className="home-nav" aria-label="Main navigation"><Link to="/home">Dashboard</Link><Link className="active" to={`/interview/${interviewId}`}>Report</Link></nav>
      </header>
      <section className="report-intro">
        <div><p className="eyebrow">Interview report</p><h1>{report.title}</h1><p>Generated {new Date(report.createdAt).toLocaleDateString()}</p></div>
        <div className="score-hero"><strong>{score}%</strong><span>job match</span></div>
      </section>
      <div className="report-actions"><button type="button" onClick={handleDownload}>Download PDF</button><button type="button" onClick={handleDelete}>Delete report</button></div>
      {managementError && <p className="form-error report-management-error" role="alert">{managementError}</p>}
      <section className="interview-shell">
        <aside className="interview-sidebar" aria-label="Interview sections">
          <div className="sidebar-heading"><span className="sidebar-kicker">Review plan</span><strong>{score >= 70 ? "Strong starting point" : "Targeted growth plan"}</strong></div>
          <nav className="section-nav">{sections.map((section) => <button className={activeSection === section.id ? "active" : ""} key={section.id} onClick={() => { setActiveSection(section.id); setActiveQuestion(0); }} type="button">{section.label}</button>)}</nav>
          <div className="sidebar-score"><span>Job match</span><strong>{score}%</strong><div className="score-track"><span style={{ width: `${score}%` }} /></div></div>
        </aside>
        <section className="interview-main">
          {activeSection === "overview" ? renderOverview() : activeSection === "roadmap" ? renderRoadmap() : <><QuestionList title={activeSection === "technical" ? "Technical questions" : activeSection === "behavioral" ? "HR & behavioral questions" : "Project-based questions"} questions={questions} activeQuestion={activeQuestion} setActiveQuestion={setActiveQuestion} />{questions.length > 0 && <AnswerEvaluator interviewId={interviewId} question={questions[activeQuestion]} evaluations={savedEvaluations} onEvaluated={(item) => setEvaluations((current) => [...current, item])} />}</>}
        </section>
        <aside className="skills-panel"><div className="panel-title"><p className="eyebrow">Focus areas</p><h2>Skills to strengthen</h2></div><div className="skill-list">{(report.skillGaps || []).map((gap) => <span className={`skill-tag ${gap.severity}`} key={gap.skill}>{gap.skill}</span>)}</div><div className="panel-tip"><span>✦</span><p>Use these gaps to prioritize your next study session.</p></div></aside>
      </section>
    </main>
  );
};

export default Interview;
