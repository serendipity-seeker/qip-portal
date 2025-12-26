export interface ICOInfo {
  index: number;
  creatorOfICO: string;
  issuer: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  address5: string;
  address6: string;
  address7: string;
  address8: string;
  address9: string;
  address10: string;
  assetName: string;
  price1: number;
  price2: number;
  price3: number;
  saleAmountForPhase1: number;
  saleAmountForPhase2: number;
  saleAmountForPhase3: number;
  remainingAmountForPhase1: number;
  remainingAmountForPhase2: number;
  remainingAmountForPhase3: number;
  percent1: number;
  percent2: number;
  percent3: number;
  percent4: number;
  percent5: number;
  percent6: number;
  percent7: number;
  percent8: number;
  percent9: number;
  percent10: number;
  startEpoch: number;
}

export interface CreateICOInput {
  issuer: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  address5: string;
  address6: string;
  address7: string;
  address8: string;
  address9: string;
  address10: string;
  assetName: string;
  price1: number;
  price2: number;
  price3: number;
  saleAmountForPhase1: number;
  saleAmountForPhase2: number;
  saleAmountForPhase3: number;
  percent1: number;
  percent2: number;
  percent3: number;
  percent4: number;
  percent5: number;
  percent6: number;
  percent7: number;
  percent8: number;
  percent9: number;
  percent10: number;
  startEpoch: number;
}

export type ICOStatus = "upcoming" | "live" | "ended";

export interface BuyTokenResult {
  success: boolean;
  returnCode: number;
  message: string;
}

export interface CreateICOResult {
  success: boolean;
  returnCode: number;
  message: string;
}

// Mock data for development
const mockICOs: ICOInfo[] = [
  {
    index: 0,
    creatorOfICO: "QUBICADDRESSEXAMPLE1111111111111111111111111111111",
    issuer: "ISSUERADDRESS111111111111111111111111111111111111",
    address1: "ADDR1111111111111111111111111111111111111111111111",
    address2: "ADDR2222222222222222222222222222222222222222222222",
    address3: "ADDR3333333333333333333333333333333333333333333333",
    address4: "ADDR4444444444444444444444444444444444444444444444",
    address5: "ADDR5555555555555555555555555555555555555555555555",
    address6: "ADDR6666666666666666666666666666666666666666666666",
    address7: "ADDR7777777777777777777777777777777777777777777777",
    address8: "ADDR8888888888888888888888888888888888888888888888",
    address9: "ADDR9999999999999999999999999999999999999999999999",
    address10: "ADDR0000000000000000000000000000000000000000000000",
    assetName: "QTOKEN",
    price1: 100,
    price2: 150,
    price3: 200,
    saleAmountForPhase1: 1000000,
    saleAmountForPhase2: 2000000,
    saleAmountForPhase3: 3000000,
    remainingAmountForPhase1: 750000,
    remainingAmountForPhase2: 2000000,
    remainingAmountForPhase3: 3000000,
    percent1: 20,
    percent2: 15,
    percent3: 15,
    percent4: 10,
    percent5: 10,
    percent6: 10,
    percent7: 5,
    percent8: 5,
    percent9: 3,
    percent10: 2,
    startEpoch: 1000,
  },
  {
    index: 1,
    creatorOfICO: "QUBICADDRESSEXAMPLE2222222222222222222222222222222",
    issuer: "ISSUERADDRESS222222222222222222222222222222222222",
    address1: "BADDR111111111111111111111111111111111111111111111",
    address2: "BADDR222222222222222222222222222222222222222222222",
    address3: "BADDR333333333333333333333333333333333333333333333",
    address4: "BADDR444444444444444444444444444444444444444444444",
    address5: "BADDR555555555555555555555555555555555555555555555",
    address6: "BADDR666666666666666666666666666666666666666666666",
    address7: "BADDR777777777777777777777777777777777777777777777",
    address8: "BADDR888888888888888888888888888888888888888888888",
    address9: "BADDR999999999999999999999999999999999999999999999",
    address10: "BADDR000000000000000000000000000000000000000000000",
    assetName: "NEXTOKEN",
    price1: 50,
    price2: 75,
    price3: 100,
    saleAmountForPhase1: 500000,
    saleAmountForPhase2: 1000000,
    saleAmountForPhase3: 1500000,
    remainingAmountForPhase1: 500000,
    remainingAmountForPhase2: 1000000,
    remainingAmountForPhase3: 1500000,
    percent1: 25,
    percent2: 20,
    percent3: 15,
    percent4: 10,
    percent5: 8,
    percent6: 7,
    percent7: 5,
    percent8: 3,
    percent9: 1,
    percent10: 1,
    startEpoch: 1200,
  },
  {
    index: 2,
    creatorOfICO: "QUBICADDRESSEXAMPLE3333333333333333333333333333333",
    issuer: "ISSUERADDRESS333333333333333333333333333333333333",
    address1: "CADDR111111111111111111111111111111111111111111111",
    address2: "CADDR222222222222222222222222222222222222222222222",
    address3: "CADDR333333333333333333333333333333333333333333333",
    address4: "CADDR444444444444444444444444444444444444444444444",
    address5: "CADDR555555555555555555555555555555555555555555555",
    address6: "CADDR666666666666666666666666666666666666666666666",
    address7: "CADDR777777777777777777777777777777777777777777777",
    address8: "CADDR888888888888888888888888888888888888888888888",
    address9: "CADDR999999999999999999999999999999999999999999999",
    address10: "CADDR000000000000000000000000000000000000000000000",
    assetName: "ALPHATOKEN",
    price1: 200,
    price2: 300,
    price3: 400,
    saleAmountForPhase1: 2000000,
    saleAmountForPhase2: 3000000,
    saleAmountForPhase3: 5000000,
    remainingAmountForPhase1: 0,
    remainingAmountForPhase2: 0,
    remainingAmountForPhase3: 0,
    percent1: 30,
    percent2: 20,
    percent3: 15,
    percent4: 10,
    percent5: 8,
    percent6: 5,
    percent7: 3,
    percent8: 2,
    percent9: 1,
    percent10: 1,
    startEpoch: 800,
  },
];

const currentEpoch = 1000;

export const qipService = {
  getCurrentEpoch: async (): Promise<number> => {
    return Promise.resolve(currentEpoch);
  },

  getAllICOs: async (): Promise<ICOInfo[]> => {
    return Promise.resolve(mockICOs);
  },

  getICOInfo: async (index: number): Promise<ICOInfo | null> => {
    const ico = mockICOs.find((ico) => ico.index === index);
    return Promise.resolve(ico || null);
  },

  createICO: async (input: CreateICOInput): Promise<CreateICOResult> => {
    const currentEpoch = await qipService.getCurrentEpoch();

    if (input.startEpoch <= currentEpoch + 1) {
      return {
        success: false,
        returnCode: 1,
        message: "Start epoch must be at least 2 epochs in the future",
      };
    }

    if (input.price1 <= 0 || input.price2 <= 0 || input.price3 <= 0) {
      return {
        success: false,
        returnCode: 3,
        message: "All prices must be greater than zero",
      };
    }

    const percentSum =
      input.percent1 +
      input.percent2 +
      input.percent3 +
      input.percent4 +
      input.percent5 +
      input.percent6 +
      input.percent7 +
      input.percent8 +
      input.percent9 +
      input.percent10;

    if (percentSum !== 95) {
      return {
        success: false,
        returnCode: 4,
        message: `Percentages must sum to 95 (current: ${percentSum})`,
      };
    }

    return {
      success: true,
      returnCode: 0,
      message: "ICO created successfully",
    };
  },

  buyToken: async (indexOfICO: number, amount: number): Promise<BuyTokenResult> => {
    const ico = await qipService.getICOInfo(indexOfICO);

    if (!ico) {
      return {
        success: false,
        returnCode: 7,
        message: "ICO not found",
      };
    }

    const currentEpoch = await qipService.getCurrentEpoch();
    let price = 0;
    let remainingAmount = 0;

    if (currentEpoch === ico.startEpoch) {
      price = ico.price1;
      remainingAmount = ico.remainingAmountForPhase1;
    } else if (currentEpoch === ico.startEpoch + 1) {
      price = ico.price2;
      remainingAmount = ico.remainingAmountForPhase2;
    } else if (currentEpoch === ico.startEpoch + 2) {
      price = ico.price3;
      remainingAmount = ico.remainingAmountForPhase3;
    } else {
      return {
        success: false,
        returnCode: 9,
        message: "ICO is not active in current epoch",
      };
    }

    if (amount > remainingAmount) {
      return {
        success: false,
        returnCode: 8,
        message: `Amount exceeds remaining supply (${remainingAmount} available)`,
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        returnCode: 8,
        message: "Amount must be greater than zero",
      };
    }

    return {
      success: true,
      returnCode: 0,
      message: `Successfully purchased ${amount} tokens for ${amount * price} energy`,
    };
  },

  getICOStatus: (ico: ICOInfo, currentEpoch: number): ICOStatus => {
    if (currentEpoch < ico.startEpoch) {
      return "upcoming";
    } else if (currentEpoch >= ico.startEpoch && currentEpoch <= ico.startEpoch + 2) {
      return "live";
    } else {
      return "ended";
    }
  },

  getCurrentPhase: (ico: ICOInfo, currentEpoch: number): 1 | 2 | 3 | null => {
    if (currentEpoch === ico.startEpoch) return 1;
    if (currentEpoch === ico.startEpoch + 1) return 2;
    if (currentEpoch === ico.startEpoch + 2) return 3;
    return null;
  },

  getCurrentPrice: (ico: ICOInfo, currentEpoch: number): number => {
    const phase = qipService.getCurrentPhase(ico, currentEpoch);
    if (phase === 1) return ico.price1;
    if (phase === 2) return ico.price2;
    if (phase === 3) return ico.price3;
    return 0;
  },

  getCurrentRemaining: (ico: ICOInfo, currentEpoch: number): number => {
    const phase = qipService.getCurrentPhase(ico, currentEpoch);
    if (phase === 1) return ico.remainingAmountForPhase1;
    if (phase === 2) return ico.remainingAmountForPhase2;
    if (phase === 3) return ico.remainingAmountForPhase3;
    return 0;
  },
};
