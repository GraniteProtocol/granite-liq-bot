
import { getMempoolTransactions } from "./client/hiro";

const estimateTxFeeOptimistic = async (): Promise<number> => {
    const mempoolSize = (await getMempoolTransactions(1, 'mainnet')).total;

    if (mempoolSize > 300) {
        return 600000; // 0.6 STX
    } else if (mempoolSize > 200) {
        return 500000; // 0.5 STX
    } else if (mempoolSize > 100) {
        return 400000; // 0.4 STX
    } else if (mempoolSize > 50) {
        return 300000; //  0.3 STX
    } else {
        return 200000; // 0.2 STX
    }
}

const estimateRbfMultiplier = async (): Promise<number> => {
    const mempoolSize = (await getMempoolTransactions(1, 'mainnet')).total;

    if (mempoolSize > 300) {
        return 2.0;
    } else if (mempoolSize > 200) {
        return 1.8;
    } else if (mempoolSize > 100) {
        return 1.6;
    } else if (mempoolSize > 50) {
        return 1.4;
    } else {
        return 1.2;
    }
}

export { estimateRbfMultiplier, estimateTxFeeOptimistic };

