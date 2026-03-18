export type Role = "customer" | "professional";

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string; // Frontend helper: combines first and last name
  role: Role;
  bio?: string;
  date_of_birth?: string;
  is_verified?: boolean;
  loyalty_points?: number;
  preferred_contact_method?: string;
  profession?: string;
  license_number?: string;
  years_of_experience?: number;
  is_verified_professional?: boolean;
  average_rating?: number;
  total_jobs_completed?: number;
  created_at?: string;
  updated_at?: string;
  // Professional specific fields
  skills?: string;
  hourlyRate?: string;
  languages?: string[];
  portfolio?: { img: string; title: string }[];

  // Legacy fields (optional during transition)
  serviceCategory?: string; // Mapped to profession
  shortBio?: string; // Mapped to bio
  yearsOfExperience?: string; // Mapped to years_of_experience
  profilePhoto?: string;
  phone?: string;
  city?: string;
  subcity?: string;
}

export interface Job {
  id?: string;
  customer: string; // UUID
  professional?: string; // UUID
  service?: string; // UUID
  title: string;
  description: string;
  address?: string;
  scheduled_at?: string;
  preferred_date?: string;
  budget?: number; // Numeric
  status?: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  assigned_to?: string; // UUID
  created_at?: string;
  updated_at?: string;
  bids?: JobBid[];
}

export interface JobBid {
  id?: string;
  job: string; // UUID
  professional: string; // UUID
  amount: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  token: string; // fake JWT
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}
