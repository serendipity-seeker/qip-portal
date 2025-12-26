import { toast } from "sonner";
import { useAtom } from "jotai";
import { useEffect } from "react";

import { monitoringTasksAtom, monitorStrategyAtom, useTxMonitor } from "@/store/txMonitor";
import { tickInfoAtom } from "@/store/tickInfo";
import { statusAtom } from "@/store/status";
import { fetchApprovedTx } from "@/services/rpc.service";
import { fetchTickEvents } from "@/services/rpc.service";
import { decodeQbayLog } from "@/services/log.service";
import type { TickEvents } from "@/types";

const useGlobalTxMonitor = () => {
  const [tickInfo] = useAtom(tickInfoAtom);
  const [monitoringTasks] = useAtom(monitoringTasksAtom);
  const [monitorStrategy] = useAtom(monitorStrategyAtom);
  const { isMonitoring, stopMonitoring } = useTxMonitor();
  const [status] = useAtom(statusAtom);

  /**
   * v1 is original version, and it is too difficult to implement all checker functions
   * v2, v3 is much easier than v1, and good result
   * but TransferShareRight is not procedue of Qbay contract, so it is not available by v3
   * so we remain v1, v2 for this procedure
   */

  /**
   * v1: only using http endpoint
   * pros: no need to archiver
   * cons: need to write custom check function
   */
  useEffect(() => {
    if (!isMonitoring) return;
    const currentTick = tickInfo?.tick;

    if (monitorStrategy === "v1") {
      Object.entries(monitoringTasks).forEach(async ([taskId, task]) => {
        const { checker, onSuccess, onFailure } = task;

        if (!currentTick) return;

        const TIMEOUT_TICKS = 10;
        if (currentTick > task.targetTick + TIMEOUT_TICKS) {
          stopMonitoring(taskId);
          await onFailure();
          return;
        }

        console.log("progress", currentTick, task.targetTick);
        if (currentTick > task.targetTick) {
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
  }, [tickInfo, isMonitoring, monitoringTasks, monitorStrategy, stopMonitoring]);

  /**
   * v2: using archiver approved-transaction endpoint
   * pros: no need to write custom check function
   * cons: cant check why tx is failed
   */
  useEffect(() => {
    if (!isMonitoring) return;

    if (monitorStrategy === "v2") {
      Object.entries(monitoringTasks).forEach(([taskId, task]) => {
        const { onSuccess, onFailure } = task;

        if (!status || !task.txHash) return;

        console.log("progress", status.lastProcessedTick.tickNumber, task.targetTick);
        if (status.lastProcessedTick.tickNumber > task.targetTick) {
          fetchApprovedTx(task.targetTick).then(async (txs) => {
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
  }, [isMonitoring, monitoringTasks, status, monitorStrategy, stopMonitoring]);

  /**
   * v3: using log - best choice
   * pros: can check why tx is failed
   * cons: need implementation of SC side logging code
   */
  useEffect(() => {
    if (!isMonitoring) return;
    if (monitorStrategy === "v3") {
      Object.entries(monitoringTasks).forEach(async ([taskId, task]) => {
        const { onSuccess, onFailure } = task;

        if (!status) return;

        console.log("progress", status.lastProcessedTick.tickNumber, task.targetTick);
        if (status.lastProcessedTick.tickNumber > task.targetTick) {
          let tickEvents: TickEvents | null = null;
          let attempts = 0;
          const maxAttempts = 10;
          while (attempts < maxAttempts) {
            tickEvents = await fetchTickEvents(task.targetTick);
            if (tickEvents) break;
            attempts++;
          }
          if (!tickEvents) {
            onFailure();
            stopMonitoring(taskId);
            return;
          }
          const logs = await decodeQbayLog(tickEvents);
          stopMonitoring(taskId);
          // This is special case because of SC issue
          if (taskId.includes("reject-exchange")) {
            if (logs[logs.length - 1]?.logType === "NOT_POSSESSOR") {
              await onSuccess();
            } else {
              await onFailure();
              if (logs.length > 0) toast.error(logs[logs.length - 1]?.logType);
            }
          } else if (logs[logs.length - 1]?.logType === "SUCCESS") {
            await onSuccess();
          } else {
            await onFailure();
            if (logs.length > 0) toast.error(logs[logs.length - 1]?.logType);
          }
        }
      });
    }
  }, [isMonitoring, monitoringTasks, status, monitorStrategy, stopMonitoring]);

  useEffect(() => {
    if (!isMonitoring) return;
    const toastId = toast.loading("Monitoring transaction...", {
      position: "bottom-right",
    });
    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [isMonitoring]);

  return null;
};

export default useGlobalTxMonitor;
