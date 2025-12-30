import { toast } from "sonner";
import { useAtom } from "jotai";
import { useState, useRef } from "react";

import { broadcastTx, fetchTickInfo } from "@/services/rpc.service";
import { createICOTx, getAllICOs } from "@/services/sc.service";
import { settingsAtom } from "@/store/settings";
import { useTxMonitor } from "@/store/txMonitor";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { qipService } from "@/utils/qip-service";
import { QIP_SC_INDEX } from "@/utils/constants";
import useTransferShareManagementRights from "./useTransferShareManagementRights";
import type { CreateICOInput, CreateICOResult } from "@/types";

interface UseCreateICOOptions {
  onSuccess?: (result: CreateICOResult) => void;
  onError?: (error: string) => void;
}

const useCreateICO = (options?: UseCreateICOOptions) => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();
  const { handleTransferShareRights, checkTransferShareRights } = useTransferShareManagementRights();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "transferring" | "creating">("idle");

  // Track ICO count before creation to verify new ICO was added
  const icoCountBeforeRef = useRef<number>(0);

  /**
   * Submit the create ICO transaction and start monitoring
   * This is called either directly (if tokens already transferred) or via fallback (after transfer)
   */
  const submitCreateICO = async (input: CreateICOInput) => {
    if (!wallet) return;

    setStep("creating");
    const tickInfo = await fetchTickInfo();
    const targetTick = tickInfo.tick + settings.tickOffset;

    // Store current ICO count before transaction
    const currentICOs = await getAllICOs();
    icoCountBeforeRef.current = currentICOs.length;

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

    const taskId = `create-ico-${wallet.publicKey}-${targetTick}-${Date.now()}`;

    // Checker: verify ICO was created by checking if a new ICO exists with matching asset/issuer/creator
    const checker = async () => {
      if (!wallet) return false;

      const icos = await getAllICOs();

      // Check if ICO count increased AND a new ICO matches our criteria
      if (icos.length > icoCountBeforeRef.current) {
        const newICO = icos.find(
          (ico) =>
            ico.assetName === input.assetName && ico.issuer === input.issuer && ico.creatorOfICO === wallet.publicKey,
        );
        return !!newICO;
      }

      return false;
    };

    const onSuccess = async () => {
      const successResult: CreateICOResult = {
        success: true,
        returnCode: 0,
        message: "ICO created successfully!",
        txId,
      };
      toast.success(successResult.message);
      options?.onSuccess?.(successResult);
      setStep("idle");
      setIsLoading(false);
    };

    const onFailure = async () => {
      toast.error("ICO creation failed");
      options?.onError?.("ICO creation failed");
      setStep("idle");
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
  };

  /**
   * Create ICO - handles the full flow following qraffle pattern:
   * 1. Validate input
   * 2. Check if tokens already transferred to QIP contract
   * 3a. If NOT: transfer tokens first, then create ICO via fallback
   * 3b. If YES: create ICO directly
   */
  const createICO = async (input: CreateICOInput): Promise<CreateICOResult> => {
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
        setIsLoading(false);
        return { success: false, returnCode: validation.returnCode, message: validation.message };
      }

      // Calculate total tokens needed
      const totalTokens = input.saleAmountForPhase1 + input.saleAmountForPhase2 + input.saleAmountForPhase3;

      // Check if tokens already transferred to QIP contract
      const hasTokens = await checkTransferShareRights(input.assetName, QIP_SC_INDEX, totalTokens);

      if (!hasTokens) {
        // Tokens NOT transferred yet - transfer first, then create ICO via fallback
        setStep("transferring");
        toast.info("Transferring tokens to contract...");

        await handleTransferShareRights({
          assetIssuer: input.issuer,
          assetName: input.assetName,
          amount: totalTokens,
          contractIndex: QIP_SC_INDEX,
          // Fallback: called after transfer succeeds, chains to create ICO
          fallback: async () => {
            await submitCreateICO(input);
          },
        });
      } else {
        // Tokens already transferred - create ICO directly
        await submitCreateICO(input);
      }

      return {
        success: true,
        returnCode: 0,
        message: "Transaction submitted. Monitoring for confirmation...",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create ICO";
      toast.error(message);
      options?.onError?.(message);
      setStep("idle");
      setIsLoading(false);
      return { success: false, returnCode: -1, message };
    }
  };

  return {
    createICO,
    isLoading,
    step,
  };
};

export default useCreateICO;
