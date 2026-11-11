import React,{useEffect, useState, useRef} from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useinterview";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth";
import { deleteInterviewReport } from "../services/interview.api";

const Home = () => {

  const {loading,error: apiError,generateReport,reports,getAllReports} = useInterview()
  const {user,handleLogout} = useAuth()
  const [jobDescription, setJobDescription] = useState("")
  const resumeInputRef = useRef()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [search, setSearch] = useState("")
  const [minScore, setMinScore] = useState("")
  const [sort, setSort] = useState("newest")
  const [historyError, setHistoryError] = useState("")
  const averageScore = reports.length
    ? Math.round(reports.reduce((total, report) => total + (report.matchScore || 0), 0) / reports.length)
    : 0

  useEffect(() => {
    getAllReports({ search, minScore, sort })
  }, [getAllReports, minScore, search, sort])

  const handleDelete = async (reportId) => {
    if (!window.confirm("Delete this saved interview report? This cannot be undone.")) return
    try {
      await deleteInterviewReport(reportId)
      getAllReports({ search, minScore, sort })
    } catch (requestError) {
      setHistoryError(requestError.response?.data?.message || "Unable to delete this report.")
    }
  }

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0]
    if (!resumeFile || !jobDescription.trim()) {
      setError("Add a job description and PDF resume before generating.")
      return
    }
    setError("")
    const data=await generateReport({jobDescription, resumeFile})
    if (data?._id) navigate(`/interview/${data._id}`)
  }
  return (
    <main className="home">
      <header className="home-header">
        <a className="brand" href="/home" aria-label="Interview AI home">
          <span className="brand-mark">i</span>
          <span>interview<span className="brand-accent">.ai</span></span>
        </a>

        <nav className="home-nav" aria-label="Main navigation">
          <a className="active" href="/home">Dashboard</a>
          <a href="/home">My interviews</a>
          <span className="user-name">{user?.username}</span>
          <button className="profile-button" type="button" onClick={handleLogout} aria-label="Sign out">↗</button>
        </nav>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
          <div className="sidebar-brand"><span className="brand-mark">i</span><strong>interview<span>.ai</span></strong></div>
          <p className="sidebar-label">Workspace</p>
          <nav className="sidebar-nav">
            <Link className="active" to="/home"><span className="nav-icon">01</span> Dashboard</Link>
            <a href="#setup"><span className="nav-icon">02</span> Create interview</a>
            <a href="#history"><span className="nav-icon">03</span> My interviews</a>
            <a href="#history"><span className="nav-icon">04</span> Reports</a>
          </nav>
          <div className="sidebar-divider" />
          <div className="sidebar-profile"><span className="avatar">{user?.username?.[0]?.toUpperCase() || "C"}</span><span><strong>{user?.username || "Candidate"}</strong><small>Profile</small></span></div>
          <div className="sidebar-footer">
            <button type="button" onClick={handleLogout}>Sign out <span>↗</span></button>
          </div>
        </aside>
        <div className="home-content">
        <div className="welcome">
          <div>
            <p className="eyebrow">Workspace / Dashboard</p>
            <h1>Good to see you, <span className="highlight">{user?.username || "candidate"}.</span></h1>
            <p className="welcome-copy">
              Turn your experience into your next opportunity with focused,
              evidence-based interview practice.
            </p>
          </div>
          <div className="welcome-meta"><span className="status-dot" />AI coach ready</div>
        </div>

        <div className="stats-grid" aria-label="Interview statistics">
          <article className="stat-panel"><span className="stat-label">Total interviews</span><strong>{reports.length}</strong><small>Saved reports</small></article>
          <article className="stat-panel"><span className="stat-label">Average match</span><strong>{averageScore}%</strong><small>{reports.length ? "Across your reports" : "No reports yet"}</small></article>
          <article className="stat-panel stat-panel-accent"><span className="stat-label">Next best step</span><strong>Practice</strong><small>Review your latest report</small></article>
        </div>

        <section className="interview-card" id="setup" aria-labelledby="setup-title">
          <div className="card-heading">
            <div>
              <p className="card-kicker">Let&apos;s get started</p>
              <h2 id="setup-title">Build your practice session</h2>
            </div>
            <span className="required-note">* Required</span>
          </div>

          <div className="interview-input-group">
            <div className="left">
              <label htmlFor="jobDescription">Job description <span>*</span></label>
              <p className="field-help">Paste the role details so your questions match the position.</p>
              <textarea
                name="jobDescription"
                id="jobDescription"
                placeholder="Paste the job description here..."
                value={jobDescription}
                maxLength={2000}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="field-footer">
                <span>Be as specific as possible</span>
                <span>{jobDescription.length.toLocaleString()} / 2,000</span>
              </div>
            </div>

            <div className="right">
              <div className="input-group">
                <label htmlFor="resume">Your resume <span>*</span></label>
                <p className="field-help">Upload a PDF to personalize your interview.</p>
                <label className="file-label" htmlFor="resume">
                  <span className="upload-icon" aria-hidden="true">↑</span>
                  <span>
                    <strong>{selectedFile?.name || "Upload your resume"}</strong>
                    <small>PDF files only, up to 5 MB</small>
                  </span>
                  <span className="browse-text">Browse</span>
                </label>
                <input ref={resumeInputRef} hidden type="file" name="resume" id="resume" accept=".pdf,application/pdf" onChange={(e) => setSelectedFile(e.target.files[0] || null)} />
              </div>

              <div className="options-row">
                <div className="select-group">
                  <label htmlFor="interviewType">Interview type</label>
                  <select id="interviewType" name="interviewType" defaultValue="technical">
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="mixed">Technical + behavioral</option>
                  </select>
                </div>
                <div className="select-group">
                  <label htmlFor="difficulty">Difficulty</label>
                  <select id="difficulty" name="difficulty" defaultValue="intermediate">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <p><span className="lock-icon" aria-hidden="true">+</span> Your information stays private and secure.</p>
          
            <button onClick={handleGenerateReport} className="button primary-button" type="button" disabled={loading}>
              {loading ? "Analyzing..." : "Generate interview"} <span aria-hidden="true">→</span>
            </button>
          </div>
          {(error || apiError) && <p className="form-error" role="alert">{error || apiError}</p>}
        </section>

        <section className="history-section" id="history" aria-labelledby="history-title">
          <div className="history-heading">
            <div>
              <p className="eyebrow">Your progress</p>
              <h2 id="history-title">Recent interview reports</h2>
            </div>
            <span className="stat-card"><strong>{reports.length}</strong><small>generated</small></span>
          </div>
          <div className="history-controls">
            <input aria-label="Search reports" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by job title..." />
            <select aria-label="Filter by match score" value={minScore} onChange={(event) => setMinScore(event.target.value)}>
              <option value="">All scores</option><option value="70">70% and above</option><option value="80">80% and above</option><option value="90">90% and above</option>
            </select>
            <select aria-label="Sort reports" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest first</option><option value="score">Highest score</option>
            </select>
          </div>
          {historyError && <p className="form-error" role="alert">{historyError}</p>}
          {reports.length ? <div className="report-grid">
            {reports.map((item) => (
              <article className="report-card" key={item._id}>
                <Link to={`/interview/${item._id}`}><span>{new Date(item.createdAt).toLocaleDateString()}</span><strong>{item.title}</strong><b>{item.matchScore}% match</b></Link>
                <button type="button" onClick={() => handleDelete(item._id)} aria-label={`Delete ${item.title}`}>Delete</button>
              </article>
            ))}
          </div> : <div className="empty-state"><strong>Your first report is one upload away.</strong><span>Generate a report to see your tailored preparation history here.</span></div>}
        </section>

        <p className="tip"><span aria-hidden="true">✦</span> Tip: Use the job description and resume together for the most personalized results.</p>
        </div>
      </div>
    </main>
  );
};

export default Home;
