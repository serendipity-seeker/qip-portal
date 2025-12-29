import { useEffect, useState, useCallback } from "react";
import { fetchBalance, fetchAssetsOwnership } from "@/services/rpc.service";
import type { Balance } from "@/types";

interface AssetBalance {
  assetName: string;
  amount: number;
  issuer: string;
}

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
      const [balanceData, assetsData] = await Promise.all([
        fetchBalance(publicId),
        fetchAssetsOwnership(publicId),
      ]);

      setBalance(balanceData);
      setAssets(
        assetsData.map((asset) => ({
          assetName: asset.assetName,
          amount: asset.amount,
          issuer: asset.issuer,
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

  return {
    balance,
    assets,
    isLoading,
    isError,
    refetch,
  };
};

