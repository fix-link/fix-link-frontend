import api, { parseError } from "./auth.api";

/**
 * Create a new job
 * V2 Swagger: POST /jobs/ (title, description, service UUID required)
 */
export const createJob = async (jobData: any) => {
    try {
        const payload = {
            title: jobData.title,
            description: jobData.description,
            service: jobData.service, // UUID of service category
            address: jobData.address,
            scheduled_at: jobData.scheduled_at,
            budget: jobData.budget
        };
        const response = await api.post("/jobs/", payload);
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};

/**
 * Get job details
 */
export const getJobDetails = async (id: string) => {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
};

/**
 * List jobs
 */
export const listJobs = async () => {
    const response = await api.get("/jobs/");
    return response.data;
};

/**
 * Get service categories
 */
export const getServiceCategories = async () => {
    const response = await api.get("/service-categories/");
    return response.data;
};

/**
 * Get list of all users/professionals
 * Note: Use /users/ instead of /users/professional-detail/ because the latter
 * is restricted to professionals viewing their own profile.
 */
export const getProfessionals = async () => {
    const response = await api.get("/users/");
    return response.data;
};

/**
 * Get job bids
 * V2 Endpoint: /job-bids/
 */
export const getJobBids = async (jobId?: string) => {
    const endpoint = jobId ? `/job-bids/?job=${jobId}` : `/job-bids/`;
    const response = await api.get(endpoint);
    return response.data;
};

/**
 * Place a bid on a job
 * V2 Endpoint: POST /job-bids/ (job UUID in payload)
 */
export const placeBid = async (jobId: string, amount: number, message?: string) => {
    try {
        const response = await api.post(`/job-bids/`, { 
            job: jobId,
            amount: amount,
            message: message 
        });
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};

/**
 * Accept a bid for a job
 * V2 Endpoint: PATCH /job-bids/{id}/ (status: accepted)
 */
export const acceptBid = async (bidId: string) => {
    try {
        const response = await api.patch(`/job-bids/${bidId}/`, { status: "accepted" });
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};
