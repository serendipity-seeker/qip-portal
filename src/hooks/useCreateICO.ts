import { toast } from "sonner";
import { useAtom } from "jotai";
import { useState, useCallback } from "react";

import { broadcastTx, fetchTickEvents, fetchAssetsBalance } from "@/services/rpc.service";
import { createICOTx, transferShareManagementRights } from "@/services/sc.service";
import { isQIPTxSuccessful } from "@/services/log.service";
import { settingsAtom } from "@/store/settings";
import { tickInfoAtom } from "@/store/tickInfo";
import { useTxMonitor } from "@/store/txMonitor";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { qipService } from "@/utils/qip-service";
import { QIP_LOG_MESSAGES, QIPLogInfo, QIP_SC_INDEX } from "@/utils/constants";
import { assetNameConvert } from "@/utils/tx.utils";
import type { CreateICOInput, CreateICOResult } from "@/types";

interface UseCreateICOOptions {
  onSuccess?: (result: CreateICOResult) => void;
  onError?: (error: string) => void;
}

const useCreateICO = (options?: UseCreateICOOptions) => {
  const [tickInfo] = useAtom(tickInfoAtom);
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "transferring" | "creating">("idle");

  /**
   * Check if user has enough tokens managed by QIP contract
   */
  const checkTokenBalance = useCallback(
    async (assetName: string, requiredAmount: number): Promise<boolean> => {
      if (!wallet) return false;
      const balance = await fetchAssetsBalance(wallet.publicKey, assetName, QIP_SC_INDEX);
      return balance >= requiredAmount;
    },
    [wallet],
  );

  /**
   * Transfer tokens to be managed by QIP contract
   */
  const transferTokensToContract = useCallback(
    async (input: CreateICOInput): Promise<{ success: boolean; message: string }> => {
      if (!wallet) {
        return { success: false, message: "Wallet not connected" };
      }

      const totalTokens = input.saleAmountForPhase1 + input.saleAmountForPhase2 + input.saleAmountForPhase3;
      const currentBalance = await fetchAssetsBalance(wallet.publicKey, input.assetName, QIP_SC_INDEX);

      if (currentBalance >= totalTokens) {
        return { success: true, message: "Tokens already transferred" };
      }

      const tokensToTransfer = totalTokens - currentBalance;
      const targetTick = tickInfo.tick + settings.tickOffset;

      try {
        setStep("transferring");

        // Create transfer share management rights transaction
        const transferTx = await transferShareManagementRights(
          wallet.publicKey,
          {
            issuer: input.issuer,
            assetName: assetNameConvert(input.assetName),
          },
          tokensToTransfer,
          QIP_SC_INDEX,
          targetTick,
        );

        const signedTx = await getSignedTx(transferTx);
        const res = await broadcastTx(signedTx.tx);

        toast.info(`Transfer transaction broadcast: ${res.transactionId.slice(0, 8)}...`);

        // Wait for transfer to complete
        return new Promise((resolve) => {
          const taskId = `transfer-tokens-${Date.now()}`;

          const checker = async (): Promise<boolean> => {
            const balance = await fetchAssetsBalance(wallet.publicKey, input.assetName, QIP_SC_INDEX);
            return balance >= totalTokens;
          };

          const onSuccess = async () => {
            toast.success("Tokens transferred successfully");
            resolve({ success: true, message: "Tokens transferred" });
          };

          const onFailure = async () => {
            toast.error("Failed to transfer tokens");
            resolve({ success: false, message: "Failed to transfer tokens to contract" });
          };

          startMonitoring(taskId, { checker, onSuccess, onFailure, targetTick, txHash: res.transactionId }, "v1");
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to transfer tokens";
        return { success: false, message };
      }
    },
    [wallet, tickInfo, settings, getSignedTx, startMonitoring],
  );

  /**
   * Create ICO after tokens are transferred
   */
  const createICO = useCallback(
    async (input: CreateICOInput): Promise<CreateICOResult> => {
      if (!wallet) {
        const message = "Please connect your wallet";
        toast.error(message);
        options?.onError?.(message);
        return { success: false, returnCode: -1, message };
      }

      setIsLoading(true);

      try {
        // Validate input first
        const validation = await qipService.validateCreateICOInput(input);
        if (!validation.valid) {
          toast.error(validation.message);
          options?.onError?.(validation.message);
          return { success: false, returnCode: validation.returnCode, message: validation.message };
        }

        // Step 1: Transfer tokens to QIP contract (if needed)
        const totalTokens = input.saleAmountForPhase1 + input.saleAmountForPhase2 + input.saleAmountForPhase3;
        const hasTokens = await checkTokenBalance(input.assetName, totalTokens);

        if (!hasTokens) {
          toast.info("Transferring tokens to contract...");
          const transferResult = await transferTokensToContract(input);
          if (!transferResult.success) {
            options?.onError?.(transferResult.message);
            return {
              success: false,
              returnCode: QIPLogInfo.QIP_invalidTransfer,
              message: transferResult.message,
            };
          }
        }

        // Step 2: Create ICO
        setStep("creating");
        const targetTick = tickInfo.tick + settings.tickOffset;

        const tx = await createICOTx(
          wallet.publicKey,
          {
            issuer: input.issuer,
            addresses: [
              input.address1,
              input.address2,
              input.address3,
              input.address4,
              input.address5,
              input.address6,
              input.address7,
              input.address8,
              input.address9,
              input.address10,
            ],
            assetName: input.assetName,
            price1: input.price1,
            price2: input.price2,
            price3: input.price3,
            saleAmountForPhase1: input.saleAmountForPhase1,
            saleAmountForPhase2: input.saleAmountForPhase2,
            saleAmountForPhase3: input.saleAmountForPhase3,
            percents: [
              input.percent1,
              input.percent2,
              input.percent3,
              input.percent4,
              input.percent5,
              input.percent6,
              input.percent7,
              input.percent8,
              input.percent9,
              input.percent10,
            ],
            startEpoch: input.startEpoch,
          },
          targetTick,
        );

        const signedTx = await getSignedTx(tx);
        const res = await broadcastTx(signedTx.tx);
        const txId = res.transactionId;

        toast.info(`ICO creation transaction broadcast: ${txId.slice(0, 8)}...`);

        // Set up monitoring
        const taskId = `create-ico-${Date.now()}`;

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
          const successResult: CreateICOResult = {
            success: true,
            returnCode: QIPLogInfo.QIP_success,
            message: "ICO created successfully!",
            txId,
          };
          toast.success(successResult.message);
          options?.onSuccess?.(successResult);
          setStep("idle");
        };

        const onFailure = async () => {
          try {
            const tickEvents = await fetchTickEvents(targetTick);
            if (tickEvents) {
              const result = await isQIPTxSuccessful(tickEvents, txId);
              const message = QIP_LOG_MESSAGES[result.logType as unknown as QIPLogInfo] || result.logType;
              toast.error(`ICO creation failed: ${message}`);
              options?.onError?.(message);
              setStep("idle");
              return;
            }
          } catch {
            // Fallback error
          }
          const message = "ICO creation failed";
          toast.error(message);
          options?.onError?.(message);
          setStep("idle");
        };

        startMonitoring(taskId, { checker, onSuccess, onFailure, targetTick, txHash: txId }, "v1");

        return {
          success: true,
          returnCode: QIPLogInfo.QIP_success,
          message: "Transaction submitted. Monitoring for confirmation...",
          txId,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create ICO";
        toast.error(message);
        options?.onError?.(message);
        setStep("idle");
        return { success: false, returnCode: -1, message };
      } finally {
        setIsLoading(false);
      }
    },
    [
      wallet,
      tickInfo,
      settings,
      getSignedTx,
      startMonitoring,
      checkTokenBalance,
      transferTokensToContract,
      options,
    ],
  );

  return {
    createICO,
    isLoading,
    step,
  };
};

export default useCreateICO;

