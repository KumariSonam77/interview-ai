import React,{useState, useRef} from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useinterview";
import { useNavigate } from "react-router";

const Home = () => {

  const {loading,generateReport} = useInterview()
  const [jobDescription, setJobDescription] = useState("")
  const resumeInputRef = useRef()
  const navigate = useNavigate()

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0]
    const data=await generateReport({jobDescription, resumeFile})
    navigate(`/interview/${data.id}`)
  }
  if(loading){
    return <div>Loading...</div>
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
          <button className="profile-button" type="button" aria-label="Open profile">
            SK
          </button>
        </nav>
      </header>

      <section className="home-content">
        <div className="welcome">
          <div>
            <p className="eyebrow">AI interview coach</p>
            <h1>Prepare with <span className="highlight">confidence.</span></h1>
            <p className="welcome-copy">
              Turn your experience into your next opportunity. Share the role
              you&apos;re applying for and we&apos;ll build a focused practice session.
            </p>
          </div>
          <div className="welcome-illustration" aria-hidden="true">
            <span className="illustration-ring ring-one" />
            <span className="illustration-ring ring-two" />
            <span className="illustration-spark">✦</span>
            <span className="illustration-orb" />
          </div>
        </div>

        <div className="progress-row" aria-label="Interview setup progress">
          <div className="progress-step complete">
            <span className="step-number">1</span>
            <span>Set up your interview</span>
          </div>
          <span className="progress-line" />
          <div className="progress-step">
            <span className="step-number">2</span>
            <span>Practice and improve</span>
          </div>
        </div>

        <section className="interview-card" aria-labelledby="setup-title">
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
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="field-footer">
                <span>Be as specific as possible</span>
                <span>0 / 2,000</span>
              </div>
            </div>

            <div className="right">
              <div className="input-group">
                <label htmlFor="resume">Your resume <span>*</span></label>
                <p className="field-help">Upload a PDF to personalize your interview.</p>
                <label className="file-label" htmlFor="resume">
                  <span className="upload-icon" aria-hidden="true">↑</span>
                  <span>
                    <strong>Upload your resume</strong>
                    <small>PDF files only, up to 5 MB</small>
                  </span>
                  <span className="browse-text">Browse</span>
                </label>
                <input  ref={resumeInputRef} hidden type="file" name="resume" id="resume" accept=".pdf" />
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
            <p><span className="lock-icon" aria-hidden="true">⌁</span> Your information stays private and secure.</p>
          
            <button onClick={handleGenerateReport} className="button primary-button" type="button">
              Generate interview <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

        <p className="tip"><span aria-hidden="true">✦</span> Tip: Use the job description and resume together for the most personalized results.</p>
      </section>
    </main>
  );
};

export default Home;
