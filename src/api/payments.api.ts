import api, { parseError } from "./auth.api";

export interface PaymentInitializationResponse {
  checkout_url: string;
  transaction_id?: string;
  detail?: string;
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
  provider: string = "chapa", 
  accountNumber?: string,
  details?: {
    amount?: number | string;
    currency?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    description?: string;
    title?: string;
  }
): Promise<PaymentInitializationResponse> => {
  try {
    const payload = {
      job_id: jobId,
      amount: String(details?.amount || "0"),
      currency: details?.currency || "ETB",
      phone_number: accountNumber || "",
      callback_url: window.location.origin + "/customer/home",
      return_url: window.location.origin + "/customer/home",
      description: details?.description || "Payment for job " + jobId,
      title: details?.title || "Fix-Link Service",
      logo_url: "https://fixlink.app/logo.png"
    };
    
    // The API should automatically handle returning checkout references
    const response = await api.post("/payments/initialize/", payload);
    return response.data;
  } catch (error: any) {
    console.error("initializePayment: failed for job", jobId, error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};
