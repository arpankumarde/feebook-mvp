export const bav = {
  account_statuses: {
    VALID: "The account is successfully verified.",
    INVALID: "The account is invalid.",
    RECEIVED:
      "The transaction request has been successfully received and awaits processing or verification.",
    FAILED:
      "The transaction failed due to an error or issue on the bank’s side.",
    REJECTED:
      "The transaction was rejected, typically due to issues such as insufficient funds.",
    APPROVAL_PENDING:
      "This status indicates that the verification process is awaiting merchant approval of the submitted files to proceed further.",
    PARTIALLY_APPROVED:
      "This status indicates that some of the submitted data or files have been approved for verification.",
    IN_PROCESS:
      "This status indicates that the request is currently under validation, and the verification process is actively ongoing.",
    CANCELLED:
      "This status indicates that the request was terminated by the user and will not proceed further.",
    PROCESSING:
      "This status indicates that the request is being actively handled, and the system is working on completing the verification or transaction.",
    MANUALLY_REJECTED:
      "This status indicates that the request was explicitly reviewed and rejected by a user.",
  },
  account_status_codes: {
    ACCOUNT_IS_VALID: "Bank account has been successfully verified.",
    FRAUD_ACCOUNT:
      "Fraudulent activity has been detected involving the bank account and IFSC. As a precautionary measure, both the account and IFSC have been blocked to prevent future transactions. To request unblocking, please contact your account manager or fill out the Support Form.",
    FAILED_AT_BANK:
      "The transaction failed due to an error or issue at the bank’s end.",
    NPCI_UNAVAILABLE:
      "The transaction could not be processed because the NPCI (National Payments Corporation of India) service is currently unavailable.",
    CONNECTION_TIMEOUT:
      "The transaction failed due to a timeout while trying to establish a connection with the bank.",
    SOURCE_BANK_DECLINED:
      "The transaction was declined by the source bank due to issues at their end.",
    BENE_BANK_DECLINED:
      "The transaction was declined by the bene bank due to issues at their end.",
    IMPS_MODE_FAIL:
      "The transaction failed because it could not be processed through the IMPS mode.",
    BENEFICIARY_BANK_OFFLINE:
      "The transaction could not be processed because the beneficiary’s bank is currently offline or unreachable.",
    VALIDATION_IN_PROGRESS:
      "The transaction is currently being validated and is awaiting confirmation.",
    INVALID_ACCOUNT_FAIL:
      "The transaction failed because the provided account details are invalid.",
    INVALID_IFSC_FAIL:
      "The transaction failed because the provided IFSC code is invalid or incorrect.",
    VERIFICATION_ALREADY_UNDER_PROCESS:
      "The verification is already in progress, and another verification request cannot be processed at this time.",
    NRE_ACCOUNT_FAIL:
      "The transaction failed because the account is a Non-Resident External (NRE) account, which is not supported for this transaction type.",
    ACCOUNT_BLOCKED:
      "The transaction failed because the account is blocked and cannot process transactions.",
    INSUFFICIENT_BALANCE:
      "The transaction failed due to insufficient funds in the merchant account for processing the transaction.",
  },
  name_match_results: {
    DIRECT_MATCH:
      "Indicates that the name provided in the request matches exactly with the name associated with the bank account.",
    GOOD_PARTIAL_MATCH:
      "Indicates a strong similarity between the provided name and the name associated with the bank account, with minor differences.",
    MODERATE_PARTIAL_MATCH:
      "Indicates a noticeable similarity between the provided name and the name associated with the bank account, but with more significant variations or missing details.",
    POOR_PARTIAL_MATCH:
      "Indicates a weak similarity between the provided name and the name associated with the bank account, suggesting a potential mismatch but with some common elements.",
    NO_MATCH:
      "Indicates that there is no recognisable similarity between the provided name and the name associated with the bank account, or the names are entirely different.",
  },
};

export enum BAVAccountStatus {
  VALID = "VALID",
  INVALID = "INVALID",
  RECEIVED = "RECEIVED",
  FAILED = "FAILED",
  REJECTED = "REJECTED",
  APPROVAL_PENDING = "APPROVAL_PENDING",
  PARTIALLY_APPROVED = "PARTIALLY_APPROVED",
  IN_PROCESS = "IN_PROCESS",
  CANCELLED = "CANCELLED",
  PROCESSING = "PROCESSING",
  MANUALLY_REJECTED = "MANUALLY_REJECTED",
}

export enum BAVAccountStatusCode {
  ACCOUNT_IS_VALID = "ACCOUNT_IS_VALID",
  FRAUD_ACCOUNT = "FRAUD_ACCOUNT",
  FAILED_AT_BANK = "FAILED_AT_BANK",
  NPCI_UNAVAILABLE = "NPCI_UNAVAILABLE",
  CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
  SOURCE_BANK_DECLINED = "SOURCE_BANK_DECLINED",
  BENE_BANK_DECLINED = "BENE_BANK_DECLINED",
  IMPS_MODE_FAIL = "IMPS_MODE_FAIL",
  BENEFICIARY_BANK_OFFLINE = "BENEFICIARY_BANK_OFFLINE",
  VALIDATION_IN_PROGRESS = "VALIDATION_IN_PROGRESS",
  INVALID_ACCOUNT_FAIL = "INVALID_ACCOUNT_FAIL",
  INVALID_IFSC_FAIL = "INVALID_IFSC_FAIL",
  VERIFICATION_ALREADY_UNDER_PROCESS = "VERIFICATION_ALREADY_UNDER_PROCESS",
  NRE_ACCOUNT_FAIL = "NRE_ACCOUNT_FAIL",
  ACCOUNT_BLOCKED = "ACCOUNT_BLOCKED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
}

export enum BAVNameMatchResult {
  DIRECT_MATCH = "DIRECT_MATCH",
  GOOD_PARTIAL_MATCH = "GOOD_PARTIAL_MATCH",
  MODERATE_PARTIAL_MATCH = "MODERATE_PARTIAL_MATCH",
  POOR_PARTIAL_MATCH = "POOR_PARTIAL_MATCH",
  NO_MATCH = "NO_MATCH",
}
