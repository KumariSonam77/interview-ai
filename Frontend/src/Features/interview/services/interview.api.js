import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
});

/**
 * @description service to generate interview report by sending resume and job description to backend
 */
export const generateInterviewReport = async ({ resume, jobDescription }) => {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("resume",resume)

  const response = await api.post("/api/interview/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * @description service to get interview report by interviewId
 */
export const getInterviewReportById =async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`);
    return response.data;
}

/**
 * @description service to get all interview reports of the logged-in user
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/");
    return response.data;
}
