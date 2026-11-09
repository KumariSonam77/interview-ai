import React, { useState } from "react";
import { useLocation } from "react-router";
import "../style/interview.scss";

const interviewData = {
  matchScore: 85,
  technicalQuestions: [
    {
      question: "Can you explain how you integrated React.js and Next.js in your Healthcare Appointment Booking System (HABS)?",
      intention: "To assess the candidate's practical experience with modern frontend frameworks.",
      answer: "In HABS, I used React.js and Next.js to build dynamic UI components and handle responsive layouts. Next.js helped with routing and performance optimizations, while React managed the interactive state for booking appointments.",
    },
    {
      question: "How do you connect a Node.js and Express.js backend to a MongoDB database?",
      intention: "To verify core backend knowledge of the MERN stack.",
      answer: "We connect by using Mongoose or the native MongoDB driver in Node.js. We initialize a connection string pointing to the MongoDB cluster using Express, and handle asynchronous connection promises to ensure the server is successfully connected.",
    },
    {
      question: "What is the role of RESTful APIs in web applications, and how have you implemented them?",
      intention: "To test understanding of API design and integration.",
      answer: "RESTful APIs act as a bridge between the frontend and backend using standard HTTP methods like GET, POST, PUT, and DELETE. I have implemented API endpoints using Express.js and consumed them on the frontend using JavaScript and React.",
    },
  ],
  behavioralQuestions: [
    {
      question: "Can you describe a challenging bug you faced during your projects and how you resolved it?",
      intention: "To evaluate problem-solving and debugging skills.",
      answer: "During the development of Trinetra, I faced memory optimization issues with Python scripts. I analyzed the data processing loops, removed redundant variables, and optimized data structures to ensure clean and efficient execution.",
    },
    {
      question: "How do you manage your time while balancing your B.Tech CSE studies and building full-stack projects?",
      intention: "To assess time management and dedication to learning software development.",
      answer: "I set clear daily and weekly goals, prioritizing my coursework alongside hands-on coding. Applying what I learn in class directly to projects like HABS helps me reinforce concepts efficiently.",
    },
  ],
  skillGaps: [
    { skill: "JWT Authentication", severity: "medium" },
    { skill: "Advanced Production-Level Express.js Architecture", severity: "low" },
  ],
  preparationPlan: [
    {
      day: 1,
      focusArea: "MERN Stack Core & Architecture",
      tasks: [
        "Review Express.js routing and middleware concepts.",
        "Practice setting up a basic Node, Express, and MongoDB boilerplate.",
        "Understand the request-response lifecycle in REST APIs.",
      ],
    },
    {
      day: 2,
      focusArea: "Authentication & Security",
      tasks: [
        "Learn how JWT (JSON Web Tokens) work for user authentication.",
        "Implement user registration and login endpoints with password hashing (bcrypt).",
        "Protect backend routes using authentication middleware.",
      ],
    },
    {
      day: 3,
      focusArea: "React.js State Management & API Integration",
      tasks: [
        "Review React hooks (useState, useEffect) for data fetching.",
        "Practice connecting a React frontend to a local Express backend.",
        "Review state management best practices for forms and UI responsiveness.",
      ],
    },
    {
      day: 4,
      focusArea: "Debugging & Git Workflow",
      tasks: [
        "Practice common debugging techniques in Node and React.",
        "Review Git commands for branching, committing, and resolving merge conflicts.",
        "Prepare walkthroughs for the HABS and Trinetra projects.",
      ],
    },
  ],
};

const sections = [
  { id: "technical", label: "Technical questions" },
  { id: "behavioral", label: "Behavioral questions" },
  { id: "roadmap", label: "Road Map" },
];

const Interview = () => {
  const location = useLocation();
  const data = location.state?.interview ?? interviewData;
  const [activeSection, setActiveSection] = useState("technical");
  const [activeQuestion, setActiveQuestion] = useState(0);

  const questions =
    activeSection === "technical"
      ? data.technicalQuestions
      : data.behavioralQuestions;

  const renderQuestions = () => (
    <div className="question-view">
      <div className="question-header">
        <div>
          <p className="eyebrow">Practice session</p>
          <h1>{activeSection === "technical" ? "Technical questions" : "Behavioral questions"}</h1>
        </div>
        <span className="question-count">{questions.length} questions</span>
      </div>

      <div className="question-list" role="tablist" aria-label="Interview questions">
        {questions.map((item, index) => (
          <button
            className={`question-tab ${index === activeQuestion ? "active" : ""}`}
            key={item.question}
            onClick={() => setActiveQuestion(index)}
            role="tab"
            type="button"
            aria-selected={index === activeQuestion}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.question}</strong>
          </button>
        ))}
      </div>

      <article className="answer-card">
        <div className="answer-card-topline">
          <span>Question {activeQuestion + 1}</span>
          <span className="score-pill">Suggested answer</span>
        </div>
        <h2>{questions[activeQuestion].question}</h2>
        <div className="answer-section">
          <p className="section-label">Why this is asked</p>
          <p>{questions[activeQuestion].intention}</p>
        </div>
        <div className="answer-section answer-copy">
          <p className="section-label">Answer guide</p>
          <p>{questions[activeQuestion].answer}</p>
        </div>
      </article>
    </div>
  );

  const renderRoadmap = () => (
    <div className="question-view roadmap-view">
      <div className="question-header">
        <div>
          <p className="eyebrow">Your preparation plan</p>
          <h1>Road Map</h1>
        </div>
        <span className="question-count">{data.preparationPlan.length} days</span>
      </div>
      <div className="roadmap-list">
        {data.preparationPlan.map((day) => (
          <article className="roadmap-day" key={day.day}>
            <span className="day-number">{String(day.day).padStart(2, "0")}</span>
            <div>
              <h2>{day.focusArea}</h2>
              <ul>
                {day.tasks.map((task) => <li key={task}>{task}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <main className="interview-page">
      <header className="interview-header">
        <a className="brand" href="/home" aria-label="Interview AI home">
          <span className="brand-mark">i</span>
          <span>interview<span className="brand-accent">.ai</span></span>
        </a>
        <nav className="home-nav" aria-label="Main navigation">
          <a href="/home">Dashboard</a>
          <a className="active" href="/home">My interviews</a>
          <button className="profile-button" type="button" aria-label="Open profile">SK</button>
        </nav>
      </header>

      <section className="interview-shell">
        <aside className="interview-sidebar" aria-label="Interview sections">
          <div className="sidebar-heading">
            <span className="sidebar-kicker">Interview review</span>
            <strong>Full-stack developer</strong>
          </div>
          <nav className="section-nav">
            {sections.map((section) => (
              <button
                className={activeSection === section.id ? "active" : ""}
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setActiveQuestion(0);
                }}
                type="button"
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-score">
            <span>Match score</span>
            <strong>{data.matchScore}%</strong>
            <div className="score-track"><span style={{ width: `${data.matchScore}%` }} /></div>
          </div>
        </aside>

        <section className="interview-main">
          {activeSection === "roadmap" ? renderRoadmap() : renderQuestions()}
        </section>

        <aside className="skills-panel">
          <div className="panel-title">
            <p className="eyebrow">Focus areas</p>
            <h2>Skill gaps</h2>
          </div>
          <div className="skill-list">
            {data.skillGaps.map((gap) => (
              <span className={`skill-tag ${gap.severity}`} key={gap.skill}>
                {gap.skill}
              </span>
            ))}
          </div>
          <div className="panel-tip">
            <span aria-hidden="true">✦</span>
            <p>Review these areas before your next practice round.</p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Interview;
