import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/utils";
import { qipService, type ICOInfo } from "@/utils/qip-service";
import { ICOCard } from "@/components/ico-card";
import { StatsBar } from "@/components/stats-bar";
import { Button } from "@/components/ui/button";
import { Rocket, Shield, TrendingUp } from "lucide-react";

const HomePage: React.FC = () => {
  const [icos, setIcos] = useState<ICOInfo[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "ended">("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allICOs, epoch] = await Promise.all([qipService.getAllICOs(), qipService.getCurrentEpoch()]);
        setIcos(allICOs);
        setCurrentEpoch(epoch);
      } catch (error) {
        console.error("Failed to load ICOs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          <p className="text-muted-foreground">Loading token sales...</p>
        </div>
      </div>
    );
  }

  const liveICOs = icos.filter((ico) => qipService.getICOStatus(ico, currentEpoch) === "live");
  const upcomingICOs = icos.filter((ico) => qipService.getICOStatus(ico, currentEpoch) === "upcoming");
  const endedICOs = icos.filter((ico) => qipService.getICOStatus(ico, currentEpoch) === "ended");

  const filteredICOs =
    filter === "all" ? icos : filter === "live" ? liveICOs : filter === "upcoming" ? upcomingICOs : endedICOs;

  return (
    <div className="flex flex-col gap-12">
      <section className="border-border from-primary/5 via-background to-background relative overflow-hidden border-b bg-gradient-to-b">
        {/* Decorative background elements */}
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.02]" />
        <div className="bg-primary/10 absolute top-0 right-0 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute bottom-0 left-0 h-96 w-96 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              <span>Secure, Transparent, On-Chain</span>
            </div>

            <h1 className="text-foreground mb-6 text-5xl leading-tight font-bold text-balance uppercase lg:text-7xl">
              Transparent Token Sales on{" "}
              <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">Qubic</span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-xl leading-relaxed">
              Participate in secure, non-custodial token launches. All transactions verified on-chain with complete fund
              distribution transparency.
            </p>

            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/create">
                <Button
                  size="lg"
                  className="shadow-primary/25 hover:shadow-primary/30 px-8 text-base shadow-lg transition-all hover:shadow-xl"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Your ICO
                </Button>
              </Link>
              <div className="bg-card border-border flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium">
                <div className="bg-success-40 h-2 w-2 animate-pulse rounded-full" />
                <span className="text-muted-foreground">Current Epoch:</span>
                <span className="text-foreground font-bold">{currentEpoch}</span>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { icon: <Shield className="h-5 w-5" />, title: "Non-Custodial", desc: "You control your funds" },
                { icon: <TrendingUp className="h-5 w-5" />, title: "Transparent", desc: "All transactions on-chain" },
                { icon: <Rocket className="h-5 w-5" />, title: "Fast Launch", desc: "Go live in minutes" },
              ].map((feature, i) => (
                <div key={i} className="bg-card/50 border-border/50 flex items-start gap-3 rounded-lg border p-4">
                  <div className="bg-primary/10 text-primary mt-0.5 rounded-lg p-2">{feature.icon}</div>
                  <div className="text-left">
                    <p className="text-foreground mb-0.5 text-sm font-semibold">{feature.title}</p>
                    <p className="text-muted-foreground text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto flex-1 px-6 py-12">
        <div className="mb-12">
          <StatsBar />
        </div>

        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-foreground mb-1 text-2xl font-bold">Token Sales</h2>
            <p className="text-muted-foreground text-sm">Browse and invest in verified ICOs</p>
          </div>

          <div className="flex gap-2">
            {[
              { value: "all", label: "All", count: icos.length },
              { value: "live", label: "Live", count: liveICOs.length },
              { value: "upcoming", label: "Upcoming", count: upcomingICOs.length },
              { value: "ended", label: "Ended", count: endedICOs.length },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={cn(
                  "rounded-lg px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold transition-all duration-200",
                  filter === tab.value
                    ? "bg-primary text-primary-foreground shadow-primary/25 shadow-lg"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border hover:border-primary/30 border",
                )}
              >
                {tab.label}
                <span className={cn("ml-2 text-xs", filter === tab.value ? "opacity-90" : "opacity-60")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredICOs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredICOs.map((ico) => (
              <ICOCard
                key={ico.index}
                ico={ico}
                currentEpoch={currentEpoch}
                status={qipService.getICOStatus(ico, currentEpoch)}
                currentPhase={qipService.getCurrentPhase(ico, currentEpoch)}
                currentPrice={qipService.getCurrentPrice(ico, currentEpoch)}
                currentRemaining={qipService.getCurrentRemaining(ico, currentEpoch)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl">
              <svg className="text-muted-foreground h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-foreground mb-2 text-lg font-semibold">
              No {filter !== "all" ? filter : ""} ICOs available
            </p>
            <p className="text-muted-foreground mb-6 text-sm">Check back later or launch your own token sale</p>
            <Link to="/create">
              <Button variant="outline">
                <Rocket className="mr-2 h-4 w-4" />
                Create ICO
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
