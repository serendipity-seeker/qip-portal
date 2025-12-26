import { toast } from "sonner";
import { useAtom } from "jotai";

import { assetNameConvert } from "@/utils";
import { broadcastTx, fetchAssetsBalance } from "@/services/rpc.service";
import { settingsAtom } from "@/store/settings";
import { tickInfoAtom } from "@/store/tickInfo";
import { transferShareManagementRights } from "@/services/sc.service";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { useTxMonitor } from "@/store/txMonitor";

const useTransferShareManagementRights = () => {
  const [tickInfo] = useAtom(tickInfoAtom);
  const [settings] = useAtom(settingsAtom);
  const { wallet, getSignedTx } = useQubicConnect();
  const { startMonitoring } = useTxMonitor();

  const checkTransferShareRights = async (
    assetName: string,
    contractIndex: number,
    expectedAmount: number,
  ): Promise<boolean> => {
    if (!wallet) {
      toast.error("Please connect your wallet");
      return false;
    }
    const targetContractCurrentAmount = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);

    return targetContractCurrentAmount >= expectedAmount;
  };

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
      const targetTick = tickInfo.tick + settings.tickOffset;
      const targetContractOriginAmount = await fetchAssetsBalance(wallet.publicKey, assetName, contractIndex);

      if (targetContractOriginAmount > amount) {
        toast("No need to transfer share rights");
        return;
      }
      const transferShareTx = await transferShareManagementRights(
            // this transaction is sent to QX
            wallet.publicKey,
            {
              issuer: assetIssuer,
              assetName: assetNameConvert(assetName),
            },
            amount - targetContractOriginAmount,
            contractIndex,
            targetTick,
          )

      const signedTransferShareTx = await getSignedTx(transferShareTx);
      const res = await broadcastTx(signedTransferShareTx.tx);

      const taskId = `transfer-share-rights-${Date.now()}`;
      const checker = async () => {
        if (!wallet) return false;
        return await checkTransferShareRights(assetName, contractIndex, targetContractOriginAmount + amount);
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

      startMonitoring(taskId, { checker, onSuccess, onFailure, targetTick, txHash: res.transactionId }, "v1");
    } catch (error) {
      toast.error("Error transferring share rights");
      return;
    }
  };

  return { handleTransferShareRights, checkTransferShareRights };
};

export default useTransferShareManagementRights;
