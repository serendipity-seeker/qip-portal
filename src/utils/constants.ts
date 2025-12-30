// QIP Smart Contract Constants
// Based on qip.h contract definition

// QIP Smart Contract Index
export const QIP_SC_INDEX = 18; // Update this with the actual contract index when deployed

// QX Smart Contract Index (for TransferShareManagementRights)
export const QX_SC_INDEX = 1;

// Maximum number of ICOs supported by the contract
export const QIP_MAX_NUMBER_OF_ICO = 1024;

// Fee for transferring share management rights
export const QIP_TRANSFER_RIGHTS_FEE = 100;

// Default tick offset for transactions
export const DEFAULT_TICK_OFFSET = 15;

// QIP Log Info codes (matches QIPLogInfo enum in qip.h)
export enum QIPLogInfo {
  QIP_success = 0,
  QIP_invalidStartEpoch = 1,
  QIP_invalidSaleAmount = 2,
  QIP_invalidPrice = 3,
  QIP_invalidPercent = 4,
  QIP_invalidTransfer = 5,
  QIP_overflowICO = 6,
  QIP_ICONotFound = 7,
  QIP_invalidAmount = 8,
  QIP_invalidEpoch = 9,
  QIP_insufficientInvocationReward = 10,
}

// Log info to human-readable message mapping
export const QIP_LOG_MESSAGES: Record<QIPLogInfo, string> = {
  [QIPLogInfo.QIP_success]: "Transaction successful",
  [QIPLogInfo.QIP_invalidStartEpoch]: "Invalid start epoch - must be at least 1 epochs in the future",
  [QIPLogInfo.QIP_invalidSaleAmount]: "Invalid sale amount - must match total tokens transferred to contract",
  [QIPLogInfo.QIP_invalidPrice]: "Invalid price - all prices must be greater than zero",
  [QIPLogInfo.QIP_invalidPercent]: "Invalid percent - percentages must sum to 95",
  [QIPLogInfo.QIP_invalidTransfer]: "Failed to transfer tokens to contract",
  [QIPLogInfo.QIP_overflowICO]: "Maximum number of ICOs reached",
  [QIPLogInfo.QIP_ICONotFound]: "ICO not found",
  [QIPLogInfo.QIP_invalidAmount]: "Invalid amount - exceeds remaining supply",
  [QIPLogInfo.QIP_invalidEpoch]: "ICO is not active in current epoch",
  [QIPLogInfo.QIP_insufficientInvocationReward]: "Insufficient funds for purchase",
};

