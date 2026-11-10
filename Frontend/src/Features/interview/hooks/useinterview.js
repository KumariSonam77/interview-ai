import { getAllInterviewReports, generateInterviewReport, getInterviewReportById } from "../services/interview.api";
import {useContext} from "react";
import {InterviewContext} from "../interview.context"


export const useInterview = () => {
    const context = useContext(InterviewContext)
    if(!context){
        throw new Error("useInterview must be used within an InterviewProvider")
    }
    const {loading,setLoading,report,setReport,reports,setReports} = context

    const generateReport = async ({jobDescription, resumeFile}) => {
        setLoading(true)
        let response = null;
        try {
            const response = await generateInterviewReport({jobDescription, resume: resumeFile})
            if (data){
            setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Error generating interview report:", error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
}

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null;
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.error("Error fetching interview report by ID:", error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getAllReports = async () => {
        setLoading(true)
        let response = null;
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.error("Error fetching all interview reports:", error)
        } finally {
            setLoading(false)
        }
        return response.interviewReports
    }

    return {loading,report,reports,generateReport,getReportById,getAllReports}
}