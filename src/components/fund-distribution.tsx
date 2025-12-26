import type { ICOInfo } from "@/utils/qip-service";

interface FundDistributionProps {
  ico: ICOInfo;
}

export function FundDistribution({ ico }: FundDistributionProps) {
  const addresses = [
    { address: ico.address1, percent: ico.percent1 },
    { address: ico.address2, percent: ico.percent2 },
    { address: ico.address3, percent: ico.percent3 },
    { address: ico.address4, percent: ico.percent4 },
    { address: ico.address5, percent: ico.percent5 },
    { address: ico.address6, percent: ico.percent6 },
    { address: ico.address7, percent: ico.percent7 },
    { address: ico.address8, percent: ico.percent8 },
    { address: ico.address9, percent: ico.percent9 },
    { address: ico.address10, percent: ico.percent10 },
  ].filter((item) => item.percent > 0);

  const totalPercent = addresses.reduce((sum, item) => sum + item.percent, 0);
  const contractPercent = 100 - totalPercent;

  const truncateAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
  };

  return (
    <div className="bg-card border-card-border rounded-lg border p-6">
      <div className="mb-6">
        <h3 className="text-foreground mb-2 text-lg font-semibold">Fund Distribution</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Revenue from token sales is automatically distributed to the following addresses
        </p>
      </div>

      <div className="space-y-4">
        {addresses.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="mr-4 flex-1">
                <p className="text-muted-foreground mb-1 text-xs">Address {index + 1}</p>
                <p className="text-foreground font-mono text-sm break-all">{truncateAddress(item.address)}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[color:var(--primary-40)]">{item.percent}%</span>
              </div>
            </div>

            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-[color:var(--primary-40)] transition-all duration-300"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}

        <div className="border-card-border border-t pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="mr-4 flex-1">
                <p className="text-muted-foreground mb-1 text-xs">Smart Contract Shareholders</p>
                <p className="text-foreground text-sm">
                  Remaining funds distributed to contract shareholders via dividends
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[color:var(--success-40)]">{contractPercent}%</span>
              </div>
            </div>

            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-[color:var(--success-40)] transition-all duration-300"
                style={{ width: `${contractPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-card-border border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-semibold">Total Distribution</span>
            <span className="text-foreground text-lg font-bold">100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
