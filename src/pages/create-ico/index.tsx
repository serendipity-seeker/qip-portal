import type React from "react";
import { useState, useEffect } from "react";
import { qipService, type CreateICOInput } from "@/utils/qip-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatQubicAmount } from "@/utils";
import { useNavigate } from "react-router-dom";
import useCreateICO from "@/hooks/useCreateICO";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { fetchAssetsOwnership } from "@/services/rpc.service";
import { toast } from "sonner";

interface OwnedAsset {
  assetName: string;
  issuer: string;
  amount: number;
  managingContractIndex: number;
}

// QX contract index is 1, QIP contract index is 18
const ALLOWED_CONTRACT_INDICES = [1, 18];

export default function CreateICOPage() {
  const navigate = useNavigate();
  const { wallet, toggleConnectModal } = useQubicConnect();
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [ownedAssets, setOwnedAssets] = useState<OwnedAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>("");

  const { createICO, isLoading: creating, step } = useCreateICO({
    onSuccess: (result) => {
      toast.success(result.message);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const [formData, setFormData] = useState<CreateICOInput>({
    issuer: "",
    address1: "",
    address2: "",
    address3: "",
    address4: "",
    address5: "",
    address6: "",
    address7: "",
    address8: "",
    address9: "",
    address10: "",
    assetName: "",
    price1: 0,
    price2: 0,
    price3: 0,
    saleAmountForPhase1: 0,
    saleAmountForPhase2: 0,
    saleAmountForPhase3: 0,
    percent1: 0,
    percent2: 0,
    percent3: 0,
    percent4: 0,
    percent5: 0,
    percent6: 0,
    percent7: 0,
    percent8: 0,
    percent9: 0,
    percent10: 0,
    startEpoch: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const epoch = await qipService.getCurrentEpoch();
        setCurrentEpoch(epoch);
        setFormData((prev) => ({ ...prev, startEpoch: epoch + 3 }));
      } catch (error) {
        console.error("Failed to load epoch:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch user's owned assets when wallet is connected
  useEffect(() => {
    const fetchUserAssets = async () => {
      if (!wallet?.publicKey) {
        setOwnedAssets([]);
        setSelectedAssetKey("");
        return;
      }

      setLoadingAssets(true);
      try {
        const assets = await fetchAssetsOwnership(wallet.publicKey);
        // Filter to only show assets managed by QX (1) or QIP (18) contracts
        const filteredAssets = assets.filter((asset) =>
          ALLOWED_CONTRACT_INDICES.includes(asset.managingContractIndex),
        );
        setOwnedAssets(filteredAssets);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
        setOwnedAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchUserAssets();
  }, [wallet?.publicKey]);

  // Handle asset selection
  const handleAssetSelect = (assetKey: string) => {
    setSelectedAssetKey(assetKey);
    const [assetName, issuer] = assetKey.split("::");
    setFormData((prev) => ({
      ...prev,
      assetName,
      issuer,
    }));
  };

  const totalPercent =
    formData.percent1 +
    formData.percent2 +
    formData.percent3 +
    formData.percent4 +
    formData.percent5 +
    formData.percent6 +
    formData.percent7 +
    formData.percent8 +
    formData.percent9 +
    formData.percent10;

  const isPercentValid = totalPercent === 95;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) {
      toggleConnectModal();
      return;
    }

    // Validation
    if (formData.startEpoch <= currentEpoch + 1) {
      toast.error("Start epoch must be at least 2 epochs in the future");
      return;
    }

    if (formData.price1 <= 0 || formData.price2 <= 0 || formData.price3 <= 0) {
      toast.error("All prices must be greater than zero");
      return;
    }

    if (formData.saleAmountForPhase1 <= 0 || formData.saleAmountForPhase2 <= 0 || formData.saleAmountForPhase3 <= 0) {
      toast.error("All sale amounts must be greater than zero");
      return;
    }

    if (!isPercentValid) {
      toast.error(`Percentages must sum to 95 (current: ${totalPercent})`);
      return;
    }

    if (!selectedAssetKey || !formData.assetName || !formData.issuer) {
      toast.error("Please select an asset to sell");
      return;
    }

    await createICO(formData);
  };

  const getStepMessage = () => {
    if (step === "transferring") return "Transferring tokens to contract...";
    if (step === "creating") return "Creating ICO...";
    return "Create ICO";
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary-40)] border-r-transparent"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-foreground mb-3 text-4xl font-bold text-balance uppercase">Create New ICO</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Launch a transparent token sale on the Qubic blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card border-card-border rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">Basic Information</h3>

          <div className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Select Asset</label>
              {!wallet ? (
                <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
                  Connect your wallet to see your assets
                </div>
              ) : loadingAssets ? (
                <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
                  Loading your assets...
                </div>
              ) : ownedAssets.length === 0 ? (
                <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
                  No eligible assets found. You need tokens managed by QX or QIP contracts.
                </div>
              ) : (
                <Select
                  value={selectedAssetKey}
                  onValueChange={handleAssetSelect}
                  disabled={creating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an asset to sell" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-card-foreground">
                    {ownedAssets.map((asset) => {
                      const assetKey = `${asset.assetName}::${asset.issuer}`;
                      return (
                        <SelectItem key={assetKey} value={assetKey}>
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="font-semibold">{asset.assetName}</span>
                            <span className="text-muted-foreground text-xs">
                              {formatQubicAmount(asset.amount)} available
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                Select a token from your wallet to sell in this ICO.
              </p>
            </div>

            {/* Show selected asset details */}
            {selectedAssetKey && (
              <div className="bg-muted space-y-2 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Asset Name</span>
                  <span className="text-foreground font-semibold">{formData.assetName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Issuer</span>
                  <p className="text-foreground mt-1 break-all font-mono text-xs">{formData.issuer}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Start Epoch</label>
              <Input
                type="number"
                placeholder={`Minimum: ${currentEpoch + 2}`}
                value={formData.startEpoch}
                onChange={(e) => setFormData({ ...formData, startEpoch: Number.parseInt(e.target.value) })}
                min={currentEpoch + 2}
                required
                disabled={creating}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Current epoch: {currentEpoch}. Must be at least 2 epochs in the future.
              </p>
            </div>
          </div>
        </div>

        {/* Phase Configuration */}
        <div className="bg-card border-card-border rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">Phase Configuration</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Each phase lasts 1 epoch. Configure pricing and token allocation for each phase.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Phase 1 */}
            <div className="space-y-4">
              <h4 className="text-foreground font-semibold">Phase 1 (Epoch {formData.startEpoch})</h4>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Price (QUBIC)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.price1 || ""}
                  onChange={(e) => setFormData({ ...formData, price1: Number.parseFloat(e.target.value) || 0 })}
                  min="1"
                  required
                  disabled={creating}
                />
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Token Amount</label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={formData.saleAmountForPhase1 || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, saleAmountForPhase1: Number.parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  required
                  disabled={creating}
                />
              </div>
            </div>

            {/* Phase 2 */}
            <div className="space-y-4">
              <h4 className="text-foreground font-semibold">Phase 2 (Epoch {formData.startEpoch + 1})</h4>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Price (QUBIC)</label>
                <Input
                  type="number"
                  placeholder="150"
                  value={formData.price2 || ""}
                  onChange={(e) => setFormData({ ...formData, price2: Number.parseFloat(e.target.value) || 0 })}
                  min="1"
                  required
                  disabled={creating}
                />
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Token Amount</label>
                <Input
                  type="number"
                  placeholder="2000000"
                  value={formData.saleAmountForPhase2 || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, saleAmountForPhase2: Number.parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  required
                  disabled={creating}
                />
              </div>
            </div>

            {/* Phase 3 */}
            <div className="space-y-4">
              <h4 className="text-foreground font-semibold">Phase 3 (Epoch {formData.startEpoch + 2})</h4>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Price (QUBIC)</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={formData.price3 || ""}
                  onChange={(e) => setFormData({ ...formData, price3: Number.parseFloat(e.target.value) || 0 })}
                  min="1"
                  required
                  disabled={creating}
                />
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Token Amount</label>
                <Input
                  type="number"
                  placeholder="3000000"
                  value={formData.saleAmountForPhase3 || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, saleAmountForPhase3: Number.parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  required
                  disabled={creating}
                />
              </div>
            </div>
          </div>

          {/* Total tokens summary */}
          <div className="bg-muted mt-4 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total Tokens for Sale</span>
              <span className="text-foreground text-lg font-bold">
                {new Intl.NumberFormat().format(
                  formData.saleAmountForPhase1 + formData.saleAmountForPhase2 + formData.saleAmountForPhase3,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Payout Addresses */}
        <div className="bg-card border-card-border rounded-lg border p-6">
          <div className="mb-4">
            <h3 className="text-foreground mb-2 text-lg font-semibold">Payout Distribution</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Configure up to 10 payout addresses. Percentages must sum to 95% (remaining 5% goes to contract
              shareholders).
            </p>
          </div>

          <div className="mb-4 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <div key={num} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="text-foreground mb-2 block text-sm font-medium">Address {num}</label>
                  <Input
                    type="text"
                    placeholder="Qubic address"
                    value={formData[`address${num}` as keyof CreateICOInput] as string}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`address${num}`]: e.target.value.toUpperCase(),
                      })
                    }
                    className="font-mono text-xs"
                    disabled={creating}
                  />
                </div>

                <div className="md:w-32">
                  <label className="text-foreground mb-2 block text-sm font-medium">Percent</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData[`percent${num}` as keyof CreateICOInput] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`percent${num}`]: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="95"
                    disabled={creating}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Percentage Summary */}
          <div className="bg-muted rounded-lg p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">Total Distribution</span>
              <span
                className={cn(
                  "text-lg font-bold",
                  isPercentValid ? "text-success-40" : "text-error-40",
                )}
              >
                {totalPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Required</span>
              <span className="text-foreground font-medium">95%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Contract Shareholders</span>
              <span className="text-foreground font-medium">5%</span>
            </div>
            {!isPercentValid && (
              <p className="mt-2 text-xs text-error-40">Percentages must sum exactly to 95%</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1" disabled={creating}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={creating || !isPercentValid}
            className={cn("flex-1", creating && "cursor-wait")}
          >
            {!wallet ? "Connect Wallet" : creating ? getStepMessage() : "Create ICO"}
          </Button>
        </div>
      </form>
    </main>
  );
}
