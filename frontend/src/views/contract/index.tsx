import { Box, CircularProgress, Typography } from "@mui/material";
import { RouteComponentProps, useParams } from "@reach/router";
import { useEffect } from "react";
import AppMenu from "../../components/app-menu";
import BorrowersList from "../../components/borrowers-list";
import { ContractInfo } from "../../components/contract-info";
import useTranslation from "../../hooks/use-translation";
import { useContractStore } from "../../store/contract";
import { useContractsListStore } from "../../store/contracts-list";

const ContractPage = (_: RouteComponentProps) => {
  const { contracts } = useContractsListStore();
  const { loadContract, data, loading } = useContractStore();
  const params = useParams();
  const { id } = params;
  const [t] = useTranslation();

  const contract = contracts.find((c) => c.id === id);

  useEffect(() => {
    if (contract && contract.id !== data?.id) {
      loadContract(contract);
    }
  }, [contract, loadContract, data]);

  if (!contract) {
    return <Typography>{t("Not found")}</Typography>;
  }

  return (
    <>
      <AppMenu />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        {loading ? (
          <CircularProgress />
        ) : data ? (
          <>
            <ContractInfo />
            <Typography
              variant="h6"
              sx={{
                m: "20px 0 12px 0",
                "::first-letter": { textTransform: "capitalize" },
              }}
            >
              {t(`${contract.network?.toWellFormed()} Borrowers`)}
            </Typography>
            <BorrowersList network={contract.network} />
          </>
        ) : null}
      </Box>
    </>
  );
};

export default ContractPage;
