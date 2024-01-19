import React from 'react';
import {
  Stack,
  TextField,
} from '@mui/material';
import { ethers } from 'ethers';

import {
  formatError,
  NATIVE_ADDRESS,
  useStatifiedParam,
} from '../utils';
import {
  decodeTransactionData,
} from '../utils/transactions';

const Component: React.FC<{
  contractAddress?: string;
  iface?: ethers.utils.Interface;
  onContractAddressChange?: (contractAddress: string) => any;
  onIfaceChange?: (iface: ethers.utils.Interface) => any;
  transactionData?: string;
  className?: string;
}> = ({
  contractAddress,
  iface,
  onContractAddressChange,
  onIfaceChange = () => {},
  transactionData = '0x',
  className = '',
}) => {
  const [_contractAddress, _onContractAddressChange] = useStatifiedParam(NATIVE_ADDRESS, contractAddress, onContractAddressChange);
  const [_iface, _onIfaceChange] = useStatifiedParam(new ethers.utils.Interface([]), iface, onIfaceChange);

  const [contractAddressValue, setAddressValue] = React.useState(_contractAddress);
  const [contractAddressErrorState, setContractAddressErrorState] = React.useState('');
  const [abiValue, setAbiValue] = React.useState('[]');
  const [savedAbiValue, setSavedAbiValue] = React.useState(abiValue);
  const [abiValueErrorState, setAbiValueErrorState] = React.useState('');

  React.useEffect(() => {
    const value = _iface.format(ethers.utils.FormatTypes.json) as string;
    let oldValue: string | null = '[]';
    if (abiValue.trim().length !== 0) {
      try {
        oldValue = (new ethers.utils.Interface(savedAbiValue)).format(ethers.utils.FormatTypes.json) as string;
      } catch (e) {
        oldValue = null;
      }
    }
    if (value === oldValue) return;
    setAbiValue(value);
    setSavedAbiValue(value);
  }, [_iface]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Stack className={'transactory-ContractInfoManager ' + className}>
      <TextField
        label="Contract address"
        onChange={(e) => {
          const value = e.target.value;
          setAddressValue(value);
          try {
            ethers.utils.getAddress(value);
          } catch (e) {
            setContractAddressErrorState(formatError(e as Error));
            return;
          }
          setContractAddressErrorState('');
        }}
        onBlur={() => {
          if (contractAddressErrorState !== '') {
            setContractAddressErrorState('');
            setAddressValue(_contractAddress);
          } else {
            _onContractAddressChange(contractAddressValue);
          }
        }}
        value={contractAddressValue}
        error={contractAddressErrorState !== ''}
        helperText={contractAddressErrorState}
      />
      <TextField
        label="Contract ABI"
        onChange={(e) => {
          const value = e.target.value;
          setAbiValue(value);
          if (value.trim().length === 0) {
            _onIfaceChange(new ethers.utils.Interface([]));
            setAbiValueErrorState('');
            return;
          }
          let newIface;
          try {
            newIface = new ethers.utils.Interface(value);
          } catch (e) {
            setAbiValueErrorState(formatError(e as Error));
            return;
          }
          try {
            decodeTransactionData(newIface, transactionData);
          } catch (e) {
            setAbiValueErrorState(`Could not decode transaction data with the given ABI: ${formatError(e as Error)}`);
            return;
          }
          _onIfaceChange(newIface);
          setAbiValueErrorState('');
        }}
        onBlur={() => {
          if (abiValueErrorState !== '') {
            _onIfaceChange(new ethers.utils.Interface(savedAbiValue));
            setAbiValueErrorState('');
            setAbiValue(savedAbiValue);
          } else {
            const abi = _iface.format(ethers.utils.FormatTypes.json) as string;
            setAbiValue(abi);
            setSavedAbiValue(abi);
          }
        }}
        value={abiValue}
        error={abiValueErrorState !== ''}
        helperText={abiValueErrorState}
      />
    </Stack>
  );
};

export default Component;
