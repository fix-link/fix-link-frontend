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
 * @param provider The backend provider (defaults to 'chapa')
 */
export const initializePayment = async (jobId: string, provider: string = "chapa", accountNumber?: string): Promise<PaymentInitializationResponse> => {
  try {
    const payload = {
      job_id: jobId,
      job: jobId,
      escrow: {
        job: jobId,
        job_id: jobId
      },
      provider: provider,
      phone_number: accountNumber,
      phone: accountNumber,
      account_number: accountNumber
    };
    
    // The API should automatically handle returning checkout references
    const response = await api.post("/payments/initialize/", payload);
    return response.data;
  } catch (error: any) {
    console.error("initializePayment: failed for job", jobId, error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};
