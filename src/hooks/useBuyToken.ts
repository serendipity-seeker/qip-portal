import { toast } from "sonner";
import { useAtom } from "jotai";
import { useState, useCallback, useRef } from "react";

import { broadcastTx, fetchAssetsBalance, fetchTickInfo } from "@/services/rpc.service";
import { buyTokenTx, getICOInfo } from "@/services/sc.service";
import { settingsAtom } from "@/store/settings";
import { useTxMonitor } from "@/store/txMonitor";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { qipService } from "@/utils/qip-service";
import { QIP_SC_INDEX, QX_SC_INDEX } from "@/utils/constants";
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
  
  // Track token balance before purchase to verify tokens received
  const tokenBalanceBeforeRef = useRef<number>(0);

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

        // Get ICO info to know the asset name for balance checking
        const icoInfo = await getICOInfo(indexOfICO);
        if (!icoInfo) {
          const message = "Failed to get ICO information";
          toast.error(message);
          options?.onError?.(message);
          setIsLoading(false);
          return { success: false, returnCode: -1, message };
        }

        const tickInfo = await fetchTickInfo();
        const targetTick = tickInfo.tick + settings.tickOffset;
        const { totalCost } = validation;

        // Store current token balance before transaction
        tokenBalanceBeforeRef.current = await fetchAssetsBalance(
          wallet.publicKey,
          icoInfo.assetName,
          QX_SC_INDEX
        );

        // Create the transaction
        const tx = await buyTokenTx(wallet.publicKey, indexOfICO, amount, totalCost, targetTick);

        // Sign the transaction
        const signedTx = await getSignedTx(tx);

        // Broadcast the transaction
        const res = await broadcastTx(signedTx.tx);
        const txId = res.transactionId;

        toast.info(`Transaction broadcast: ${txId.slice(0, 8)}...`);

        // Set up monitoring with v1 strategy using checker function
        const taskId = `buy-token-${Date.now()}`;

        // Checker: verify token balance increased after purchase
        // Tokens go to QX contract (index 1) after purchase
        const checker = async () => {
          if (!wallet) return false;
          
          const currentBalance = await fetchAssetsBalance(
            wallet.publicKey,
            icoInfo.assetName,
            QIP_SC_INDEX
          );
          
          // Check if balance increased by the expected amount
          return currentBalance >= tokenBalanceBeforeRef.current + amount;
        };

        const onSuccess = async () => {
          const successResult: BuyTokenResult = {
            success: true,
            returnCode: 0,
            message: `Successfully purchased ${amount} ${icoInfo.assetName} tokens for ${totalCost} QUBIC`,
            txId,
          };
          toast.success(successResult.message);
          options?.onSuccess?.(successResult);
          setIsLoading(false);
        };

        const onFailure = async () => {
          const message = "Token purchase failed";
          toast.error(message);
          options?.onError?.(message);
          setIsLoading(false);
        };

        // Use v1 strategy with checker function
        startMonitoring(
          taskId,
          {
            checker,
            onSuccess,
            onFailure,
            targetTick,
            txHash: txId,
          },
          "v1",
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
