import type React from "react";
import { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Package } from "lucide-react";
import { qipService } from "@/utils/qip-service";

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
}

export function StatsBar() {
  const [stats, setStats] = useState<StatItem[]>([
    {
      icon: <Package className="h-5 w-5" />,
      label: "Active ICOs",
      value: "-",
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "Total Supply",
      value: "-",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Total Sold",
      value: "-",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Avg. Progress",
      value: "-",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [icos, currentEpoch] = await Promise.all([
          qipService.getAllICOs(),
          qipService.getCurrentEpoch(),
        ]);

        if (icos.length === 0) {
          setStats([
            {
              icon: <Package className="h-5 w-5" />,
              label: "Active ICOs",
              value: "0",
              trend: "No ICOs yet",
            },
            {
              icon: <DollarSign className="h-5 w-5" />,
              label: "Total Supply",
              value: "0",
            },
            {
              icon: <Users className="h-5 w-5" />,
              label: "Total Sold",
              value: "0",
            },
            {
              icon: <TrendingUp className="h-5 w-5" />,
              label: "Avg. Progress",
              value: "0%",
            },
          ]);
          return;
        }

        const liveICOs = icos.filter((ico) => qipService.getICOStatus(ico, currentEpoch) === "live");
        const upcomingICOs = icos.filter((ico) => qipService.getICOStatus(ico, currentEpoch) === "upcoming");

        const totalSupply = icos.reduce(
          (sum, ico) => sum + ico.saleAmountForPhase1 + ico.saleAmountForPhase2 + ico.saleAmountForPhase3,
          0,
        );

        const totalSold = icos.reduce((sum, ico) => sum + qipService.getTotalSold(ico), 0);

        const avgProgress = icos.length > 0
          ? Math.round(icos.reduce((sum, ico) => sum + qipService.getProgress(ico), 0) / icos.length)
          : 0;

        const formatNumber = (num: number): string => {
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toString();
        };

        setStats([
          {
            icon: <Package className="h-5 w-5" />,
            label: "Active ICOs",
            value: liveICOs.length.toString(),
            trend: upcomingICOs.length > 0 ? `+${upcomingICOs.length} upcoming` : undefined,
          },
          {
            icon: <DollarSign className="h-5 w-5" />,
            label: "Total Supply",
            value: formatNumber(totalSupply),
            trend: `${icos.length} total ICOs`,
          },
          {
            icon: <Users className="h-5 w-5" />,
            label: "Total Sold",
            value: formatNumber(totalSold),
            trend: totalSupply > 0 ? `${Math.round((totalSold / totalSupply) * 100)}% of supply` : undefined,
          },
          {
            icon: <TrendingUp className="h-5 w-5" />,
            label: "Avg. Progress",
            value: `${avgProgress}%`,
            trend: "Across all ICOs",
          },
        ]);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-card border-border hover:border-primary/30 group rounded-xl border p-6 transition-all duration-300"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="bg-primary/10 text-primary group-hover:bg-primary rounded-lg p-2 transition-all duration-300 group-hover:text-white">
              {stat.icon}
            </div>
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-foreground text-2xl font-bold">{stat.value}</p>
            <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
            {stat.trend && <p className="text-primary text-xs font-medium">{stat.trend}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
