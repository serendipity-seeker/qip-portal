import type { IEvent, TickEvents } from "@/types";
import { base64ToUint8Array } from "@/utils";

const CONTRACT_INDEX = 12;

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

enum QBAY_LOGS {
  SUCCESS = 0,
  INSUFFICIENT_QUBIC = 1,
  INVALID_INPUT = 2,
  // For createCollection
  INVALID_VOLUME_SIZE = 3,
  INSUFFICIENT_CFB = 4,
  LIMIT_COLLECTION_VOLUME = 5,
  ERROR_TRANSFER_ASSET = 6,
  MAX_NUMBER_OF_COLLECTION = 7,
  // For mint
  OVERFLOW_NFT = 8,
  LIMIT_HOLDING_NFT_PER_ONE_ID = 9,
  NOT_COLLECTION_CREATOR = 10,
  COLLECTION_FOR_DROP = 11,
  // For listInMarket & sale
  NOT_POSSESSOR = 12,
  WRONG_NFT_ID = 13,
  WRONG_URI = 14,
  NOT_SALE_STATUS = 15,
  LOW_PRICE = 16,
  NOT_ASK_STATUS = 17,
  NOT_OWNER = 18,
  NOT_ASK_USER = 19,
  RESERVED_NFT = 27,
  // For DropMint
  NOT_COLLECTION_FOR_DROP = 20,
  OVERFLOW_MAX_SIZE_PER_ONE_ID = 21,
  // For Auction
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

const checkSCLog = (event: IEvent) => {
  let result = false;
  if (
    event.eventType === EventType.CONTRACT_ERROR_MESSAGE ||
    event.eventType === EventType.CONTRACT_WARNING_MESSAGE ||
    event.eventType === EventType.CONTRACT_INFORMATION_MESSAGE ||
    event.eventType === EventType.CONTRACT_DEBUG_MESSAGE
  ) {
    result = true;
  }
  return result;
};

const decodeLogHeader = (eventData: string) => {
  const eventDataArray = base64ToUint8Array(eventData);
  const dataView = new DataView(eventDataArray.buffer);
  const SCIdx = dataView.getUint32(0, true);
  const eventType = dataView.getUint32(4, true);

  return { contractIdx: SCIdx, logType: QBAY_LOGS[eventType] };
};

const decodeLogBody = (eventData: string, logType: keyof typeof QBAY_LOGS) => {
  // const eventDataArray = base64ToUint8Array(eventData);
  // const dataView = new DataView(eventDataArray.buffer);

  console.log(eventData, logType);

  //   switch (logType) {
  //     case "SUCCESS":
  //       return {}; // Cutomize for other contracts
  //     default:
  //       return {};
  //   }

  // QBAY logs doesnt have any body data
  return {};
};

const decodeQbayLog = async (log: TickEvents) => {
  const result: any[] = [];

  for (const tx of log.txEvents) {
    for (const event of tx.events) {
      const isSCLog = checkSCLog(event);
      if (!isSCLog) continue;

      const { contractIdx, logType } = decodeLogHeader(event.eventData);
      if (contractIdx !== CONTRACT_INDEX) continue;

      const eventData = decodeLogBody(event.eventData, logType as keyof typeof QBAY_LOGS);
      if (eventData) {
        result.push({
          tick: log.tick,
          eventId: Number(event.header.eventId),
          logType,
          ...eventData,
        });
      }
    }
  }

  return result;
};

export { decodeQbayLog };
