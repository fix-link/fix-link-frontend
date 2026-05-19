import api from "./auth.api";

export interface PaymentInitializationResponse {
  checkout_url: string;
  transaction_id?: string;
  detail?: string;
}

export interface EarningsSummary {
  total_payments: number;
  gross_earned: string;
  released_total: string;
  withdrawn_total: string;
  pending_withdrawal_total: string;
  available_withdrawal_total: string;
  currency: string;
}

/**
 * Initialize an Escrow checkout session via Chapa.
 * POST /api/payments/initialize/
 * 
 * @param jobId The UUID of the job being escrowed
 * @param provider The backend provider (unused in new flat structure but kept for signature)
 * @param accountNumber The phone number for mobile money
 */
export const initializePayment = async (
  jobId: string, 
  accountNumber?: string,
  details?: {
    amount?: number | string;
    currency?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    description?: string;
    title?: string;
    payment_method?: string;
  }
): Promise<PaymentInitializationResponse> => {
  try {
    // Explicitly read token from storage to guarantee it's attached
    // (same defensive pattern used across jobs.api.ts)
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined" || token === "null") {
      throw Object.assign(new Error("Session expired. Please log in again."), { isAuthError: true });
    }

    const sanitizeChapaText = (text: string) => {
      return (text || "").replace(/[^a-zA-Z0-9\-_ \.]/g, '').trim();
    };

    const payload = {
      job_id: jobId,
      amount: Number(details?.amount || 0).toFixed(2),
      currency: details?.currency || "ETB",
      phone_number: accountNumber || "",
      payment_method: details?.payment_method || "chapa",
      callback_url: window.location.origin + "/customer/payment-success/" + jobId,
      return_url: window.location.origin + "/customer/payment-success/" + jobId,
      description: sanitizeChapaText(details?.description || "Payment for job " + jobId),
      title: sanitizeChapaText(details?.title || "Fix-Link").substring(0, 16),
      logo_url: "https://fixlink.app/logo.png"
    };
    
    const response = await api.post("/payments/initialize/", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error("initializePayment: failed for job", jobId, error?.response?.data || error?.message || error);
    // Provide a clearer error for 401 so users know their session expired
    if (error?.response?.status === 401 || error?.isAuthError) {
      const authErr = new Error("Your session has expired. Please log out and log back in to complete booking.") as any;
      authErr.response = error?.response;
      throw authErr;
    }
    throw error;
  }
};

/**
 * Try to get an existing payment/escrow for a job.
 * Used to recover a checkout URL when 'escrow already exists'.
 */
export const getExistingPayment = async (jobId: string): Promise<{ checkout_url?: string } | null> => {
  try {
    const response = await api.get(`/payments/?job_id=${jobId}`);
    const results = response.data?.results || response.data;
    if (Array.isArray(results) && results.length > 0) {
      return results[0];
    }
    return null;
  } catch {
    return null;
  }
};

export const verifyPayment = async (paymentId: string) => {
  const response = await api.get(`/payments/${paymentId}/verify/`);
  return response.data;
};

export const getEarningsSummary = async (professionalId: string): Promise<EarningsSummary> => {
  const response = await api.get(`/payments/earnings/summary/?professional=${professionalId}`);
  return response.data as EarningsSummary;
};

export const listPayments = async (params?: { job_id?: string; professional?: string }) => {
  const qs = new URLSearchParams();
  if (params?.job_id) qs.set("job_id", params.job_id);
  if (params?.professional) qs.set("professional", params.professional);
  const response = await api.get(`/payments/${qs.toString() ? `?${qs.toString()}` : ""}`);
  return response.data;
};

export const withdrawFunds = async (args: {
  payment_id?: string;
  escrow_id?: string;
  payout_beneficiary_id?: string;
  bank_code?: string;
  account_name?: string;
  account_number?: string;
  amount?: number | string;
}) => {
  const response = await api.post("/payments/withdraw/", args);
  return response.data;
};
