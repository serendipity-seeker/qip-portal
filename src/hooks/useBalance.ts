import { useEffect, useState, useCallback } from "react";
import { fetchBalance, fetchAssetsOwnership } from "@/services/rpc.service";
import type { Balance } from "@/types";
import { QIP_SC_INDEX, QX_SC_INDEX } from "@/utils/constants";

interface AssetBalance {
  assetName: string;
  amount: number;
  issuer: string;
  managingContractIndex: number;
}

// Contract index labels
const CONTRACT_NAMES: Record<number, string> = {
  [QX_SC_INDEX]: "QX",
  [QIP_SC_INDEX]: "QIP",
};

export const useBalance = (publicId: string) => {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [assets, setAssets] = useState<AssetBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const refetch = useCallback(async () => {
    if (!publicId) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const [balanceData, assetsData] = await Promise.all([fetchBalance(publicId), fetchAssetsOwnership(publicId)]);

      setBalance(balanceData);
      setAssets(
        assetsData.map((asset) => ({
          assetName: asset.assetName,
          amount: asset.amount,
          issuer: asset.issuer,
          managingContractIndex: asset.managingContractIndex,
        })),
      );
    } catch (error) {
      console.error("Error fetching balance:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Group assets by contract index
  const assetsByContract = assets.reduce(
    (acc, asset) => {
      const contractName = CONTRACT_NAMES[asset.managingContractIndex] || `Contract ${asset.managingContractIndex}`;
      if (!acc[contractName]) {
        acc[contractName] = [];
      }
      acc[contractName].push(asset);
      return acc;
    },
    {} as Record<string, AssetBalance[]>,
  );

  // Get assets stuck in QIP contract (need recovery to QX)
  const qipAssets = assets.filter((asset) => asset.managingContractIndex === QIP_SC_INDEX);

  return {
    balance,
    assets,
    assetsByContract,
    qipAssets,
    isLoading,
    isError,
    refetch,
  };
};

export type { AssetBalance };
