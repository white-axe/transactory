import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from 'react';
import {
  Box,
  createTheme,
  CssBaseline,
  Divider,
  Stack,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';
import { ethers } from 'ethers';
import { SnackbarProvider } from 'notistack';

import {
  NATIVE_ADDRESS,
  showSnackbar,
} from './utils';
const WalletManager = React.lazy(() => import('./components/WalletManager'));
const ContractInfoManager = React.lazy(() => import('./components/ContractInfoManager'));
const TransactionInfoManager = React.lazy(() => import('./components/TransactionInfoManager'));
const SubmissionManager = React.lazy(() => import('./components/SubmissionManager'));
const VersionSnackbar = React.lazy(() => import('./components/VersionSnackbar'));

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
        components: {
          MuiTextField: { defaultProps: {
            fullWidth: true,
            variant: 'filled',
            inputProps: { style: { fontFamily: 'monospace' } },
            InputLabelProps: { style: { fontFamily: 'monospace' } },
            FormHelperTextProps: { style: { fontFamily: 'monospace' } },
          } },
          MuiFormControl: { defaultProps: { fullWidth: true, variant: 'filled', } },
          MuiDivider: { defaultProps: { sx: { width: '100%', } } },
          MuiAutocomplete: { defaultProps: { fullWidth: true, disablePortal: true, openOnFocus: true } },
          MuiButton: { defaultProps: { fullWidth: true, variant: 'outlined', } },
          MuiStack: { defaultProps: { justifyContent: 'center', alignItems: 'center', spacing: 3, width: '100%' } },
        },
      }),
    [prefersDarkMode],
  );

  const [iface, setIface] = React.useState(new ethers.utils.Interface([]));
  const [transactionData, setTransactionData] = React.useState('0x');
  const [signer, setSigner] = React.useState<ethers.providers.JsonRpcSigner | null>(null);
  const [network, setNetwork] = React.useState<ethers.providers.Network | null>(null);
  const [contractAddress, setContractAddress] = React.useState(NATIVE_ADDRESS);
  const [params, setParams] = React.useState<string[]>([]);
  const [fragment, setFragment] = React.useState<ethers.utils.FunctionFragment | null>(null);
  const [transactionValue, setTransactionValue] = React.useState(ethers.BigNumber.from(0));
  const [returnValues, setReturnValues] = React.useState<string[]>([]);

  return <><ThemeProvider theme={theme}>
    <CssBaseline />
    <SnackbarProvider maxSnack={8} autoHideDuration={3000} />

    <Box height="100vh" display="flex" flexDirection="column">
      <Stack
        flex={1}
        px={{ xs: 3, sm: 6, md: 10, lg: 15, xl: 20 }}
        py={{ xs: 2, sm: 4, md: 6 }}
      >

        <WalletManager
          signer={signer}
          network={network}
          onSignerChange={setSigner}
          onNetworkChange={setNetwork}
          onError={showSnackbar}
        />

        <Divider />

        <ContractInfoManager
          contractAddress={contractAddress}
          iface={iface}
          onContractAddressChange={setContractAddress}
          onIfaceChange={setIface}
          transactionData={transactionData}
        />

        <Divider />

        <TransactionInfoManager
          iface={iface}
          fragment={fragment}
          value={transactionValue}
          data={transactionData}
          params={params}
          onFragmentChange={(fragment) => {
            setFragment(fragment);
            setReturnValues(fragment?.constant ? Array((fragment.outputs ?? []).length).fill('') : []);
          }}
          onValueChange={setTransactionValue}
          onDataChange={setTransactionData}
          onParamsChange={setParams}
        />

        <Divider />

        <SubmissionManager
          iface={iface}
          signer={signer}
          network={network}
          contractAddress={contractAddress}
          fragment={fragment}
          value={transactionValue}
          data={transactionData}
          returnValues={returnValues}
          onReturnValuesChange={setReturnValues}
          onError={showSnackbar}
        />

        <VersionSnackbar />
      </Stack>
    </Box>
  </ThemeProvider></>;
};

export default App;
