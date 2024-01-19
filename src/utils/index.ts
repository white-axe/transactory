import { useState } from 'react';
import { ethers } from 'ethers';
import { enqueueSnackbar } from 'notistack';

export type LogSeverity = 'default' | 'error' | 'success' | 'warning' | 'info';

export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const paramTypeIsArray = (paramType: ethers.utils.ParamType) => (paramType.arrayLength as number | null) !== null;
export const paramTypeIsTuple = (paramType: ethers.utils.ParamType) => (paramType.components as any[] | null) !== null;

export const canonicalizeParam = (param: ethers.utils.ParamType) => {
  const obj = { ...param };
  if (paramTypeIsTuple(param)) obj.components = param.components.map(canonicalizeParam);
  if (paramTypeIsArray(param)) obj.arrayChildren = canonicalizeParam(param.arrayChildren);
  return Object.setPrototypeOf(obj, ethers.utils.ParamType.prototype) as ethers.utils.ParamType;
};

export const canonicalizeFragment = (fragment: ethers.utils.FunctionFragment) => {
  const obj = { ...fragment };
  obj.inputs = fragment.inputs.map(canonicalizeParam);
  obj.outputs = fragment.outputs?.map(canonicalizeParam);
  return Object.setPrototypeOf(obj, ethers.utils.FunctionFragment.prototype) as ethers.utils.FunctionFragment;
};

export const formatError = (e: Error, split?: boolean) => {
  const message = split === undefined || split === true ? e.message.split(' (')[0] : e.message;
  return message.charAt(0).toUpperCase() + message.slice(1);
};

export const showSnackbar = (message: string, variant: LogSeverity = 'error') => enqueueSnackbar(message, { variant, anchorOrigin: { vertical: 'bottom', horizontal: 'center' } });

export const cloneAndOverwriteOneEntry = <T>(array: T[], index: number, newValue: T) => {
  const newArray = [...array];
  newArray[index] = newValue;
  return newArray;
};

export const selector = (f: ethers.utils.FunctionFragment) => ethers.utils.id(f.format()).substring(0, 10);

export const formatFunctionFragment = (f: ethers.utils.FunctionFragment | null) => f === null ? '' : `${f.format()} ${f.stateMutability}${f.constant ? ` returns (${(f.outputs ?? []).map((p) => p.format()).join(',')})` : ''} @ ${selector(f)}`;

export const useStatifiedParam = <T>(defaultValue: T, value?: T, setValue?: (value: T) => any): [T, (value: T) => any] => {
  const [_value, _setValue] = useState(defaultValue);
  if (value === undefined) {
    value = _value;
    if (setValue === undefined) setValue = (v: T) => typeof v === 'function' ? _setValue(() => v) : _setValue(v);
  }
  if (setValue === undefined) setValue = () => {};
  return [value, setValue];
};
