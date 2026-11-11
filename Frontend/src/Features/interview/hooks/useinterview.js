import { getAllInterviewReports, generateInterviewReport, getInterviewReportById } from "../services/interview.api";
import {useCallback, useContext} from "react";
import {InterviewContext} from "../interview.context"


export const useInterview = () => {
    const context = useContext(InterviewContext)
    if(!context){
        throw new Error("useInterview must be used within an InterviewProvider")
    }
    const {loading,setLoading,report,setReport,reports,setReports,error,setError} = context

    const generateReport = async ({jobDescription, resumeFile}) => {
        setLoading(true)
        setError("")
        let response = null;
        try {
            response = await generateInterviewReport({jobDescription, resume: resumeFile})
                if (response?.interviewReport){
            setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Error generating interview report:", error)
            setError(error.response?.data?.message || "Unable to generate your report. Please try again.")
        } finally {
            setLoading(false)
        }
        return response?.interviewReport || null
}

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        setError("")
        let response = null;
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.error("Error fetching interview report by ID:", error)
            setError(error.response?.data?.message || "Unable to load this report.")
        } finally {
            setLoading(false)
        }
        return response?.interviewReport || null
    }, [setError, setLoading, setReport])

    const getAllReports = useCallback(async (params = {}) => {
        setLoading(true)
        setError("")
        let response = null;
        try {
            response = await getAllInterviewReports(params)
            setReports(response.interviewReports)
        } catch (error) {
            console.error("Error fetching all interview reports:", error)
            setError(error.response?.data?.message || "Unable to load your report history.")
        } finally {
            setLoading(false)
        }
        return response?.interviewReports || []
    }, [setError, setLoading, setReports])

    return {loading,report,reports,error,generateReport,getReportById,getAllReports}
}