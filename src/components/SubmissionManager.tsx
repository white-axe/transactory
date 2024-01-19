/*eslint semi: "error"*/
import React from 'react';
import {
  Button,
  Stack,
  TextField,
} from '@mui/material';
import { ethers } from 'ethers';

import {
  formatError,
  LogSeverity,
  NATIVE_ADDRESS,
  useStatifiedParam,
} from '../utils';
import {
  decodeTransactionResult,
  ethCall,
} from '../utils/transactions';

const Component: React.FC<{
  iface?: ethers.utils.Interface;
  signer?: ethers.providers.JsonRpcSigner | null;
  network?: ethers.providers.Network | null;
  contractAddress?: string | null;
  fragment?: ethers.utils.FunctionFragment | null;
  value?: ethers.BigNumber;
  data?: string;
  returnValues?: string[];
  onReturnValuesChange?: (returnValues: string[]) => any;
  onError?: (
    message: string,
    severity: LogSeverity,
  ) => any;
  className?: string;
}> = ({
  iface = new ethers.utils.Interface([]),
  signer = null,
  network = null,
  contractAddress = NATIVE_ADDRESS,
  fragment = null,
  value = ethers.BigNumber.from(0),
  data = '0x',
  returnValues,
  onReturnValuesChange,
  onError = () => {},
  className = '',
}) => {
  const [_returnValues, _onReturnValuesChange] = useStatifiedParam([], returnValues, onReturnValuesChange);

  const walletConnected =
    signer !== null && network !== null && contractAddress !== null;

  return (
    <Stack className={'transactory-SubmissionManager ' + className}>
      <Stack spacing={0.5}>
        <Button
          onClick={async () => {
            if (!walletConnected) return;
            if (fragment !== null && fragment.constant) {
              let result = '';
              _onReturnValuesChange(Array((fragment.outputs ?? []).length).fill(''));
              onError('Simulating execution', 'info');
              try {
                const _result = await ethCall(signer, contractAddress, data);
                if (_result instanceof Error) {
                  onError('Aborting because your transaction would fail with the following error: ' + formatError(_result, false), 'warning');
                  return;
                }
                result = _result;
              } catch (e) {
                onError('Failed to simulate execution: ' + formatError(e as Error, false), 'error');
                return;
              }
              try {
                _onReturnValuesChange(decodeTransactionResult(iface, fragment, result));
              } catch (e) {
                onError('Failed to decode transaction result: ' + formatError(e as Error), 'error');
                return;
              }
              onError('Execution succeeded!', 'success');
              return;
            }
            const transactionValue = fragment === null || fragment?.payable ? value.toString() : '0';
            let gasLimit = ethers.BigNumber.from(0);
            onError('Sending transaction', 'info');
            try {
              const result = await ethCall(signer, contractAddress, data, transactionValue);
              if (result instanceof Error) {
                onError('Aborting because your transaction would fail with the following error: ' + formatError(result, false), 'warning');
                return;
              }
            } catch (e) {
              onError('Transaction invalid: ' + formatError(e as Error, false), 'error');
              return;
            }
            try {
              gasLimit = await signer.estimateGas({
                to: contractAddress,
                data,
                value: transactionValue,
              });
            } catch (e) {
              onError('Error estimating gas required for transaction: ' + formatError(e as Error), 'error');
              return;
            }
            try {
              const response = await signer.sendTransaction({
                to: contractAddress,
                data,
                value: transactionValue,
                gasLimit,
              });
              onError(`Transaction sent! Hash: ${response.hash}`, 'success');
            } catch (e) {
              onError('Error sending transaction: ' + formatError(e as Error), 'error');
            }
          }}
          disabled={!walletConnected}
        >
          {
            walletConnected
              ? (fragment?.constant ? 'Simulate execution' : 'Submit transaction')
              : (fragment?.constant ? 'Cannot simulate execution \u2014 not connected to wallet' : 'Cannot submit transaction \u2014 not connected to wallet')
          }
        </Button>
      </Stack>

      {!fragment?.constant ? null : <Stack>
        {fragment?.outputs?.map((p, i) => (
          <TextField
            multiline
            key={i}
            label={`Return value #${i + 1}: ${p.format(ethers.utils.FormatTypes.full)}`}
            value={_returnValues[i]}
            disabled={true}
          />
        ))}
      </Stack>}

      {fragment?.constant
        ? <Button
          onClick={() => _onReturnValuesChange(Array((fragment.outputs ?? []).length).fill(''))}
        >
          Clear return values
        </Button>
        : walletConnected
        ? <Button
          onClick={async () => {
            const transactionValue = fragment === null || fragment?.payable ? value.toString() : '0';
            let gasLimit = ethers.BigNumber.from(0);
            onError('Sending transaction', 'info');
            try {
              gasLimit = await signer.estimateGas({
                to: contractAddress,
                data,
                value: transactionValue,
              });
            } catch (e) {}
            try {
              const response = await signer.sendTransaction({
                to: contractAddress,
                data,
                value: transactionValue,
                gasLimit,
              });
              onError(`Transaction sent! Hash: ${response.hash}`, 'success');
            } catch (e) {
              onError('Error sending transaction: ' + formatError(e as Error), 'error');
            }
          }}
        >
          Force submit transaction
        </Button>
        : null
      }
    </Stack>
  );
};

export default Component;
