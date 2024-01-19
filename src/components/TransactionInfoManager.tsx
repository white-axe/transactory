import React from 'react';
import {
  Autocomplete,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { ethers } from 'ethers';

import {
  cloneAndOverwriteOneEntry,
  formatError,
  formatFunctionFragment,
  selector,
  useStatifiedParam,
} from '../utils';
import {
  decodeTransactionData,
  encodeTransactionData,
  getExampleValueForParamType,
} from '../utils/transactions';

const Component: React.FC<{
  iface?: ethers.utils.Interface;
  fragment?: ethers.utils.FunctionFragment | null;
  value?: ethers.BigNumber;
  data?: string;
  params?: string[];
  onFragmentChange?: (fragment: ethers.utils.FunctionFragment | null) => any;
  onValueChange?: (value: ethers.BigNumber) => any;
  onDataChange?: (data: string) => any;
  onParamsChange?: (params: string[]) => any;
  className?: string;
}> = ({
  iface = new ethers.utils.Interface([]),
  fragment,
  value,
  data,
  params,
  onFragmentChange,
  onValueChange,
  onDataChange,
  onParamsChange,
  className = '',
}) => {
  const [_fragment, _onFragmentChange] = useStatifiedParam(null, fragment, onFragmentChange);
  const [_value, _onValueChange] = useStatifiedParam(ethers.BigNumber.from(0), value, onValueChange);
  const [_data, _onDataChange] = useStatifiedParam('0x', data, onDataChange);
  const [_params, _onParamsChange] = useStatifiedParam([], params, onParamsChange);

  const [selectedFunction, setSelectedFunction] = React.useState(formatFunctionFragment(_fragment));
  const [payableAmount, setPayableAmount] = React.useState(_value.toString());
  const [savedPayableAmount, setSavedPayableAmount] = React.useState(payableAmount);
  const [payableAmountErrorState, setPayableAmountErrorState] = React.useState('');
  const [parameterValues, setParameterValues] = React.useState(_params);
  const [parameterErrorStates, setParameterErrorStates] = React.useState<string[]>([]);
  const [transactionData, setTransactionData] = React.useState(_data);
  const [transactionDataErrorState, setTransactionDataErrorState] = React.useState('');
  const [transactionValue, setTransactionValue] = React.useState(_value.toString());
  const [savedTransactionValue, setSavedTransactionValue] = React.useState(transactionValue);
  const [transactionValueErrorState, setTransactionValueErrorState] = React.useState('');

  const functionFragments = (iface.fragments.filter((f) => f.type === 'function') as ethers.utils.FunctionFragment[])
    .sort((a, b) => a.constant !== b.constant ? (a.constant ? 1 : -1) : a.format().localeCompare(b.format()));
  const hasValidABI = functionFragments.length > 0;

  React.useEffect(() => {
    const [fragment, parameters] = decodeTransactionData(iface, _data);
    _onFragmentChange(fragment);
    if (fragment === null) {
      setSelectedFunction('');
      return;
    }
    setSelectedFunction(formatFunctionFragment(fragment));
    setParameterValues(parameters);
    setParameterErrorStates(Array(parameters.length).fill(''));
  }, [iface]);  // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (_fragment === null) {
      setSelectedFunction('');
      return;
    }
    try {
      iface.getFunction(selector(_fragment));
    } catch (e) {
      setSelectedFunction('');
      return;
    }
    setSelectedFunction(formatFunctionFragment(_fragment));
  }, [_fragment]);  // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const parsed = _value.toString();
    setPayableAmount(parsed);
    setTransactionValue(parsed);
    setPayableAmountErrorState('');
    setTransactionValueErrorState('');
  }, [_value]);

  React.useEffect(() => {
    setTransactionData(_data);
  }, [_data]);

  React.useEffect(() => {
    setParameterValues(_params);
    setTransactionValueErrorState('');
  }, [_params]);

  return (
    <Stack className={'transactory-TransactionInfoManager ' + className}>
      {!hasValidABI ? null : <Stack>
        <Autocomplete
          options={functionFragments.map(formatFunctionFragment)}
          value={selectedFunction}
          onChange={(_e, value) => {
            setSelectedFunction(value || '');
            const fragment = iface.getFunction((value || '').slice(-10));
            const newParameterValues = fragment?.inputs.map((p) => {
              const example = getExampleValueForParamType(p);
              if (typeof example === 'string') return example;
              else return JSON.stringify(example, null, 1);
            }) || [];
            setParameterValues(newParameterValues);
            _onParamsChange(newParameterValues);
            setParameterErrorStates(fragment !== null ? Array(fragment.inputs.length).fill('') : []);
            const newData = encodeTransactionData(iface, fragment, newParameterValues);
            setTransactionData(newData);
            _onDataChange(newData);
            _onFragmentChange(fragment);
          }}
          renderOption={(props, option) => (
            <Typography style={{ fontFamily: 'monospace' }} {...props}>{option}</Typography>
          )}
          renderInput={(params) => <TextField {...params} inputProps={{ ...params.inputProps, style: { fontFamily: 'monospace' } }} InputLabelProps={{ ...params.InputLabelProps, style: { fontFamily: 'monospace' } }} label="Function" />}
        />
      </Stack>}

      <Stack direction="row">
        {!_fragment || (!_fragment.payable && _fragment.inputs.length < 1) ? null : <Stack direction="row">
          <Stack>
            {!_fragment?.payable ? null :
              <TextField
                label="Payable amount in wei"
                onChange={(e) => {
                  const value = e.target.value;
                  setPayableAmount(value);
                  try {
                    const parsedValue = ethers.BigNumber.from(value);
                    setTransactionValue(parsedValue.toString());
                    setPayableAmountErrorState('');
                  } catch (e) {
                    setPayableAmountErrorState(formatError(e as Error));
                    return;
                  }
                }}
                onBlur={() => {
                  if (payableAmountErrorState !== '') {
                    setPayableAmountErrorState('');
                    setPayableAmount(savedPayableAmount);
                    setTransactionValue(savedTransactionValue);
                  } else {
                    setSavedPayableAmount(payableAmount);
                    setSavedTransactionValue(payableAmount);
                    _onValueChange(ethers.BigNumber.from(payableAmount));
                  }
                }}
                value={_fragment === null || _fragment.payable ? payableAmount : '0'}
                disabled={_fragment !== null && !_fragment.payable}
                error={payableAmountErrorState !== ''}
                helperText={payableAmountErrorState}
              />
            }
            <Stack>
              {_fragment?.inputs.map((p, i) => (
                <TextField
                  multiline
                  key={i}
                  label={`Parameter #${i + 1}: ${p.format(ethers.utils.FormatTypes.full)}`}
                  onChange={(e) => {
                    const newParameterValues = cloneAndOverwriteOneEntry(parameterValues, i, e.target.value);
                    setParameterValues(newParameterValues);
                    try {
                      const newData = encodeTransactionData(iface, _fragment, newParameterValues);
                      setTransactionData(newData);
                      _onDataChange(newData);
                    } catch (e) {
                      setParameterErrorStates(cloneAndOverwriteOneEntry(parameterErrorStates, i, formatError(e as Error)));
                      return;
                    }
                    setParameterErrorStates(cloneAndOverwriteOneEntry(parameterErrorStates, i, ''));
                  }}
                  onBlur={() => {
                    if (parameterErrorStates[i] !== '') {
                      setParameterErrorStates(cloneAndOverwriteOneEntry(parameterErrorStates, i, ''));
                      setParameterValues(_params);
                      setTransactionData(encodeTransactionData(iface, _fragment, _params));
                    } else {
                      _onParamsChange(parameterValues);
                    }
                  }}
                  value={parameterValues[i]}
                  error={parameterErrorStates[i] !== ''}
                  helperText={parameterErrorStates[i]}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>}

        {!_fragment || (!_fragment.payable && _fragment.inputs.length < 1) ? null :
          <Divider orientation="vertical" sx={{ width: undefined }}><SwapHorizIcon /></Divider>
        }

        <Stack>
          <TextField
            label="Transaction data"
            multiline
            onChange={(e) => {
              const value = e.target.value;
              setTransactionData(value);
              try {
                const [fragment, parameters] = decodeTransactionData(iface, value);
                setTransactionDataErrorState('');
                _onFragmentChange(fragment);
                if (fragment === null) {
                  setSelectedFunction('');
                  return;
                }
                setSelectedFunction(formatFunctionFragment(fragment));
                setParameterValues(parameters);
                setParameterErrorStates(Array(parameters.length).fill(''));
              } catch (e) {
                setTransactionDataErrorState(formatError(e as Error));
                return;
              }
            }}
            onBlur={() => {
              if (transactionDataErrorState !== '') {
                setTransactionDataErrorState('');
                setTransactionData(_data);
                const [fragment, parameters] = decodeTransactionData(iface, _data);
                _onFragmentChange(fragment);
                if (fragment === null) {
                  setSelectedFunction('');
                  return;
                }
                setSelectedFunction(formatFunctionFragment(fragment));
                setParameterValues(parameters);
                setParameterErrorStates(Array(parameters.length).fill(''));
              } else {
                _onDataChange(transactionData);
              }
            }}
            value={transactionData}
            error={transactionDataErrorState !== ''}
            helperText={transactionDataErrorState}
          />
          <TextField
            label="Transaction value in wei"
            onChange={(e) => {
              const value = e.target.value;
              setTransactionValue(value);
              try {
                const parsedValue = ethers.BigNumber.from(value);
                setPayableAmount(parsedValue.toString());
                setTransactionValueErrorState('');
              } catch (e) {
                setTransactionValueErrorState(formatError(e as Error));
                return;
              }
            }}
            onBlur={() => {
              if (transactionValueErrorState !== '') {
                setTransactionValueErrorState('');
                setTransactionValue(savedTransactionValue);
                setPayableAmount(savedPayableAmount);
              } else {
                setSavedTransactionValue(transactionValue);
                setSavedPayableAmount(transactionValue);
                _onValueChange(ethers.BigNumber.from(transactionValue));
              }
            }}
            value={_fragment === null || _fragment.payable ? transactionValue : '0'}
            disabled={_fragment !== null && !_fragment.payable}
            error={transactionValueErrorState !== ''}
            helperText={transactionValueErrorState}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Component;
