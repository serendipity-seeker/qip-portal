import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { qipService, type ICOInfo } from "@/utils/qip-service";
import { PhaseTimeline } from "@/components/phase-timeline";
import { FundDistribution } from "@/components/fund-distribution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import useBuyToken from "@/hooks/useBuyToken";
import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { toast } from "sonner";

const ICODetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet, toggleConnectModal } = useQubicConnect();
  const [ico, setIco] = useState<ICOInfo | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");

  const { buyToken, isLoading: buying } = useBuyToken({
    onSuccess: async (result) => {
      toast.success(result.message);
      setAmount("");
      // Refresh ICO data
      const updatedICO = await qipService.getICOInfo(ico!.index);
      if (updatedICO) setIco(updatedICO);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  useEffect(() => {
    const loadICO = async () => {
      try {
        const icoId = Number.parseInt(id!);
        const [icoData, epoch] = await Promise.all([qipService.getICOInfo(icoId), qipService.getCurrentEpoch()]);

        if (!icoData) {
          navigate("/");
          return;
        }

        setIco(icoData);
        setCurrentEpoch(epoch);
      } catch (error) {
        console.error("Failed to load ICO:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadICO();
  }, [id, navigate]);

  const handleBuy = async () => {
    if (!ico) return;

    const tokenAmount = Number.parseFloat(amount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!wallet) {
      toggleConnectModal();
      return;
    }

    await buyToken(ico.index, tokenAmount);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary-40)] border-r-transparent"></div>
          <p className="text-muted-foreground">Loading ICO details...</p>
        </div>
      </div>
    );
  }

  if (!ico) {
    return null;
  }

  const status = qipService.getICOStatus(ico, currentEpoch);
  const currentPhase = qipService.getCurrentPhase(ico, currentEpoch);
  const currentPrice = qipService.getCurrentPrice(ico, currentEpoch);
  const currentRemaining = qipService.getCurrentRemaining(ico, currentEpoch);
  const totalCost = Number.parseFloat(amount) > 0 ? Number.parseFloat(amount) * currentPrice : 0;

  const canBuy = status === "live" && currentPhase !== null;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <button
        onClick={() => navigate("/")}
        className="text-muted-foreground mb-6 text-sm transition-colors hover:text-[color:var(--primary-40)]"
      >
        ← Back to ICO List
      </button>

      <div className="mb-8">
        <h1 className="text-foreground mb-2 text-4xl font-bold text-balance">{ico.assetName}</h1>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>ICO Index: {ico.index}</span>
          <span>•</span>
          <span>Current Epoch: {currentEpoch}</span>
        </div>
      </div>

      <div className="mb-8">
        <PhaseTimeline
          currentPhase={currentPhase}
          phase1Price={ico.price1}
          phase2Price={ico.price2}
          phase3Price={ico.price3}
          phase1Amount={ico.saleAmountForPhase1}
          phase2Amount={ico.saleAmountForPhase2}
          phase3Amount={ico.saleAmountForPhase3}
          phase1Remaining={ico.remainingAmountForPhase1}
          phase2Remaining={ico.remainingAmountForPhase2}
          phase3Remaining={ico.remainingAmountForPhase3}
          startEpoch={ico.startEpoch}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Purchase Panel */}
        <div className="bg-card border-card-border rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">Purchase Tokens</h3>

          {status === "upcoming" && (
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground">This ICO will start at epoch {ico.startEpoch}</p>
            </div>
          )}

          {status === "ended" && (
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground">This ICO has ended</p>
            </div>
          )}

          {canBuy && (
            <div className="space-y-4">
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Amount of Tokens</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                  min="0"
                  step="1"
                  disabled={buying}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Maximum available: {new Intl.NumberFormat().format(currentRemaining)}
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Price per Token</span>
                  <span className="text-foreground text-sm font-semibold">{currentPrice} QUBIC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-semibold">Total Cost</span>
                  <span className="text-lg font-bold text-[color:var(--primary-40)]">
                    {new Intl.NumberFormat().format(totalCost)} QUBIC
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={!amount || buying || Number.parseFloat(amount) <= 0}
                className={cn("w-full", buying && "cursor-wait")}
              >
                {!wallet ? "Connect Wallet" : buying ? "Processing..." : "Buy Tokens"}
              </Button>
            </div>
          )}
        </div>

        {/* ICO Information */}
        <div className="bg-card border-card-border rounded-lg border p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">ICO Information</h3>

          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Asset Name</p>
              <p className="text-foreground text-sm font-medium">{ico.assetName}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-xs">Issuer</p>
              <p className="text-foreground font-mono text-xs break-all">{ico.issuer}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-xs">Creator</p>
              <p className="text-foreground font-mono text-xs break-all">{ico.creatorOfICO}</p>
            </div>

            <div className="border-card-border border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs">Total Token Supply</p>
              <p className="text-foreground text-lg font-bold">
                {new Intl.NumberFormat().format(
                  ico.saleAmountForPhase1 + ico.saleAmountForPhase2 + ico.saleAmountForPhase3,
                )}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-xs">Progress</p>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${qipService.getProgress(ico)}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-right text-xs">{qipService.getProgress(ico)}% sold</p>
            </div>
          </div>
        </div>
      </div>

      <FundDistribution ico={ico} />
    </main>
  );
};

export default ICODetailPage;
