const mongoose = require('mongoose');


/**
 * job description:String
 * resume text:String
 * self description:String
 * matchScore:Number
 * 
 * Technical questions:[{question:"",intension:"", answer:""}]
 * Behavioral questions:[{question:"",intension:"", answer:""}]
* Skill gaps:[{skill:"",severity:"",type:"String",enum:["low","medium","high"]}]
 * Preparation plan:[{day:Number,focus:String,tasks:[String]}]
 */

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question is required']
    },
    intention: {
    type: String,
    required: [true, 'Intention is required']
},
    answer: {
        type: String,
        required: [true, 'Answer is required']
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    }
},{
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
       question: {
        type: String,
        required: [true, 'Question is required']
    },
    intention: {
    type: String,
    required: [true, 'Intention is required']
},
    answer: {
        type: String,
        required: [true, 'Answer is required']
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    }
},{
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, 'Skill is required']
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: [true, 'Severity is required']
    },
},{
    _id: false
})

const projectQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    intention: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    }
}, { _id: false })

const skillEvidenceSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    evidence: { type: String, required: true }
}, { _id: false })

const answerEvaluationSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    score: { type: Number, min: 0, max: 10, required: true },
    dimensions: {
        technicalAccuracy: { type: Number, min: 0, max: 10, required: true },
        relevance: { type: Number, min: 0, max: 10, required: true },
        clarity: { type: Number, min: 0, max: 10, required: true },
        completeness: { type: Number, min: 0, max: 10, required: true },
        communication: { type: Number, min: 0, max: 10, required: true }
    },
    strengths: { type: [String], required: true },
    weaknesses: { type: [String], required: true },
    suggestions: { type: [String], required: true },
    improvedAnswer: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: true })

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, 'Day is required']
    },
    focusArea: {
    type: String,
    required: [true, 'Focus area is required']
},
    tasks: [{
        type: String,
        required: [true, 'Task is required']
    }]
})

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [true, 'Job description is required']
    },
    resume: {
        type: String,
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min:0,
        max:100,
    },
    matchExplanation: String,
    matchedSkills: [skillEvidenceSchema],
    partialSkills: [skillEvidenceSchema],
    resumeStrengths: [String],
    improvementSuggestions: [String],
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    projectQuestions: [projectQuestionSchema],
    answerEvaluations: [answerEvaluationSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    }
}, {
    timestamps: true
})

const interviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = interviewReportModel;