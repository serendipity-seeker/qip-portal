import type { IEvent, TickEvents } from "@/types";
import { base64ToUint8Array } from "@/utils";
import { QIP_SC_INDEX, QIPLogInfo } from "@/utils/constants";

// Legacy NFT Marketplace Contract Index
const QBAY_CONTRACT_INDEX = 12;

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

// QBay (NFT Marketplace) log types - kept for backward compatibility
enum QBAY_LOGS {
  SUCCESS = 0,
  INSUFFICIENT_QUBIC = 1,
  INVALID_INPUT = 2,
  INVALID_VOLUME_SIZE = 3,
  INSUFFICIENT_CFB = 4,
  LIMIT_COLLECTION_VOLUME = 5,
  ERROR_TRANSFER_ASSET = 6,
  MAX_NUMBER_OF_COLLECTION = 7,
  OVERFLOW_NFT = 8,
  LIMIT_HOLDING_NFT_PER_ONE_ID = 9,
  NOT_COLLECTION_CREATOR = 10,
  COLLECTION_FOR_DROP = 11,
  NOT_POSSESSOR = 12,
  WRONG_NFT_ID = 13,
  WRONG_URI = 14,
  NOT_SALE_STATUS = 15,
  LOW_PRICE = 16,
  NOT_ASK_STATUS = 17,
  NOT_OWNER = 18,
  NOT_ASK_USER = 19,
  RESERVED_NFT = 27,
  NOT_COLLECTION_FOR_DROP = 20,
  OVERFLOW_MAX_SIZE_PER_ONE_ID = 21,
  NOT_ENDED_AUCTION = 22,
  NOT_TRADITIONAL_AUCTION = 23,
  NOT_AUCTION_TIME = 24,
  SMALL_PRICE = 25,
  NOT_MATCH_PAYMENT_METHOD = 26,
  NOT_AVAILABLE_CREATE_AND_MINT = 28,
  EXCHANGE_STATUS = 29,
  SALE_STATUS = 30,
  CREATOR_OF_AUCTION = 31,
  POSSESSOR = 32,
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

// Decode QBay (NFT Marketplace) logs - kept for backward compatibility
const decodeQbayLogBody = (eventData: string, logType: keyof typeof QBAY_LOGS) => {
  console.log(eventData, logType);
  return {};
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
 * Decode QBay (NFT Marketplace) logs
 */
const decodeQbayLog = async (log: TickEvents) => {
  const result: any[] = [];

  for (const tx of log.txEvents) {
    for (const event of tx.events) {
      const isSCLog = checkSCLog(event);
      if (!isSCLog) continue;

      const { contractIdx, eventType } = decodeLogHeader(event.eventData);
      if (contractIdx !== QBAY_CONTRACT_INDEX) continue;

      const logType = QBAY_LOGS[eventType] as keyof typeof QBAY_LOGS;
      const eventData = decodeQbayLogBody(event.eventData, logType);
      if (eventData) {
        result.push({
          tick: log.tick,
          txId: tx.txId,
          eventId: Number(event.header.eventId),
          logType,
          ...eventData,
        });
      }
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

export { decodeQbayLog, decodeQIPLog, isQIPTxSuccessful };
