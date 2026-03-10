import api from "./auth.api";
import type { Job } from "../types/auth.types";

/**
 * Create a new job
 */
export const createJob = async (jobData: Partial<Job>) => {
    try {
        const response = await api.post("/jobs/", jobData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.detail || "Failed to create job");
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
 * Get list of verified professionals
 */
export const getProfessionals = async () => {
    const response = await api.get("/users/professional-detail/");
    return response.data;
};
