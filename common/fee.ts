
import { getMempoolTransactions } from "./hiro";

const estimateTxFeeOptimistic = async (): Promise<number> => {
    const mempoolSize = (await getMempoolTransactions(1, 'mainnet')).total;

    if (mempoolSize > 300) {
        return 100000; // 0,1 STX
    } else if (mempoolSize > 200) {
        return 90000; // 0,09 STX
    } else if (mempoolSize > 100) {
        return 65000; // 0,065 STX
    } else if (mempoolSize > 50) {
        return 50000; //  0,05 STX
    } else {
        return 35000; // 0,035 STX
    }
}

export { estimateTxFeeOptimistic };
