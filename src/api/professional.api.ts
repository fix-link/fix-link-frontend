import { api } from "./auth.api";

export const getProfessionalDashboard = async () => {
  return {
    pendingJobs: 2,
    completedJobs: 14,
    rating: 4.8,
  };
};

export const getProfessionalDetails = async () => {
  const response = await api.get("/users/professional-detail/");
  return response.data;
};
