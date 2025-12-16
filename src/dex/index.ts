import { estimateSbtcToAeusdc as estimateSbtcToAeusdcBitflow } from "./bitflow";

const DEX_BITFLOW = 1;

export type SwapInfo = { dex: number, dy: number }

export const getDexNameById = (id: number) => {
    if (id === DEX_BITFLOW) {
        return "Bitflow";
    }

    throw new Error("unknown dex");
}

export const estimateSbtcToAeusdc = async (sBtcAmount: number): Promise<SwapInfo> => {
    // Keep this promise.all in case we have multi dex in the future
    const results = await Promise.all([
        estimateSbtcToAeusdcBitflow(sBtcAmount).then(r => ({ dex: DEX_BITFLOW, dy: r }))
    ]);

    return results.sort((a, b) => b.dy - a.dy)[0];
}