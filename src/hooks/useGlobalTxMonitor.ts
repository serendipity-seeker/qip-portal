import { toast } from "sonner";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { monitoringTasksAtom, monitorStrategyAtom, useTxMonitor, resultAtom } from "@/store/txMonitor";
import { latestTickAtom } from "@/store/rpc";
import { fetchLatestTick, fetchTickEvents, fetchTickTxs } from "@/services/rpc.service";
import { decodeQIPLog } from "@/services/log.service";
import type { TickEvents } from "@/types";

function useResultHandlers(setResult: (val: boolean) => void) {
  return {
    onSuccess: async () => {
      setResult(true);
    },
    onFailure: async () => {
      setResult(false);
    },
  };
}

const useGlobalTxMonitor = () => {
  const [monitoringTasks] = useAtom(monitoringTasksAtom);
  const [monitorStrategy] = useAtom(monitorStrategyAtom);
  const { isMonitoring, stopMonitoring } = useTxMonitor();
  const [, setResult] = useAtom(resultAtom);
  const [latestTick, setLatestTick] = useAtom(latestTickAtom);

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const resultHandlers = useResultHandlers(setResult);

  useEffect(() => {
    // If monitoring starts, set up the interval
    if (isMonitoring) {
      fetchLatestTick().then((tick) => {
        setLatestTick(tick);
      });

      intervalIdRef.current = setInterval(() => {
        fetchLatestTick().then((tick) => {
          setLatestTick(tick);
        });
      }, 5000);
    } else {
      // If monitoring stops, clear the interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    // Cleanup on unmount or when isMonitoring changes
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isMonitoring, setLatestTick]);

  /**
   * v1 is original version, and it is too difficult to implement all checker functions
   * v2, v3 is much easier than v1, and good result
   * but TransferShareRight is not procedue of QRaffle contract, so it is not available by v3
   * so we remain v1, v2 for this procedure
   */

  /**
   * v1: only using http endpoint
   * pros: no need to archiver
   * cons: need to write custom check function
   */
  useEffect(() => {
    if (!isMonitoring) return;

    if (monitorStrategy === "v1") {
      Object.entries(monitoringTasks).forEach(async ([taskId, task]) => {
        // wrap/override with resultHandlers
        const onSuccess = async () => {
          await task.onSuccess?.();
          await resultHandlers.onSuccess();
        };
        const onFailure = async () => {
          await task.onFailure?.();
          await resultHandlers.onFailure();
        };

        const { checker } = task;

        if (!latestTick) return;

        const TIMEOUT_TICKS = 10;
        if (latestTick > task.targetTick + TIMEOUT_TICKS) {
          stopMonitoring(taskId);
          await onFailure();
          return;
        }

        console.log("progress", latestTick, task.targetTick);
        if (latestTick > task.targetTick) {
          checker().then(async (success) => {
            if (success) {
              stopMonitoring(taskId);
              await onSuccess();
            } else {
              return;
            }
          });
        }
      });
    }
  }, [latestTick, isMonitoring, monitoringTasks, monitorStrategy, stopMonitoring, resultHandlers]);

  /**
   * v2: using archiver approved-transaction endpoint
   * pros: no need to write custom check function
   * cons: cant check why tx is failed
   */
  useEffect(() => {
    if (!isMonitoring) return;

    if (monitorStrategy === "v2") {
      Object.entries(monitoringTasks).forEach(([taskId, task]) => {
        // wrap/override with resultHandlers
        const onSuccess = async () => {
          await task.onSuccess?.();
          await resultHandlers.onSuccess();
        };
        const onFailure = async () => {
          await task.onFailure?.();
          await resultHandlers.onFailure();
        };

        if (!latestTick || !task.txHash) return;

        console.log("progress", latestTick, task.targetTick);
        if (latestTick > task.targetTick) {
          fetchTickTxs(task.targetTick).then(async (txs) => {
            stopMonitoring(taskId);
            if (txs.length > 0) {
              const tx = txs.find((tx) => tx.transaction.txId === task.txHash);
              if (tx) {
                await onSuccess();
              } else {
                await onFailure();
              }
            } else {
              await onFailure();
            }
          });
        }
      });
    }
  }, [isMonitoring, monitoringTasks, latestTick, monitorStrategy, stopMonitoring, resultHandlers]);

  /**
   * v3: using log - best choice
   * pros: can check why tx is failed
   * cons: need implementation of SC side logging code
   */
  useEffect(() => {
    if (!isMonitoring) return;
    if (monitorStrategy === "v3") {
      Object.entries(monitoringTasks).forEach(async ([taskId, task]) => {
        // wrap/override with resultHandlers
        const onSuccess = async () => {
          await task.onSuccess?.();
          await resultHandlers.onSuccess();
        };
        const onFailure = async () => {
          await task.onFailure?.();
          await resultHandlers.onFailure();
        };

        if (!latestTick) return;

        console.log("progress", latestTick, task.targetTick);
        if (latestTick > task.targetTick + 2) {
          let tickEvents: TickEvents | null = null;
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts) {
            tickEvents = await fetchTickEvents(task.targetTick);
            if (tickEvents) break;
            attempts++;
            // Small delay between retries
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          if (!tickEvents) {
            console.log("no tick events");
            await onFailure();
            stopMonitoring(taskId);
            return;
          }
          const logs = await decodeQIPLog(tickEvents);

          // Filter logs for this specific transaction if txHash is provided
          const relevantLogs = task.txHash ? logs.filter((log) => log.txId === task.txHash) : logs;

          const lastLogType = relevantLogs[relevantLogs.length - 1]?.logType;

          stopMonitoring(taskId);

          // QIP success types
          if (lastLogType === "SUCCESS") {
            await onSuccess();
          } else {
            if (relevantLogs.length > 0) {
              toast.error(`Transaction failed: ${lastLogType}`);
            }
            await onFailure();
          }
        }
      });
    }
  }, [isMonitoring, monitoringTasks, latestTick, monitorStrategy, stopMonitoring, resultHandlers]);

  useEffect(() => {
    if (!isMonitoring) return;
    const toastId = toast.loading("Monitoring transaction...", {
      position: "bottom-right",
    });
    return () => {
      toast.dismiss(toastId as string);
    };
  }, [isMonitoring]);

  return null;
};

export default useGlobalTxMonitor;
