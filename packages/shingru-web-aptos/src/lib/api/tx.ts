import { backendClient, type ApiResponse } from "./client";
import { type ChainId } from "./user";

// For APTOS Withdrawal
export interface IotaWithdrawalItem {
  fromStealthAddress: string;
  amount: string;
  ephemeralPubkey: string;
}

export interface PrepareIotaWithdrawalRequest {
  chain: ChainId;
  recipient: string;
  token: string;
  withdrawals: IotaWithdrawalItem[];
  note?: string;
}

export interface IotaWithdrawalOutcome {
  index: number;
  ok: boolean;
  result?: {
    transactionBytes: string;
    sponsorSignature: string;
    fromStealthAddress: string;
    ephemeralPubkey: string;
    amount: string;
    recipientAddress: string;
    isInternalTransfer: boolean;
    gas: {
      owner: string;
      price: string;
      budget: string;
    };
    ephemeralForRecipient?: {
      publicKeyB58: string;
      stealthOwnerPubkey: string;
      recipientUserId: string;
    } | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PrepareIotaWithdrawalResponse {
  outcomes: IotaWithdrawalOutcome[];
  txHashes: string[];
  totalAmount: string;
  recipientAddress: string;
  isInternalTransfer: boolean;
  token: string;
  chain: string;
  note?: string;
}

export interface PaymentDataItem {
  type: "note";
  value: string;
}

export interface PrepareIotaStealthPaymentRequest {
  chain: ChainId;
  fromAddress: string;
  recipientUsername: string;
  token: string;
  amount: string;
  paymentData?: PaymentDataItem[];
}

export interface PrepareIotaStealthPaymentResponse {
  outcome: {
    ok: boolean;
    result: {
      transactionBytes: string;
      feePayerSignature: string;
      feePayerAddress: string;
      feePayerAuthenticator: string;
    } | null;
  };
}

export interface LogTransactionRequest {
  chain: ChainId;
  txHash: string;
  recipientUsername: string;
  ephemeralPubkey: string;
  encryptedMemo: string;
  encryptedNote?: string;
}

export interface LogTransactionResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    linkId: string;
    recipientUsername: string;
  };
}

export const txService = {
  prepareIotaWithdrawal: (
    token: string,
    payload: PrepareIotaWithdrawalRequest
  ): Promise<ApiResponse<PrepareIotaWithdrawalResponse>> => {
    backendClient.setAuthToken(token);
    return backendClient.post("/tx/prepare-aptos-withdrawal", payload, {
      timeout: 20_000,
    });
  },

  prepareIotaStealthPayment: async (
    accessToken: string,
    payload: PrepareIotaStealthPaymentRequest
  ): Promise<ApiResponse<PrepareIotaStealthPaymentResponse>> => {
    backendClient.setAuthToken(accessToken);
    return backendClient.post("/tx/prepare-aptos-stealth-payment", payload);
  },

  saveIotaWithdrawalGroup: (
    token: string,
    withdrawalId: string,
    chain: ChainId
  ): Promise<ApiResponse<{ success: boolean }>> => {
    backendClient.setAuthToken(token);
    return backendClient.post<{ success: boolean }>(
      "/user/withdrawal-group",
      { withdrawalId },
      { params: { chain } }
    );
  },

  logTransaction: (
    token: string,
    payload: LogTransactionRequest
  ): Promise<ApiResponse<LogTransactionResponse>> => {
    backendClient.setAuthToken(token);
    return backendClient.post("/tx/log-tx", payload);
  },
};

