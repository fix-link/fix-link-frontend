import axios from "axios";
import type { Role, User } from "../types/auth.types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Simulate backend delay
 */
const fakeDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send OTP to email
 */
export const sendOtp = async (email: string) => {
  await fakeDelay(1000);

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  return {
    success: true,
    message: "Verification code sent to your email",
  };
};

/**
 * Verify OTP
 */
export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await api.post("/accounts/users/verify-email/", {
      email: email,
      otp: otp,
    });

    return {
      success: true,
      message: response.data.message || "Email verified successfully",
    };
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail ||
      error.response?.data?.error ||
      "Invalid verification code"
    );
  }
};

/**
 * Resend OTP (Real)
 */
export const resendOtp = async (email: string) => {
  try {
    const response = await api.post("/accounts/users/resend-email-otp/", {
      email: email,
    });
    return {
      success: true,
      message: response.data.message || "OTP sent successfully",
    };
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail ||
      error.response?.data?.error ||
      "Failed to resend OTP"
    );
  }
};

/**
 * Register customer or professional
 */
export const registerUser = async (
  role: Role,
  formData: Record<string, any>
) => {
  try {
    if (!formData.email) {
      throw new Error("Email is missing from registration data");
    }

    // 2. Generate Username (from email)
    const username = formData.email.split("@")[0] + Math.floor(Math.random() * 1000);

    // 3. Prepare Payload matching Backend Spec
    const payload = {
      username: username,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: role,
      // Note: Extra fields like 'phone', 'location' might be ignored by /users/register/
      // Need clarify if we should PATCH specific profile endpoint later.
    };

    const response = await api.post("/accounts/users/register/", payload);

    // Normalize user object
    const apiUser = response.data.user;
    const user: User = {
      id: apiUser.id,
      name: apiUser.first_name + " " + apiUser.last_name || apiUser.username,
      email: apiUser.email,
      role: apiUser.role,
      status:
        apiUser.role === "professional" && !apiUser.is_verified_professional
          ? "PENDING_APPROVAL"
          : "ACTIVE",
      profilePhoto: "https://i.pravatar.cc/150",
    };

    return {
      success: true,
      message: "Account created successfully",
      token: response.data.access,
      user: user,
    };
  } catch (error: any) {
    console.error("Registration Error Details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Extract the most specific error message
    let errorMessage = "Registration failed";

    if (error.response?.data) {
      const data = error.response.data;
      if (data.detail) errorMessage = data.detail;
      else if (data.email) errorMessage = `Email: ${data.email[0]}`;
      else if (data.username) errorMessage = `Username: ${data.username[0]}`;
      else if (data.password) errorMessage = `Password: ${data.password[0]}`;
      else if (data.first_name) errorMessage = `First Name: ${data.first_name[0]}`;
      else if (data.last_name) errorMessage = `Last Name: ${data.last_name[0]}`;
      else if (typeof data === 'string') errorMessage = data;
    } else if (error.request) {
      errorMessage = "No response from server. Check your internet or VPN.";
    } else {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Login User
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post("/accounts/users/login/", {
      email: email, // Changed from 'login' to 'email' based on error
      password: password,
    });

    const apiUser = response.data.user;
    const user: User = {
      id: apiUser.id,
      name: apiUser.first_name ? `${apiUser.first_name} ${apiUser.last_name}` : apiUser.username,
      email: apiUser.email,
      role: apiUser.role,
      status:
        apiUser.role === "professional" && !apiUser.is_verified_professional
          ? "PENDING_APPROVAL"
          : "ACTIVE",
      profilePhoto: "https://i.pravatar.cc/150",
    };

    return {
      success: true,
      token: response.data.access,
      user: user,
    };

  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Invalid credentials");
  }
};

/**
 * Forgot Password (MOCK)
 */
export const forgotPassword = async (email: string) => {
  await fakeDelay(1000);
  console.log(`Sending reset password email to ${email}`);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  return { success: true, message: "Reset link sent" };
};

/**
 * Reset Password (MOCK)
 */
export const resetPassword = async (token: string, newPassword: string) => {
  await fakeDelay(1000);
  console.log(`Resetting password with token ${token} to ${newPassword}`);
  if (!token) throw new Error("Invalid token");
  if (!newPassword) throw new Error("New password is required");
  return { success: true, message: "Password reset successfully" };
};
