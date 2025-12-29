import { toast } from "sonner";
import { useAtom } from "jotai";
import { useState, useCallback } from "react";

import { broadcastTx, fetchTickEvents } from "@/services/rpc.service";
import { buyTokenTx } from "@/services/sc.service";
import { isQIPTxSuccessful } from "@/services/log.service";
import { settingsAtom } from "@/store/settings";
import { tickInfoAtom } from "@/store/tickInfo";
import { useTxMonitor } from "@/store/txMonitor";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { qipService } from "@/utils/qip-service";
import { QIP_LOG_MESSAGES, QIPLogInfo } from "@/utils/constants";
import type { BuyTokenResult } from "@/types";

interface UseBuyTokenOptions {
  onSuccess?: (result: BuyTokenResult) => void;
  onError?: (error: string) => void;
}

const useBuyToken = (options?: UseBuyTokenOptions) => {
  const [tickInfo] = useAtom(tickInfoAtom);
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();
  const [isLoading, setIsLoading] = useState(false);

  const buyToken = useCallback(
    async (indexOfICO: number, amount: number): Promise<BuyTokenResult> => {
      if (!wallet) {
        const message = "Please connect your wallet";
        toast.error(message);
        options?.onError?.(message);
        return { success: false, returnCode: -1, message };
      }

      setIsLoading(true);

      try {
        // Validate input
        const validation = await qipService.validateBuyTokenInput(indexOfICO, amount);
        if (!validation.valid) {
          toast.error(validation.message);
          options?.onError?.(validation.message);
          return { success: false, returnCode: validation.returnCode, message: validation.message };
        }

        const targetTick = tickInfo.tick + settings.tickOffset;
        const { price, totalCost } = validation;

        // Create the transaction
        const tx = await buyTokenTx(wallet.publicKey, indexOfICO, amount, totalCost, targetTick);

        // Sign the transaction
        const signedTx = await getSignedTx(tx);

        // Broadcast the transaction
        const res = await broadcastTx(signedTx.tx);
        const txId = res.transactionId;

        toast.info(`Transaction broadcast: ${txId.slice(0, 8)}...`);

        // Set up monitoring
        const taskId = `buy-token-${Date.now()}`;

        const checker = async (): Promise<boolean> => {
          try {
            const tickEvents = await fetchTickEvents(targetTick);
            if (!tickEvents) return false;
            const result = await isQIPTxSuccessful(tickEvents, txId);
            return result.success;
          } catch {
            return false;
          }
        };

        const onSuccess = async () => {
          const successResult: BuyTokenResult = {
            success: true,
            returnCode: QIPLogInfo.QIP_success,
            message: `Successfully purchased ${amount} tokens for ${totalCost} QUBIC`,
            txId,
          };
          toast.success(successResult.message);
          options?.onSuccess?.(successResult);
        };

        const onFailure = async () => {
          // Try to get more details from the log
          try {
            const tickEvents = await fetchTickEvents(targetTick);
            if (tickEvents) {
              const result = await isQIPTxSuccessful(tickEvents, txId);
              const message = QIP_LOG_MESSAGES[result.logType as unknown as QIPLogInfo] || result.logType;
              toast.error(`Transaction failed: ${message}`);
              options?.onError?.(message);
              return;
            }
          } catch {
            // Fallback error
          }
          const message = "Transaction failed";
          toast.error(message);
          options?.onError?.(message);
        };

        startMonitoring(taskId, { checker, onSuccess, onFailure, targetTick, txHash: txId }, "v1");

        return {
          success: true,
          returnCode: QIPLogInfo.QIP_success,
          message: `Transaction submitted. Monitoring for confirmation...`,
          txId,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to purchase tokens";
        toast.error(message);
        options?.onError?.(message);
        return { success: false, returnCode: -1, message };
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, tickInfo, settings, getSignedTx, startMonitoring, options],
  );

  return {
    buyToken,
    isLoading,
  };
};

export default useBuyToken;

