import api, { parseError } from "./auth.api";

/**
 * Create a new job
 * V2 Swagger: POST /jobs/ (title, description, service UUID required)
 */
export const createJob = async (jobData: any) => {
    try {
        const hasFiles = jobData.photos && jobData.photos.length > 0;
        
        if (hasFiles) {
            const fd = new FormData();
            fd.append("title", jobData.title || "Job Request");
            fd.append("description", jobData.description || "");
            if (jobData.service) fd.append("service", String(jobData.service));
            if (jobData.address) fd.append("address", jobData.address);
            if (jobData.scheduled_at) fd.append("scheduled_at", jobData.scheduled_at);
            if (jobData.budget) fd.append("budget", String(jobData.budget));
            if (jobData.assigned_to) fd.append("assigned_to", String(jobData.assigned_to));

            // Append multiple photos
            jobData.photos.forEach((photo: File, index: number) => {
                fd.append(`image_${index}`, photo); // Or just 'images' depending on backend
                // If backend expects 'images' field multiple times:
                fd.append("images", photo);
            });

            console.log("createJob: Sending FormData...");
            const response = await api.post("/jobs/", fd);
            return response.data;
        }

        // JSON fallback
        const payload = {
            title: jobData.title,
            description: jobData.description,
            service: jobData.service,
            address: jobData.address,
            scheduled_at: jobData.scheduled_at,
            budget: jobData.budget,
            assigned_to: jobData.assigned_to
        };
        console.log("createJob: Sending JSON payload:", payload);
        const response = await api.post("/jobs/", payload);
        return response.data;
    } catch (error: any) {
        // ... rest of error handling
        console.error("createJob: FULL ERROR OBJECT:", error);
        if (error.response) {
            console.error("createJob: ERROR RESPONSE DATA:", error.response.data);
            console.error("createJob: ERROR STATUS:", error.response.status);
        }
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

/**
 * Assign a professional to a job
 * V2 Endpoint: PATCH /jobs/{id}/ (assigned_to UUID in payload)
 */
export const assignProfessional = async (jobId: string, professionalId: string) => {
    try {
        const response = await api.patch(`/jobs/${jobId}/`, { 
            assigned_to: professionalId 
        });
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};
/**
 * Update job status using the correct backend action endpoints (confirmed from Swagger & Developer docs).
 *
 * Status transitions:
 *   accepted    - POST /jobs/{id}/accept-assigned/  (fallback: /accept-bid/)
 *   cancelled   - POST /jobs/{id}/cancel/
 *   in_progress - POST /jobs/{id}/start/           <- Professional starts work
 *   done        - POST /jobs/{id}/request_complition/ <- Professional marks work finished
 *   completed   - POST /jobs/{id}/confirm_completion/ <- Customer approves & releases escrow
 *   booked      - POST /jobs/{id}/book/               <- Set after payment confirmed
 */
export const updateJobStatus = async (jobId: string, status: string) => {
    console.log(`updateJobStatus: ${jobId} -> ${status}`);

    const actionMap: Record<string, string> = {
        'accepted':    'accept-assigned',
        'cancelled':   'cancel',
        'in_progress': 'start',
        'done':        'mark-done',
        'completed':   'confirm-completion',
        'booked':      'book',
    };

    const action = actionMap[status];

    if (action) {
        try {
            const res = await api.post(`/jobs/${jobId}/${action}/`);
            console.log(`updateJobStatus: POST /${action}/ success`, res.data);
            return res.data;
        } catch (e1: any) {
            // Special fallback for 'accepted': try accept-bid/ if accept-assigned/ fails
            if (status === 'accepted') {
                try {
                    const res = await api.post(`/jobs/${jobId}/accept-bid/`);
                    return res.data;
                } catch (e2: any) {} // let it fall through to generic fallback
            }

            const msg = e1?.response?.data?.detail || e1?.response?.data?.error || e1?.message;
            console.error(`updateJobStatus: POST /${action}/ failed`, e1?.response?.data);
            throw new Error(msg || `Failed to update job to ${status}`);
        }
    }

    // Fallback for any unmapped status: try PATCH
    try {
        const res = await api.patch(`/jobs/${jobId}/`, { status });
        console.log(`updateJobStatus: PATCH ${status} success`, res.data);
        return res.data;
    } catch (e: any) {
        const msg = e?.response?.data?.detail || e?.response?.data?.error || e?.message;
        console.error(`updateJobStatus: all methods failed for ${status}`, e?.response?.data);
        throw new Error(msg || `Failed to update job to ${status}`);
    }
};
