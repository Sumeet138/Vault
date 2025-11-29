import { backendClient, ApiResponse } from "./client";

// Payment recording types
export interface CollectInfo {
  name?: string;
  email?: string;
  telegram?: string;
}

export interface PaymentDataItem {
  type: string;
  value: string;
}

export interface PreparePaymentRequest {
  linkId: string;
  paymentData: PaymentDataItem[];
  amount: string;
  tokenSymbol: string;
  sourceChain: string;
}

export interface PreparePaymentResponse {
  paymentId: string;
}

export interface SubmitPaymentInfoRequest {
  paymentData: PaymentDataItem[];
  turnstileResponse?: string;
}

export interface SubmitPaymentInfoResponse {
  success: boolean;
  message: string;
  data: {
    paymentInfoId: string;
    collectedFields: string[];
    createdAt: string;
  };
}

export interface RecordPaymentRequest {
  linkId: string;
  transactionSignature: string;
  amount: string;
  tokenSymbol: string;
  tokenAddress: string;
  sourceChain: string;
  paymentNote?: string;
  collectInfo?: CollectInfo;
}

export interface RecordPaymentResponse {
  id: string;
  success: boolean;
  message: string;
}

export const paymentsService = {
  /**
   * Prepare a payment and collect user info before transaction
   * @param data - Payment preparation data
   * @returns Promise with payment preparation confirmation
   */
  preparePayment: async (
    data: PreparePaymentRequest
  ): Promise<ApiResponse<PreparePaymentResponse>> => {
    return backendClient.post<PreparePaymentResponse, PreparePaymentRequest>(
      "/pay/prepare-payment",
      data
    );
  },

  /**
   * Submit payment info like a note before the transaction
   * @param data - Payment info data
   * @returns Promise with submission confirmation
   */
  submitPaymentInfo: async (
    data: SubmitPaymentInfoRequest
  ): Promise<ApiResponse<SubmitPaymentInfoResponse>> => {
    return backendClient.post<
      SubmitPaymentInfoResponse,
      SubmitPaymentInfoRequest
    >("/pay/payment-info", data);
  },

  /**
   * Record a payment transaction with optional collect info
   * @param data - Payment recording data including transaction details and collect info
   * @returns Promise with payment recording confirmation
   * @example
   * ```typescript
   * const result = await paymentsService.recordPayment({
   *   linkId: 'link-123',
   *   transactionSignature: 'tx-hash-456',
   *   amount: '0.01',
   *   tokenSymbol: 'APT',
   *   tokenAddress: 'native',
   *   sourceChain: 'APTOS',
   *   paymentNote: 'Payment for digital product',
   *   collectInfo: {
   *     name: 'John Doe',
   *     email: 'john@example.com'
   *   }
   * });
   * ```
   */
  recordPayment: async (
    data: RecordPaymentRequest
  ): Promise<ApiResponse<RecordPaymentResponse>> => {
    return backendClient.post<RecordPaymentResponse, RecordPaymentRequest>(
      "/payments/record",
      data
    );
  },
};
