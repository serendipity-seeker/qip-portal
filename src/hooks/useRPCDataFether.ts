import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { useQubicConnect } from "@/components/composed/wallet-connect/QubicConnectContext";
import { fetchBalance, fetchArchiverStatus, fetchTickInfo } from "@/services/rpc.service";
import { balancesAtom } from "@/store/balances";
import { statusAtom } from "@/store/status";
import { tickInfoAtom } from "@/store/tickInfo";

const useRPCDataFetcher = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [tickInfo, setTickInfo] = useAtom(tickInfoAtom);
  const epoch = useRef<number>(tickInfo?.epoch);
  const [, setStatus] = useAtom(statusAtom);

  // Fetch tick info every 4 second
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const tickInfo = await fetchTickInfo();
        if (tickInfo && tickInfo?.tick) {
          setTickInfo(tickInfo);
          epoch.current = tickInfo.epoch;
        }
        
        const archiverStatus = await fetchArchiverStatus();
        setStatus(archiverStatus);
      } catch (error) {
        console.error("RPC data fetch error:", error);
        setStatus(null);
      }
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setTickInfo, setStatus]);

  // Wallet Setter
  const { wallet } = useQubicConnect();
  const [, setBalance] = useAtom(balancesAtom);

  useEffect(() => {
    const setUserAccount = async () => {
      if (wallet) {
        const balance = await fetchBalance(wallet.publicKey);
        setBalance([balance]);
      }
    };
    setUserAccount();
  }, [wallet, setBalance]);

  return null;
};

export default useRPCDataFetcher;
