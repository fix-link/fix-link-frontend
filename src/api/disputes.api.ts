import api, { parseError } from "./auth.api";

export const createDispute = async (jobId: string, againstUserId: string, reason: string, description: string) => {
    try {
        const response = await api.post(`/disputes/`, {
            job: jobId,
            against: againstUserId,
            reason: reason,
            description: description
        });
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};

export const listDisputes = async () => {
    try {
        const response = await api.get(`/disputes/`);
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};
