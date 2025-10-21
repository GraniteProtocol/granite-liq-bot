import { describe, expect, setSystemTime, test } from "bun:test";
import { finalizeLiquidation, getLiquidationList, insertLiquidation } from "./liquidation";

describe("dba contracts", () => {
    test("insertLiquidation", () => {
        setSystemTime(1738262052565);
        insertLiquidation('0x00', 'SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator', 200, 3);

        expect(getLiquidationList({ filters: [['txid', '=', '0x00']] })).toEqual([{
            txid: "0x00",
            contract: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            status: "pending",
            createdAt: 1738262052,
            updatedAt: null,
            fee: 200,
            nonce: 3
        }]);
    });

    test("finalizeLiquidation", () => {
        setSystemTime(1738262062585);
        finalizeLiquidation('0x00', 'success');

        expect(getLiquidationList({ filters: [['txid', '=', '0x00']] })).toEqual([{
            txid: "0x00",
            contract: "SP1AK5J442ET8N7AAWSSNGGZZD1PZ6X9JD1FW551T.liquidator",
            status: "success",
            createdAt: 1738262052,
            updatedAt: 1738262062,
            fee: 200,
            nonce: 3
        }]);
    });
});
