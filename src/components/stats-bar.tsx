import type React from "react";
import { TrendingUp, Users, DollarSign, Package } from "lucide-react";

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
}

export function StatsBar() {
  const stats: StatItem[] = [
    {
      icon: <Package className="h-5 w-5" />,
      label: "Active ICOs",
      value: "12",
      trend: "+3 this week",
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "Total Raised",
      value: "1.2M Energy",
      trend: "+15% this month",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Investors",
      value: "3,847",
      trend: "+234 this week",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Success Rate",
      value: "94%",
      trend: "Last 30 days",
    },
  ];

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
