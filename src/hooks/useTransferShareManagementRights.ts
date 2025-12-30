import { toast } from "sonner";
import { useAtom } from "jotai";
import { assetNameConvert, QX_SC_INDEX } from "@/utils";
import { broadcastTx, fetchAssetsBalance, fetchTickInfo } from "@/services/rpc.service";
import { settingsAtom } from "@/store/settings";
import { transferShareManagementRights, transferShareManagementRightsFromQIP } from "@/services/sc.service";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { useTxMonitor } from "@/store/txMonitor";

const useTransferShareManagementRights = () => {
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  /**
   * Check if the target contract already has enough share rights
   */
  const checkTransferShareRights = async (
    assetName: string,
    contractIndex: number,
    expectedAmount: number,
  ): Promise<boolean> => {
    if (!wallet) {
      return false;
    }
    const targetContractCurrentAmount = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);
    return targetContractCurrentAmount >= expectedAmount;
  };

  /**
   * Transfer share management rights from QX to another contract (e.g., QIP)
   * Uses QX TransferShareManagementRights procedure
   */
  const handleTransferShareRights = async ({
    assetName,
    assetIssuer,
    contractIndex,
    amount,
    fallback,
  }: {
    assetName: string;
    assetIssuer: string;
    contractIndex: number;
    amount: number;
    fallback?: () => Promise<void>;
  }) => {
    if (!wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const tickInfo = await fetchTickInfo();
      const targetTick = tickInfo.tick + settings.tickOffset;
      const targetContractOriginAmount = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);

      if (targetContractOriginAmount >= amount) {
        toast.info("Tokens already in target contract");
        if (fallback) {
          await fallback();
        }
        return;
      }

      const tokensToTransfer = amount - targetContractOriginAmount;

      // Transfer from QX to target contract
      const transferShareTx = await transferShareManagementRights(
        wallet.publicKey,
        {
          issuer: assetIssuer,
          assetName: assetNameConvert(assetName),
        },
        tokensToTransfer,
        contractIndex,
        targetTick,
      );

      const signedTransferShareTx = await getSignedTx(transferShareTx);
      const res = await broadcastTx(signedTransferShareTx.tx);

      toast.info(`Transfer transaction broadcast: ${res.transactionId.slice(0, 8)}...`);

      const taskId = `transfer-share-rights-${Date.now()}`;

      const checker = async () => {
        if (!wallet) return false;
        const newBalance = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);
        return newBalance >= amount;
      };

      const onSuccess = async () => {
        toast.success("Share rights transferred successfully");
        if (fallback) {
          await fallback();
        }
      };

      const onFailure = async () => {
        toast.error("Failed to transfer share rights");
      };

      // Use v1 strategy for QX transfer (no QIP logs available)
      startMonitoring(taskId, { checker, onSuccess, onFailure, targetTick, txHash: res.transactionId }, "v1");
    } catch (error) {
      console.error("Error transferring share rights:", error);
      toast.error("Error transferring share rights");
    }
  };

  /**
   * Transfer share management rights from QIP back to QX
   * Used to recover tokens stuck in QIP contract
   */
  const handleRecoverToQX = async ({
    assetName,
    assetIssuer,
    amount,
    onSuccess,
  }: {
    assetName: string;
    assetIssuer: string;
    amount: number;
    onSuccess?: () => Promise<void>;
  }) => {
    if (!wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const tickInfo = await fetchTickInfo();
      const targetTick = tickInfo.tick + settings.tickOffset;

      // Transfer from QIP to QX
      const transferTx = await transferShareManagementRightsFromQIP(
        wallet.publicKey,
        {
          issuer: assetIssuer,
          assetName: assetNameConvert(assetName),
        },
        amount,
        QX_SC_INDEX,
        targetTick,
      );

      const signedTx = await getSignedTx(transferTx);
      const res = await broadcastTx(signedTx.tx);

      toast.info(`Recovery transaction broadcast: ${res.transactionId.slice(0, 8)}...`);

      const taskId = `recover-to-qx-${Date.now()}`;

      const checker = async () => {
        if (!wallet) return false;
        // Check if tokens appeared in QX contract
        const qxBalance = await fetchAssetsBalance(wallet.publicKey, assetName, QX_SC_INDEX);
        return qxBalance >= amount;
      };

      const handleSuccess = async () => {
        toast.success(`${assetName} recovered to QX successfully!`);
        if (onSuccess) {
          await onSuccess();
        }
      };

      const handleFailure = async () => {
        toast.error("Failed to recover tokens to QX");
      };

      // Use v3 strategy for QIP contract operations
      startMonitoring(taskId, { checker: checker, onSuccess: handleSuccess, onFailure: handleFailure, targetTick, txHash: res.transactionId }, "v3");
    } catch (error) {
      console.error("Error recovering to QX:", error);
      toast.error("Error recovering tokens to QX");
    }
  };

  return { handleTransferShareRights, handleRecoverToQX, checkTransferShareRights };
};

export default useTransferShareManagementRights;
