import { base64ToUint8Array, createPayload, uint8ArrayToBase64, uriDecode } from "@/utils";
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper";

import { createSCTx } from "./tx.service";
import { fetchQuerySC } from "./rpc.service";

const qHelper = new QubicHelper();
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
    getURI: (offset: number) => uriDecode(responseArray.slice(offset, offset + 64)),
  };
};

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
    const QX_SC_INDEX = 1;
    return await createSCTx(sourceID, QX_SC_INDEX, 9, payload.getPackageSize(), 0, tick, payload);
};