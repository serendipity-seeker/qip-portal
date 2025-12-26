import { base64ToUint8Array, createPayload, uint8ArrayToBase64 } from "@/utils";
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper";

import { createSCTx } from "./tx.service";
import { fetchQuerySC } from "./rpc.service";
import { QIP_SC_INDEX, QX_SC_INDEX, QIP_TRANSFER_RIGHTS_FEE } from "@/utils/constants";
import { assetNameConvert } from "@/utils/tx.utils";
import type { ICOInfo } from "@/types";

const qHelper = new QubicHelper();

// Legacy SC_INDEX for NFT marketplace (kept for compatibility)
export const SC_INDEX = 12;

const createDataView = (size = 32) => new DataView(new Uint8Array(size).buffer);

const getResponseValues = (res: any) => {
  if (!res.responseData) return null;
  const responseView = new DataView(base64ToUint8Array(res.responseData).buffer);
  const responseArray = base64ToUint8Array(res.responseData);

  return {
    getUint64: (offset: number) => Number(responseView.getBigUint64(offset, true)),
    getUint32: (offset: number) => responseView.getUint32(offset, true),
    getUint8: (offset: number) => responseView.getUint8(offset),
    getID: (offset: number) => qHelper.getIdentity(responseArray.slice(offset, offset + 32)),
  };
};

// Helper to convert asset name number back to string
const assetNameToString = (assetName: number): string => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(assetName), true);
  const bytes = new Uint8Array(buffer);
  let result = "";
  for (let i = 0; i < 8; i++) {
    if (bytes[i] === 0) break;
    result += String.fromCharCode(bytes[i]);
  }
  return result;
};

// ==================== QIP Smart Contract Functions ====================

/**
 * Query ICO information by index
 * Corresponds to getICOInfo (Function #1) in qip.h
 */
export const getICOInfo = async (indexOfICO: number): Promise<ICOInfo | null> => {
  const view = createDataView(4);
  view.setUint32(0, indexOfICO, true);

  const res = await fetchQuerySC({
    contractIndex: QIP_SC_INDEX,
    inputType: 1, // getICOInfo function
    inputSize: 4,
    requestData: uint8ArrayToBase64(new Uint8Array(view.buffer)),
  });

  const values = getResponseValues(res);
  if (!values) return null;

  // Parse response according to getICOInfo_output structure in qip.h
  // The struct layout:
  // id creatorOfICO (32 bytes)
  // id issuer (32 bytes)
  // id address1-10 (10 * 32 = 320 bytes)
  // uint64 assetName (8 bytes)
  // uint64 price1, price2, price3 (24 bytes)
  // uint64 saleAmountForPhase1-3 (24 bytes)
  // uint64 remainingAmountForPhase1-3 (24 bytes)
  // uint32 percent1-10 (40 bytes)
  // uint32 startEpoch (4 bytes)

  let offset = 0;

  const creatorOfICO = await values.getID(offset);
  offset += 32;
  const issuer = await values.getID(offset);
  offset += 32;

  const addresses: string[] = [];
  for (let i = 0; i < 10; i++) {
    addresses.push(await values.getID(offset));
    offset += 32;
  }

  const assetNameNum = values.getUint64(offset);
  const assetName = assetNameToString(assetNameNum);
  offset += 8;

  const price1 = values.getUint64(offset);
  offset += 8;
  const price2 = values.getUint64(offset);
  offset += 8;
  const price3 = values.getUint64(offset);
  offset += 8;

  const saleAmountForPhase1 = values.getUint64(offset);
  offset += 8;
  const saleAmountForPhase2 = values.getUint64(offset);
  offset += 8;
  const saleAmountForPhase3 = values.getUint64(offset);
  offset += 8;

  const remainingAmountForPhase1 = values.getUint64(offset);
  offset += 8;
  const remainingAmountForPhase2 = values.getUint64(offset);
  offset += 8;
  const remainingAmountForPhase3 = values.getUint64(offset);
  offset += 8;

  const percents: number[] = [];
  for (let i = 0; i < 10; i++) {
    percents.push(values.getUint32(offset));
    offset += 4;
  }

  const startEpoch = values.getUint32(offset);

  // Check if this is a valid ICO (creator address should not be empty/null)
  if (creatorOfICO === "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") {
    return null;
  }

  return {
    index: indexOfICO,
    creatorOfICO,
    issuer,
    address1: addresses[0],
    address2: addresses[1],
    address3: addresses[2],
    address4: addresses[3],
    address5: addresses[4],
    address6: addresses[5],
    address7: addresses[6],
    address8: addresses[7],
    address9: addresses[8],
    address10: addresses[9],
    assetName,
    price1,
    price2,
    price3,
    saleAmountForPhase1,
    saleAmountForPhase2,
    saleAmountForPhase3,
    remainingAmountForPhase1,
    remainingAmountForPhase2,
    remainingAmountForPhase3,
    percent1: percents[0],
    percent2: percents[1],
    percent3: percents[2],
    percent4: percents[3],
    percent5: percents[4],
    percent6: percents[5],
    percent7: percents[6],
    percent8: percents[7],
    percent9: percents[8],
    percent10: percents[9],
    startEpoch,
  };
};

/**
 * Get all ICOs by iterating through the contract state
 * Since the contract doesn't expose numberOfICO, we iterate until we get null
 */
export const getAllICOs = async (): Promise<ICOInfo[]> => {
  const icos: ICOInfo[] = [];
  let index = 0;
  const maxIterations = 1024; // QIP_MAX_NUMBER_OF_ICO

  while (index < maxIterations) {
    try {
      const ico = await getICOInfo(index);
      if (!ico) break;
      icos.push(ico);
      index++;
    } catch (error) {
      break;
    }
  }

  return icos;
};

/**
 * Create ICO transaction
 * Corresponds to createICO (Procedure #1) in qip.h
 */
export const createICOTx = async (
  sourceID: string,
  input: {
    issuer: string;
    addresses: string[];
    assetName: string;
    price1: number;
    price2: number;
    price3: number;
    saleAmountForPhase1: number;
    saleAmountForPhase2: number;
    saleAmountForPhase3: number;
    percents: number[];
    startEpoch: number;
  },
  tick: number,
) => {
  // Build the payload according to createICO_input structure
  const issuerBytes = qHelper.getIdentityBytes(input.issuer);
  const addressBytes = input.addresses.map((addr) => qHelper.getIdentityBytes(addr));

  const payloadData: { data: number | bigint | Uint8Array; type: "uint8" | "uint16" | "uint32" | "bigint64" | "id" }[] =
    [];

  // Add issuer (32 bytes)
  payloadData.push({ data: issuerBytes, type: "id" });

  // Add 10 addresses (10 * 32 bytes)
  for (let i = 0; i < 10; i++) {
    payloadData.push({ data: addressBytes[i] || new Uint8Array(32), type: "id" });
  }

  // Add assetName (8 bytes)
  payloadData.push({ data: assetNameConvert(input.assetName), type: "bigint64" });

  // Add prices (3 * 8 bytes)
  payloadData.push({ data: input.price1, type: "bigint64" });
  payloadData.push({ data: input.price2, type: "bigint64" });
  payloadData.push({ data: input.price3, type: "bigint64" });

  // Add sale amounts (3 * 8 bytes)
  payloadData.push({ data: input.saleAmountForPhase1, type: "bigint64" });
  payloadData.push({ data: input.saleAmountForPhase2, type: "bigint64" });
  payloadData.push({ data: input.saleAmountForPhase3, type: "bigint64" });

  // Add percents (10 * 4 bytes)
  for (let i = 0; i < 10; i++) {
    payloadData.push({ data: input.percents[i] || 0, type: "uint32" });
  }

  // Add startEpoch (4 bytes)
  payloadData.push({ data: input.startEpoch, type: "uint32" });

  const payload = createPayload(payloadData);

  // createICO doesn't require any invocation reward (amount = 0)
  return await createSCTx(sourceID, QIP_SC_INDEX, 1, payload.getPackageSize(), 0, tick, payload);
};

/**
 * Buy token transaction
 * Corresponds to buyToken (Procedure #2) in qip.h
 */
export const buyTokenTx = async (
  sourceID: string,
  indexOfICO: number,
  amount: number,
  totalCost: number, // amount * price
  tick: number,
) => {
  const payload = createPayload([
    { data: indexOfICO, type: "uint32" },
    { data: amount, type: "bigint64" },
  ]);

  // The invocation reward should be >= amount * price
  return await createSCTx(sourceID, QIP_SC_INDEX, 2, payload.getPackageSize(), totalCost, tick, payload);
};

/**
 * Transfer share management rights from QIP contract
 * Corresponds to TransferShareManagementRights (Procedure #3) in qip.h
 */
export const transferShareManagementRightsFromQIP = async (
  sourceID: string,
  asset: { issuer: string; assetName: number },
  numberOfShares: number,
  newManagingContractIndex: number,
  tick: number,
) => {
  const assetIssuer = qHelper.getIdentityBytes(asset.issuer);
  const payload = createPayload([
    ...Array.from(assetIssuer).map((byte) => ({ data: byte, type: "uint8" as const })),
    { data: asset.assetName, type: "bigint64" },
    { data: numberOfShares, type: "bigint64" },
    { data: newManagingContractIndex, type: "uint32" },
  ]);
  return await createSCTx(
    sourceID,
    QIP_SC_INDEX,
    3,
    payload.getPackageSize(),
    QIP_TRANSFER_RIGHTS_FEE,
    tick,
    payload,
  );
};

// ==================== Legacy NFT Marketplace Functions ====================
// Keep existing functions for backward compatibility

export const getNumberOfNFTForUser = async (user: Uint8Array | string) => {
  if (typeof user === "string") {
    user = qHelper.getIdentityBytes(user);
  }

  const view = createDataView();
  user.forEach((byte, index) => view.setUint8(index, byte));

  const res = await fetchQuerySC({
    contractIndex: SC_INDEX,
    inputType: 1,
    inputSize: 32,
    requestData: uint8ArrayToBase64(new Uint8Array(view.buffer)),
  });

  if (!res.responseData) return 0;
  return Number(new DataView(base64ToUint8Array(res.responseData).buffer).getBigUint64(0, true));
};

export const getInfoOfMarketplace = async () => {
  const res = await fetchQuerySC({
    contractIndex: SC_INDEX,
    inputType: 3,
    inputSize: 0,
    requestData: "",
  });

  const values = getResponseValues(res);
  if (!values) return null;

  return {
    priceOfCFB: values.getUint64(0) || 0,
    priceOfQubic: values.getUint64(8) || 0,
    numberOfNFTIncoming: values.getUint64(16) || 0,
    earnedQubic: values.getUint64(24) || 0,
    earnedCFB: values.getUint64(32) || 0,
    numberOfCollection: values.getUint32(40) || 0,
    numberOfNFT: values.getUint32(44) || 0,
    statusOfMarketPlace: values.getUint8(48) || 0,
  };
};

/**
 * Transfer share management rights via QX (for tokens not managed by QIP)
 */
export const transferShareManagementRights = async (
  sourceID: string,
  asset: { issuer: string; assetName: number },
  numberOfShares: number,
  newManagingContractIndex: number,
  tick: number,
) => {
  const assetIssuer = qHelper.getIdentityBytes(asset.issuer);
  const payload = createPayload([
    ...Array.from(assetIssuer).map((byte) => ({ data: byte, type: "uint8" as const })),
    { data: asset.assetName, type: "bigint64" },
    { data: numberOfShares, type: "bigint64" },
    { data: newManagingContractIndex, type: "uint32" },
  ]);
  return await createSCTx(sourceID, QX_SC_INDEX, 9, payload.getPackageSize(), 0, tick, payload);
};
