import { Link } from "react-router-dom";
import type { ICOInfo, ICOStatus } from "@/utils/qip-service";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";

interface ICOCardProps {
  ico: ICOInfo;
  currentEpoch: number;
  status: ICOStatus;
  currentPhase: 1 | 2 | 3 | null;
  currentPrice: number;
  currentRemaining: number;
}

export function ICOCard({ ico, status, currentPhase, currentPrice, currentRemaining }: ICOCardProps) {
  const getStatusBadge = () => {
    const badges = {
      upcoming: {
        bg: "bg-warning-40/10",
        text: "text-warning-40",
        border: "border-warning-40/20",
        label: "Upcoming",
      },
      live: { bg: "bg-success-40/10", text: "text-success-40", border: "border-success-40/20", label: "Live Now" },
      ended: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", label: "Ended" },
    };

    const badge = badges[status];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
          badge.bg,
          badge.text,
          badge.border,
        )}
      >
        {status === "live" && <span className="bg-success-40 h-1.5 w-1.5 animate-pulse rounded-full" />}
        {badge.label}
      </span>
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const totalSupply = ico.saleAmountForPhase1 + ico.saleAmountForPhase2 + ico.saleAmountForPhase3;
  const totalRemaining = ico.remainingAmountForPhase1 + ico.remainingAmountForPhase2 + ico.remainingAmountForPhase3;
  const soldPercentage = ((totalSupply - totalRemaining) / totalSupply) * 100;

  return (
    <div className="group bg-card border-border hover:shadow-primary/10 hover:border-primary/40 overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="from-primary/10 via-primary/5 to-background border-border relative border-b bg-gradient-to-br p-6">
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.02]" />

        <div className="relative mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-foreground group-hover:text-primary mb-1 text-2xl font-bold transition-colors">
              {ico.assetName}
            </h3>
            <p className="text-muted-foreground font-mono text-sm">ICO #{ico.index}</p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="relative mt-4">
          <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Progress</span>
            <span className="text-foreground font-bold">{soldPercentage.toFixed(1)}%</span>
          </div>
          <div className="bg-muted/50 h-2.5 w-full overflow-hidden rounded-full backdrop-blur-sm">
            <div
              className={cn(
                "relative h-full overflow-hidden rounded-full transition-all duration-500",
                status === "live" && "from-primary via-primary/80 to-primary bg-gradient-to-r",
                status === "ended" && "bg-gray-400",
                status === "upcoming" && "bg-muted-foreground",
              )}
              style={{ width: `${soldPercentage}%` }}
            >
              {status === "live" && (
                <div className="animate-gradient absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {status === "live" && currentPhase && (
          <>
            <div className="border-border/50 flex items-center justify-between border-b py-3">
              <span className="text-muted-foreground text-sm font-medium">Current Phase</span>
              <span className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-bold">
                Phase {currentPhase}/3
              </span>
            </div>
            <div className="border-border/50 flex items-center justify-between border-b py-3">
              <span className="text-muted-foreground text-sm font-medium">Price per Token</span>
              <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
                {currentPrice} Energy
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-muted-foreground text-sm font-medium">Available Supply</span>
              <span className="text-foreground text-sm font-bold">{formatNumber(currentRemaining)}</span>
            </div>
          </>
        )}

        {status === "upcoming" && (
          <div className="bg-muted/30 rounded-lg py-8 text-center">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">Launch Epoch</p>
            <p className="text-foreground text-3xl font-bold">{ico.startEpoch}</p>
          </div>
        )}

        {status === "ended" && (
          <div className="bg-muted/30 rounded-lg py-8 text-center">
            <p className="text-muted-foreground text-sm font-medium">Sale has concluded</p>
          </div>
        )}

        <Link to={`/ico/${ico.index}`} className="block">
          <Button
            className={cn(
              "w-full text-base font-semibold shadow-lg transition-all duration-300",
              status === "live" && "shadow-primary/25 hover:shadow-primary/30 hover:shadow-xl",
              status === "ended" && "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed shadow-none",
            )}
            disabled={status === "ended"}
          >
            {status === "live" ? "Buy Tokens" : "View Details"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
