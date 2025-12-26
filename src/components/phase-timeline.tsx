import { cn } from "@/utils";

interface PhaseTimelineProps {
  currentPhase: 1 | 2 | 3 | null;
  phase1Price: number;
  phase2Price: number;
  phase3Price: number;
  phase1Amount: number;
  phase2Amount: number;
  phase3Amount: number;
  phase1Remaining: number;
  phase2Remaining: number;
  phase3Remaining: number;
  startEpoch: number;
}

export function PhaseTimeline({
  currentPhase,
  phase1Price,
  phase2Price,
  phase3Price,
  phase1Amount,
  phase2Amount,
  phase3Amount,
  phase1Remaining,
  phase2Remaining,
  phase3Remaining,
  startEpoch,
}: PhaseTimelineProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getPhaseStatus = (phase: 1 | 2 | 3): "completed" | "active" | "upcoming" => {
    if (!currentPhase) return "upcoming";
    if (phase < currentPhase) return "completed";
    if (phase === currentPhase) return "active";
    return "upcoming";
  };

  const phases = [
    {
      number: 1 as const,
      price: phase1Price,
      amount: phase1Amount,
      remaining: phase1Remaining,
      epoch: startEpoch,
    },
    {
      number: 2 as const,
      price: phase2Price,
      amount: phase2Amount,
      remaining: phase2Remaining,
      epoch: startEpoch + 1,
    },
    {
      number: 3 as const,
      price: phase3Price,
      amount: phase3Amount,
      remaining: phase3Remaining,
      epoch: startEpoch + 2,
    },
  ];

  return (
    <div className="bg-card border-card-border rounded-lg border p-6">
      <h3 className="text-foreground mb-6 text-lg font-semibold">ICO Phases</h3>

      <div className="relative">
        <div className="bg-muted absolute top-8 right-0 left-0 h-0.5" style={{ zIndex: 0 }} />

        <div className="relative grid grid-cols-3 gap-4" style={{ zIndex: 1 }}>
          {phases.map((phase) => {
            const status = getPhaseStatus(phase.number);
            const soldPercentage = ((phase.amount - phase.remaining) / phase.amount) * 100;

            return (
              <div key={phase.number} className="flex flex-col items-center">
                <div
                  className={cn(
                    "mb-3 flex h-16 w-16 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    status === "completed" && "bg-[color:var(--success-40)] text-white",
                    status === "active" && "animate-pulse bg-[color:var(--primary-40)] text-white",
                    status === "upcoming" && "bg-muted text-muted-foreground",
                  )}
                >
                  {phase.number}
                </div>

                <div
                  className={cn(
                    "w-full rounded-lg border p-4 transition-colors",
                    status === "active" && "bg-card border-[color:var(--primary-40)]",
                    status !== "active" && "border-card-border bg-card",
                  )}
                >
                  <div className="mb-2 text-center">
                    <p className="text-muted-foreground mb-1 text-xs">Epoch {phase.epoch}</p>
                    <p className="text-lg font-bold text-[color:var(--primary-40)]">{phase.price} Energy</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="text-foreground font-medium">{formatNumber(phase.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className="text-foreground font-medium">{formatNumber(phase.remaining)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          status === "active" && "bg-[color:var(--primary-40)]",
                          status === "completed" && "bg-[color:var(--success-40)]",
                          status === "upcoming" && "bg-muted-foreground",
                        )}
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground mt-1 text-center text-xs">{soldPercentage.toFixed(1)}% sold</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
