import axios from "axios";
import type { Role, User } from "../types/auth.types";

const API_URL = (import.meta.env.VITE_API_URL || "https://fix-link-5332f899c079.herokuapp.com").replace(/\/$/, "") + "/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Helper to get full image URL from backend path
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL.replace("/api", "")}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Add interceptor to include token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, token ? "With Token" : "No Token");
  // Guard against invalid/expired/undefined token strings
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleLogout = (error: any) => {
  console.error("Auth: Forced Logout - Reason:", error.response?.status, error.response?.data?.detail || error.message);

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");

  const path = window.location.pathname;
  const isAuthPage = path.includes("/login") || path.includes("/signup") || path.includes("/register") || path.includes("/verify");
  if (!isAuthPage) {
    window.location.href = "/login";
  }
  return Promise.reject(error);
};

// Add interceptor to handle 401 Unauthorized errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If a refresh is already in progress, queue the request
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        isRefreshing = false;
        return handleLogout(error);
      }

      try {
        // Try to fetch a new access token (backend requires double /api prefix here)
        const { data } = await axios.post(`${API_URL}/api/token/refresh/`, { refresh: refreshToken });
        
        localStorage.setItem("access_token", data.access);
        if (data.refresh) {
            localStorage.setItem("refresh_token", data.refresh); // If backend rotates refresh tokens
        }
        
        api.defaults.headers.common['Authorization'] = 'Bearer ' + data.access;
        originalRequest.headers['Authorization'] = 'Bearer ' + data.access;
        
        processQueue(null, data.access);
        isRefreshing = false;
        
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        return handleLogout(error);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper to parse backend errors
 */
export const parseError = (error: any): string => {
  // Handle 5xx server errors immediately — never try to parse the body
  const status = error.response?.status;
  if (status >= 500) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    return "A server error occurred. The backend team has been notified. Please try again shortly.";
  }

  if (error.response?.data) {
    const data = error.response.data;

    // 1. If it's a "detail" string (generic)
    if (typeof data.detail === "string") return data.detail;

    // 2. If it's a "detail" object or list (specific fields)
    if (data.detail && typeof data.detail === "object") {
      return Object.entries(data.detail)
        .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg[0] : msg}`)
        .join(" | ");
    }

    // 3. Handle standard DRF field errors
    if (typeof data === "object" && data !== null) {
      const errorEntries = Object.entries(data);
      if (errorEntries.length > 0) {
        return errorEntries
          .map(([field, msg]) => {
            if (field === "non_field_errors") return Array.isArray(msg) ? msg[0] : String(msg);
            return `${field}: ${Array.isArray(msg) ? msg[0] : String(msg)}`;
          })
          .join(" | ");
      }
    } else if (typeof data === "string") {
      return data.length > 200 ? "An unexpected server error occurred." : data;
    }
  }

  return error.message || "Something went wrong. Please try again.";
};

/**
 * Register user
 */
export const registerUser = async (role: Role, formData: Record<string, any>) => {
  try {
    const isProfessional = role === "professional";

    const endpoint = isProfessional
      ? "/users/register-professional/"
      : "/users/register/";

    // Use FormData if a file is present (profile photo / cv)
    const hasFile = formData.profilePhoto instanceof File || formData.cvFile instanceof File;

    if (hasFile && isProfessional) {
      const fd = new FormData();
      fd.append("username", formData.email);
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("first_name", formData.firstName);
      fd.append("last_name", formData.lastName);
      fd.append("profession", formData.serviceCategory);
      fd.append("years_of_experience", String(Number(formData.yearsOfExperience) || 0));
      if (formData.gender) fd.append("gender", formData.gender);
      if (formData.dateOfBirth) fd.append("date_of_birth", formData.dateOfBirth);
      if (formData.shortBio) fd.append("bio", formData.shortBio);
      if (formData.city) fd.append("city", formData.city);
      if (formData.subcity) fd.append("subcity", formData.subcity);
      if (formData.houseNumber) fd.append("house_number", formData.houseNumber);
      if (formData.payoutMethod) fd.append("preferred_payout_method", formData.payoutMethod);
      if (formData.accountNumber) fd.append("payout_account_number", formData.accountNumber);
      if (formData.serviceCategory) fd.append("service_categories", formData.serviceCategory);
      // Attach files
      if (formData.profilePhoto instanceof File) fd.append("profile_picture", formData.profilePhoto);
      if (formData.cvFile instanceof File) fd.append("cv_file", formData.cvFile);

      const response = await api.post(endpoint, fd);
      // Note: Do NOT set Content-Type here — axios auto-sets multipart/form-data with the correct boundary
      return {
        success: true,
        user: response.data.user,
        access: response.data.access,
        refresh: response.data.refresh,
      };
    }

    // JSON fallback (no files)
    const commonPayload = {
      username: formData.email,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
    };

    let payload: any;
    if (isProfessional) {
      payload = {
        ...commonPayload,
        profession: formData.serviceCategory,
        years_of_experience: Number(formData.yearsOfExperience) || 0,
        ...(formData.gender && { gender: formData.gender }),
        ...(formData.dateOfBirth && { date_of_birth: formData.dateOfBirth }),
        ...(formData.shortBio && { bio: formData.shortBio }),
        ...(formData.city && { city: formData.city }),
        ...(formData.subcity && { subcity: formData.subcity }),
        ...(formData.houseNumber && { house_number: formData.houseNumber }),
        ...(formData.payoutMethod && { preferred_payout_method: formData.payoutMethod }),
        ...(formData.accountNumber && { payout_account_number: formData.accountNumber }),
        ...(formData.serviceCategory && { service_categories: [formData.serviceCategory] }),
      };
    } else {
      payload = {
        ...commonPayload,
        phonenumber: formData.phone,
        role: role,
        ...(formData.gender && { gender: formData.gender }),
      };
    }

    const response = await api.post(endpoint, payload);
    return {
      success: true,
      user: response.data.user,
      access: response.data.access,
      refresh: response.data.refresh,
    };
  } catch (error: any) {
    throw new Error(parseError(error));
  }
};

/**
 * Login User
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post("/users/login/", {
      username: email, // Backend might expect username
      email: email,
      password: password,
    });

    return {
      success: true,
      user: response.data.user,
      access: response.data.access,
      refresh: response.data.refresh,
    };
  } catch (error: any) {
    const msg = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || "Invalid credentials";
    throw new Error(msg);
  }
};

/**
 * Get User Details by ID
 */
export const getUserDetails = async (id: string) => {
  try {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  } catch (error: any) {
    throw new Error(parseError(error));
  }
};

/**
 * Update User Profile
 * Supports both JSON and FormData (for images)
 */
export const updateUserProfile = async (id: string, data: Partial<User> | FormData) => {
  try {
    let payload = data;
    let headers = {};

    if (!(data instanceof FormData)) {
      // Map frontend fields back to backend if needed
       payload = {
        ...data,
        bio: data.bio || (data as any).shortBio,
        profession: data.profession || (data as any).serviceCategory,
        years_of_experience: data.years_of_experience || Number((data as any).yearsOfExperience)
      };

      // Remove null/undefined to avoid overwriting with empty
      Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);
    } else {
      // Axios will handle multipart/form-data boundary
      headers = { "Content-Type": "multipart/form-data" };
    }

    const response = await api.patch(`/users/${id}/`, payload, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Failed to update profile");
  }
};

/**
 * Verify Email OTP
 */
export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await api.post("/users/verify-email/", { email, otp });
    console.log("OTP Verification Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("OTP Verification Error:", error.response?.data);
    throw new Error(parseError(error));
  }
};

/**
 * Resend Email OTP
 */
export const resendOtp = async (email: string) => {
  try {
    const response = await api.post("/users/resend-email-otp/", { email });
    console.log("OTP Resend Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("OTP Resend Error:", error.response?.data);
    throw new Error(parseError(error));
  }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (email: string) => {
  const response = await api.post("/users/forgot-password/", { email });
  return response.data;
};

/**
 * Reset Password
 */
export const resetPassword = async (email: string, otp: string, new_password: string) => {
  const response = await api.post("/users/reset-password/", { email, otp, new_password });
  return response.data;
};

/**
 * Change Password
 * V2 Endpoint: POST /users/change-password/
 */
export const changePassword = async (oldPassword: string, newPassword: string) => {
  try {
    const response = await api.post("/users/change-password/", {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  } catch (error: any) {
    throw new Error(parseError(error));
  }
};

/**
 * Delete User Account
 */
export const deleteUserProfile = async (id: string) => {
  try {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Failed to delete account");
  }
};

/**
 * Logout User
 * Blacklists the refresh token on the backend
 */
export const logoutUser = async () => {
  try {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      await api.post("/users/logout/", { refresh });
    }
  } catch (error) {
    console.warn("Server-side logout failed:", error);
    // Continue with local logout regardless
  }
};

export default api;

