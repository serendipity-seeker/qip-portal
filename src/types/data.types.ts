// QIP ICO Smart Contract Types
// Based on qip.h contract definition

/**
 * ICO Information structure
 * Matches the getICOInfo_output from qip.h
 */
export interface ICOInfo {
  index: number;
  creatorOfICO: string;
  issuer: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  address5: string;
  address6: string;
  address7: string;
  address8: string;
  address9: string;
  address10: string;
  assetName: string;
  price1: number;
  price2: number;
  price3: number;
  saleAmountForPhase1: number;
  saleAmountForPhase2: number;
  saleAmountForPhase3: number;
  remainingAmountForPhase1: number;
  remainingAmountForPhase2: number;
  remainingAmountForPhase3: number;
  percent1: number;
  percent2: number;
  percent3: number;
  percent4: number;
  percent5: number;
  percent6: number;
  percent7: number;
  percent8: number;
  percent9: number;
  percent10: number;
  startEpoch: number;
}

/**
 * Input for creating a new ICO
 * Matches createICO_input from qip.h
 */
export interface CreateICOInput {
  issuer: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  address5: string;
  address6: string;
  address7: string;
  address8: string;
  address9: string;
  address10: string;
  assetName: string;
  price1: number;
  price2: number;
  price3: number;
  saleAmountForPhase1: number;
  saleAmountForPhase2: number;
  saleAmountForPhase3: number;
  percent1: number;
  percent2: number;
  percent3: number;
  percent4: number;
  percent5: number;
  percent6: number;
  percent7: number;
  percent8: number;
  percent9: number;
  percent10: number;
  startEpoch: number;
}

/**
 * Input for buying tokens
 * Matches buyToken_input from qip.h
 */
export interface BuyTokenInput {
  indexOfICO: number;
  amount: number;
}

/**
 * ICO status based on current epoch
 */
export type ICOStatus = "upcoming" | "live" | "ended";

/**
 * Result from buy token operation
 */
export interface BuyTokenResult {
  success: boolean;
  returnCode: number;
  message: string;
  txId?: string;
}

/**
 * Result from create ICO operation
 */
export interface CreateICOResult {
  success: boolean;
  returnCode: number;
  message: string;
  txId?: string;
}

/**
 * Input for transferring share management rights
 * Matches TransferShareManagementRights_input from qip.h
 */
export interface TransferShareManagementRightsInput {
  issuer: string;
  assetName: number;
  numberOfShares: number;
  newManagingContractIndex: number;
}

/**
 * Result from transfer share management rights operation
 */
export interface TransferShareManagementRightsResult {
  success: boolean;
  transferredNumberOfShares: number;
  txId?: string;
}
