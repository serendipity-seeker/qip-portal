// QIP Smart Contract Service Layer
// Provides high-level interface for QIP ICO contract interactions

import { fetchTickInfo } from "@/services/rpc.service";
import { getICOInfo as getICOInfoSC, getAllICOs as getAllICOsSC } from "@/services/sc.service";
import type { ICOInfo, CreateICOInput, BuyTokenResult, CreateICOResult, ICOStatus } from "@/types";
import { QIPLogInfo, QIP_LOG_MESSAGES } from "@/utils/constants";

export type { ICOInfo, CreateICOInput, BuyTokenResult, CreateICOResult, ICOStatus };

/**
 * QIP Service - High-level interface for ICO operations
 * Handles both smart contract queries and business logic
 */
export const qipService = {
  /**
   * Get the current epoch from the blockchain
   */
  getCurrentEpoch: async (): Promise<number> => {
    try {
      const tickInfo = await fetchTickInfo();
      return tickInfo.epoch;
    } catch (error) {
      console.error("Failed to get current epoch:", error);
      throw error;
    }
  },

  /**
   * Get current tick from the blockchain
   */
  getCurrentTick: async (): Promise<number> => {
    try {
      const tickInfo = await fetchTickInfo();
      return tickInfo.tick;
    } catch (error) {
      console.error("Failed to get current tick:", error);
      throw error;
    }
  },

  /**
   * Get all ICOs from the smart contract
   */
  getAllICOs: async (): Promise<ICOInfo[]> => {
    try {
      return await getAllICOsSC();
    } catch (error) {
      console.error("Failed to get all ICOs:", error);
      return [];
    }
  },

  /**
   * Get ICO information by index
   */
  getICOInfo: async (index: number): Promise<ICOInfo | null> => {
    try {
      return await getICOInfoSC(index);
    } catch (error) {
      console.error("Failed to get ICO info:", error);
      return null;
    }
  },

  /**
   * Validate ICO creation input
   * Returns validation result with error message if invalid
   */
  validateCreateICOInput: async (
    input: CreateICOInput,
  ): Promise<{ valid: boolean; returnCode: number; message: string }> => {
    const currentEpoch = await qipService.getCurrentEpoch();

    // Check start epoch
    if (input.startEpoch <= currentEpoch + 1) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidStartEpoch,
        message: QIP_LOG_MESSAGES[QIPLogInfo.QIP_invalidStartEpoch],
      };
    }

    // Check prices
    if (input.price1 <= 0 || input.price2 <= 0 || input.price3 <= 0) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidPrice,
        message: QIP_LOG_MESSAGES[QIPLogInfo.QIP_invalidPrice],
      };
    }

    // Check sale amounts
    if (input.saleAmountForPhase1 <= 0 && input.saleAmountForPhase2 <= 0 && input.saleAmountForPhase3 <= 0) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidSaleAmount,
        message: "At least one phase must have a sale amount greater than zero",
      };
    }

    // Check percentages sum to 95
    const percentSum =
      input.percent1 +
      input.percent2 +
      input.percent3 +
      input.percent4 +
      input.percent5 +
      input.percent6 +
      input.percent7 +
      input.percent8 +
      input.percent9 +
      input.percent10;

    if (percentSum !== 95) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidPercent,
        message: `${QIP_LOG_MESSAGES[QIPLogInfo.QIP_invalidPercent]} (current: ${percentSum}%)`,
      };
    }

    return {
      valid: true,
      returnCode: QIPLogInfo.QIP_success,
      message: "Validation passed",
    };
  },

  /**
   * Create ICO - This now only validates, actual transaction is handled by useCreateICO hook
   * @deprecated Use useCreateICO hook instead for transaction handling
   */
  createICO: async (input: CreateICOInput): Promise<CreateICOResult> => {
    const validation = await qipService.validateCreateICOInput(input);
    if (!validation.valid) {
      return {
        success: false,
        returnCode: validation.returnCode,
        message: validation.message,
      };
    }

    // Return success for validation - actual transaction handled by hook
    return {
      success: true,
      returnCode: QIPLogInfo.QIP_success,
      message: "Validation passed - use wallet to sign and broadcast transaction",
    };
  },

  /**
   * Validate buy token input
   */
  validateBuyTokenInput: async (
    indexOfICO: number,
    amount: number,
  ): Promise<{ valid: boolean; returnCode: number; message: string; price: number; totalCost: number }> => {
    const ico = await qipService.getICOInfo(indexOfICO);

    if (!ico) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_ICONotFound,
        message: QIP_LOG_MESSAGES[QIPLogInfo.QIP_ICONotFound],
        price: 0,
        totalCost: 0,
      };
    }

    const currentEpoch = await qipService.getCurrentEpoch();
    let price = 0;
    let remainingAmount = 0;

    if (currentEpoch === ico.startEpoch) {
      price = ico.price1;
      remainingAmount = ico.remainingAmountForPhase1;
    } else if (currentEpoch === ico.startEpoch + 1) {
      price = ico.price2;
      remainingAmount = ico.remainingAmountForPhase2;
    } else if (currentEpoch === ico.startEpoch + 2) {
      price = ico.price3;
      remainingAmount = ico.remainingAmountForPhase3;
    } else {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidEpoch,
        message: QIP_LOG_MESSAGES[QIPLogInfo.QIP_invalidEpoch],
        price: 0,
        totalCost: 0,
      };
    }

    if (amount > remainingAmount) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidAmount,
        message: `${QIP_LOG_MESSAGES[QIPLogInfo.QIP_invalidAmount]} (${remainingAmount} available)`,
        price,
        totalCost: amount * price,
      };
    }

    if (amount <= 0) {
      return {
        valid: false,
        returnCode: QIPLogInfo.QIP_invalidAmount,
        message: "Amount must be greater than zero",
        price,
        totalCost: 0,
      };
    }

    return {
      valid: true,
      returnCode: QIPLogInfo.QIP_success,
      message: "Validation passed",
      price,
      totalCost: amount * price,
    };
  },

  /**
   * Buy token - This now only validates, actual transaction is handled by useBuyToken hook
   * @deprecated Use useBuyToken hook instead for transaction handling
   */
  buyToken: async (indexOfICO: number, amount: number): Promise<BuyTokenResult> => {
    const validation = await qipService.validateBuyTokenInput(indexOfICO, amount);
    if (!validation.valid) {
      return {
        success: false,
        returnCode: validation.returnCode,
        message: validation.message,
      };
    }

    // Return success for validation - actual transaction handled by hook
    return {
      success: true,
      returnCode: QIPLogInfo.QIP_success,
      message: `Ready to purchase ${amount} tokens for ${validation.totalCost} energy`,
    };
  },

  /**
   * Get ICO status based on current epoch
   */
  getICOStatus: (ico: ICOInfo, currentEpoch: number): ICOStatus => {
    if (currentEpoch < ico.startEpoch) {
      return "upcoming";
    } else if (currentEpoch >= ico.startEpoch && currentEpoch <= ico.startEpoch + 2) {
      return "live";
    } else {
      return "ended";
    }
  },

  /**
   * Get current phase of an ICO (1, 2, 3) or null if not active
   */
  getCurrentPhase: (ico: ICOInfo, currentEpoch: number): 1 | 2 | 3 | null => {
    if (currentEpoch === ico.startEpoch) return 1;
    if (currentEpoch === ico.startEpoch + 1) return 2;
    if (currentEpoch === ico.startEpoch + 2) return 3;
    return null;
  },

  /**
   * Get current price based on epoch
   */
  getCurrentPrice: (ico: ICOInfo, currentEpoch: number): number => {
    const phase = qipService.getCurrentPhase(ico, currentEpoch);
    if (phase === 1) return ico.price1;
    if (phase === 2) return ico.price2;
    if (phase === 3) return ico.price3;
    return 0;
  },

  /**
   * Get remaining tokens for current phase
   */
  getCurrentRemaining: (ico: ICOInfo, currentEpoch: number): number => {
    const phase = qipService.getCurrentPhase(ico, currentEpoch);
    if (phase === 1) return ico.remainingAmountForPhase1;
    if (phase === 2) return ico.remainingAmountForPhase2;
    if (phase === 3) return ico.remainingAmountForPhase3;
    return 0;
  },

  /**
   * Calculate total tokens sold for an ICO
   */
  getTotalSold: (ico: ICOInfo): number => {
    const totalSupply = ico.saleAmountForPhase1 + ico.saleAmountForPhase2 + ico.saleAmountForPhase3;
    const totalRemaining = ico.remainingAmountForPhase1 + ico.remainingAmountForPhase2 + ico.remainingAmountForPhase3;
    return totalSupply - totalRemaining;
  },

  /**
   * Calculate progress percentage for an ICO
   */
  getProgress: (ico: ICOInfo): number => {
    const totalSupply = ico.saleAmountForPhase1 + ico.saleAmountForPhase2 + ico.saleAmountForPhase3;
    if (totalSupply === 0) return 0;
    const sold = qipService.getTotalSold(ico);
    return Math.round((sold / totalSupply) * 100);
  },

  /**
   * Get payout addresses as array
   */
  getPayoutAddresses: (ico: ICOInfo): { address: string; percent: number }[] => {
    return [
      { address: ico.address1, percent: ico.percent1 },
      { address: ico.address2, percent: ico.percent2 },
      { address: ico.address3, percent: ico.percent3 },
      { address: ico.address4, percent: ico.percent4 },
      { address: ico.address5, percent: ico.percent5 },
      { address: ico.address6, percent: ico.percent6 },
      { address: ico.address7, percent: ico.percent7 },
      { address: ico.address8, percent: ico.percent8 },
      { address: ico.address9, percent: ico.percent9 },
      { address: ico.address10, percent: ico.percent10 },
    ].filter((p) => p.percent > 0);
  },
};
