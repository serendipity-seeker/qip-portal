import { toast } from "sonner";
import { useAtom } from "jotai";
import { useState, useCallback } from "react";

import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { buyTokenTx } from "@/services/sc.service";
import { settingsAtom } from "@/store/settings";
import { useTxMonitor } from "@/store/txMonitor";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { qipService } from "@/utils/qip-service";
import type { BuyTokenResult } from "@/types";

interface UseBuyTokenOptions {
  onSuccess?: (result: BuyTokenResult) => void;
  onError?: (error: string) => void;
}

const useBuyToken = (options?: UseBuyTokenOptions) => {
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
          setIsLoading(false);
          return { success: false, returnCode: validation.returnCode, message: validation.message };
        }

        const tickInfo = await fetchTickInfo();
        const targetTick = tickInfo.tick + settings.tickOffset;
        const { totalCost } = validation;

        // Create the transaction
        const tx = await buyTokenTx(wallet.publicKey, indexOfICO, amount, totalCost, targetTick);

        // Sign the transaction
        const signedTx = await getSignedTx(tx);

        // Broadcast the transaction
        const res = await broadcastTx(signedTx.tx);
        const txId = res.transactionId;

        toast.info(`Transaction broadcast: ${txId.slice(0, 8)}...`);

        // Set up monitoring with v3 strategy for QIP contract logs
        const taskId = `buy-token-${Date.now()}`;

        const onSuccess = async () => {
          const successResult: BuyTokenResult = {
            success: true,
            returnCode: 0,
            message: `Successfully purchased ${amount} tokens for ${totalCost} QUBIC`,
            txId,
          };
          toast.success(successResult.message);
          options?.onSuccess?.(successResult);
          setIsLoading(false);
        };

        const onFailure = async () => {
          const message = "Transaction failed";
          options?.onError?.(message);
          setIsLoading(false);
        };

        // Use v3 strategy for QIP contract operations (provides better error messages via logs)
        startMonitoring(
          taskId,
          {
            checker: async () => false, // v3 doesn't use checker
            onSuccess,
            onFailure,
            targetTick,
            txHash: txId,
          },
          "v3",
        );

        return {
          success: true,
          returnCode: 0,
          message: `Transaction submitted. Monitoring for confirmation...`,
          txId,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to purchase tokens";
        toast.error(message);
        options?.onError?.(message);
        setIsLoading(false);
        return { success: false, returnCode: -1, message };
      }
    },
    [wallet, settings, getSignedTx, startMonitoring, options],
  );

  return {
    buyToken,
    isLoading,
  };
};

export default useBuyToken;
