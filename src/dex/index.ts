import { estimateSbtcToAeusdc as estimateSbtcToAeusdcAlex } from "./alex";
import { estimateSbtcToAeusdc as estimateSbtcToAeusdcBitflow } from "./bitflow";

const DEX_ALEX = 1;
const DEX_BITFLOW = 2;

export type SwapInfo = { dex: number, dy: number }

export const getDexNameById = (id: number) => {
    if (id === DEX_ALEX) {
        return "Alex";
    } else if (id === DEX_BITFLOW) {
        return "Bitflow";
    }

    throw new Error("unknown dex");
}

export const estimateSbtcToAeusdc = async (sBtcAmount: number): Promise<SwapInfo> => {
    const results = await Promise.all([
        estimateSbtcToAeusdcAlex(sBtcAmount).then(r => ({ dex: DEX_ALEX, dy: r })),
        estimateSbtcToAeusdcBitflow(sBtcAmount).then(r => ({ dex: DEX_BITFLOW, dy: r }))
    ]);

    return results.sort((a, b) => b.dy - a.dy)[0];
}