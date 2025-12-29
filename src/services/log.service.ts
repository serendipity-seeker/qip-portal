import type { IEvent, TickEvents } from "@/types";
import { base64ToUint8Array } from "@/utils";
import { QIP_SC_INDEX, QIPLogInfo } from "@/utils/constants";

enum EventType {
  QU_TRANSFER = 0,
  ASSET_ISSUANCE = 1,
  ASSET_OWNERSHIP_CHANGE = 2,
  ASSET_POSSESSION_CHANGE = 3,
  CONTRACT_ERROR_MESSAGE = 4,
  CONTRACT_WARNING_MESSAGE = 5,
  CONTRACT_INFORMATION_MESSAGE = 6,
  CONTRACT_DEBUG_MESSAGE = 7,
  BURNING = 8,
  DUST_BURNING = 9,
  SPECTRUM_STATS = 10,
  ASSET_OWNERSHIP_MANAGING_CONTRACT_CHANGE = 11,
  ASSET_POSSESSION_MANAGING_CONTRACT_CHANGE = 12,
  CUSTOM_MESSAGE = 255,
}

// QIP log type names for human-readable messages
const QIP_LOG_NAMES: Record<number, string> = {
  [QIPLogInfo.QIP_success]: "SUCCESS",
  [QIPLogInfo.QIP_invalidStartEpoch]: "INVALID_START_EPOCH",
  [QIPLogInfo.QIP_invalidSaleAmount]: "INVALID_SALE_AMOUNT",
  [QIPLogInfo.QIP_invalidPrice]: "INVALID_PRICE",
  [QIPLogInfo.QIP_invalidPercent]: "INVALID_PERCENT",
  [QIPLogInfo.QIP_invalidTransfer]: "INVALID_TRANSFER",
  [QIPLogInfo.QIP_overflowICO]: "OVERFLOW_ICO",
  [QIPLogInfo.QIP_ICONotFound]: "ICO_NOT_FOUND",
  [QIPLogInfo.QIP_invalidAmount]: "INVALID_AMOUNT",
  [QIPLogInfo.QIP_invalidEpoch]: "INVALID_EPOCH",
  [QIPLogInfo.QIP_insufficientInvocationReward]: "INSUFFICIENT_FUNDS",
};

const checkSCLog = (event: IEvent) => {
  return (
    event.eventType === EventType.CONTRACT_ERROR_MESSAGE ||
    event.eventType === EventType.CONTRACT_WARNING_MESSAGE ||
    event.eventType === EventType.CONTRACT_INFORMATION_MESSAGE ||
    event.eventType === EventType.CONTRACT_DEBUG_MESSAGE
  );
};

const decodeLogHeader = (eventData: string) => {
  const eventDataArray = base64ToUint8Array(eventData);
  const dataView = new DataView(eventDataArray.buffer);
  const contractIdx = dataView.getUint32(0, true);
  const eventType = dataView.getUint32(4, true);

  return { contractIdx, eventType };
};

/**
 * Decode QIP contract logs
 */
const decodeQIPLogBody = (eventData: string, _eventType: number) => {
  const eventDataArray = base64ToUint8Array(eventData);
  const dataView = new DataView(eventDataArray.buffer);

  // QIP logs have a simple structure: contractIndex (4), type (4), dst (32), amt (8), terminator (1)
  const result: Record<string, unknown> = {};

  if (eventDataArray.length >= 44) {
    // Extract destination address (bytes 8-40)
    const dstBytes = eventDataArray.slice(8, 40);
    result.destination = dstBytes;

    // Extract amount (bytes 40-48)
    if (eventDataArray.length >= 48) {
      result.amount = Number(dataView.getBigInt64(40, true));
    }
  }

  return result;
};

/**
 * Decode QIP contract logs
 */
const decodeQIPLog = async (log: TickEvents) => {
  const result: {
    tick: number;
    txId: string;
    eventId: number;
    logType: string;
    eventType: number;
    isSuccess: boolean;
    [key: string]: unknown;
  }[] = [];

  for (const tx of log.txEvents) {
    for (const event of tx.events) {
      const isSCLog = checkSCLog(event);
      if (!isSCLog) continue;

      const { contractIdx, eventType } = decodeLogHeader(event.eventData);
      if (contractIdx !== QIP_SC_INDEX) continue;

      const logType = QIP_LOG_NAMES[eventType] || `UNKNOWN_${eventType}`;
      const eventData = decodeQIPLogBody(event.eventData, eventType);

      result.push({
        tick: log.tick,
        txId: tx.txId,
        eventId: Number(event.header.eventId),
        logType,
        eventType,
        isSuccess: eventType === QIPLogInfo.QIP_success,
        ...eventData,
      });
    }
  }

  return result;
};

/**
 * Check if QIP transaction was successful by looking at the logs
 */
const isQIPTxSuccessful = async (log: TickEvents, txId: string): Promise<{ success: boolean; logType: string }> => {
  const logs = await decodeQIPLog(log);
  const txLogs = logs.filter((l) => l.txId === txId);

  if (txLogs.length === 0) {
    return { success: false, logType: "NO_LOG_FOUND" };
  }

  // Get the last log for this transaction
  const lastLog = txLogs[txLogs.length - 1];
  return {
    success: lastLog.isSuccess,
    logType: lastLog.logType,
  };
};

export { decodeQIPLog, isQIPTxSuccessful };
