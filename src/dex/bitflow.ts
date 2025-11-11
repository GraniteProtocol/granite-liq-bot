
import { contractPrincipalCV, cvToJSON, fetchCallReadOnlyFunction, uintCV } from "@stacks/transactions";
import { fetchFn, } from "../client/hiro";
import { formatUnits, parseUnits } from "../units";

export const estimateSbtcToAeusdc = async (sBtcAmount: number) => {
    const stxAmount = await fetchCallReadOnlyFunction({
        contractAddress: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
        contractName: 'xyk-core-v-1-2',
        functionName: 'get-dy',
        functionArgs: [
            contractPrincipalCV('SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-sbtc-stx-v-1-1'),
            contractPrincipalCV('SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4', 'sbtc-token'),
            contractPrincipalCV('SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'token-stx-v-1-2'),
            uintCV(parseUnits(sBtcAmount, 8))
        ],
        senderAddress: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
        network: 'mainnet',
        client: {
            fetch: fetchFn,
        }
    }).then(r => Number(cvToJSON(r).value.value));

    const aeUSDCAmount = await fetchCallReadOnlyFunction({
        contractAddress: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
        contractName: 'xyk-core-v-1-2',
        functionName: 'get-dy',
        functionArgs: [
            contractPrincipalCV('SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'xyk-pool-stx-aeusdc-v-1-2'),
            contractPrincipalCV('SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'token-stx-v-1-2'),
            contractPrincipalCV('SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K', 'token-aeusdc'),
            uintCV(stxAmount)

        ],
        senderAddress: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
        network: 'mainnet',
        client: {
            fetch: fetchFn,
        }
    }).then(r => Number(cvToJSON(r).value.value));

    return formatUnits(aeUSDCAmount, 6);
}


export const estimateUsdhToToAeusdc = async(usdhAmount: number) => {
    const aeUSDCAmount = await fetchCallReadOnlyFunction({
        contractAddress: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
        contractName: 'stableswap-core-v-1-2',
        functionName: 'get-dx',
        functionArgs: [
            contractPrincipalCV('SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR', 'stableswap-pool-aeusdc-usdh-v-1-2'),
            contractPrincipalCV('SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K', 'token-aeusdc'),
            contractPrincipalCV('SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG', 'usdh-token-v1'),
            uintCV(parseUnits(usdhAmount, 8))
        ],
        senderAddress: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
        network: 'mainnet',
        client: {
            fetch: fetchFn,
        }
    }).then(r => Number(cvToJSON(r).value.value));

    return formatUnits(aeUSDCAmount, 6);
}