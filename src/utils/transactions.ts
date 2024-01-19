import { ethers } from 'ethers';

import {
  canonicalizeFragment,
  paramTypeIsArray,
  paramTypeIsTuple,
  NATIVE_ADDRESS,
} from '.';

export const getExampleValueForParamType = (paramType: ethers.utils.ParamType): any => {
  if (paramTypeIsArray(paramType)) return Array(Math.abs(paramType.arrayLength)).fill(getExampleValueForParamType(paramType.arrayChildren));
  if (paramTypeIsTuple(paramType)) return paramType.components.map(getExampleValueForParamType);
  const typeName = paramType.type;
  if (typeName === 'address') return NATIVE_ADDRESS;
  if (typeName === 'bool') return false;
  if (typeName === 'bytes') return '0x';
  if (typeName.startsWith('bytes')) return '0x' + Array(parseInt(typeName.slice(5))).fill('00').join('');
  if (typeName.startsWith('uint') || typeName.startsWith('int')) return '0';
  return 'Ethereum';
};

export const encodeTransactionData = (iface: ethers.utils.Interface, fragment: ethers.utils.FunctionFragment | null, paramValues: string[]) => {
  if (fragment === null) return '0x';
  return iface.encodeFunctionData(fragment, paramValues.map((v, i) => {
    const value = v.trim();
    const param = fragment.inputs[i];
    if (param.type === 'bool' && value !== 'false' && value !== 'true')
      throw new Error('Invalid Boolean value');
    if (param.type === 'bool' || paramTypeIsArray(param) || paramTypeIsTuple(param)) return JSON.parse(value);
    return value;
  }));
};

export const decodeTransactionData = (iface: ethers.utils.Interface, data: string): [ethers.utils.FunctionFragment, string[]] | [null, null] => {
  data = data.trim();
  let info;
  try {
    info = iface.parseTransaction({data});
  } catch (e) {
    if ((e as any).argument === 'sighash') return [null, null];
    throw e;
  }
  const fragment = canonicalizeFragment(info.functionFragment);
  return [fragment, Array.from(info.args.map((value, i) => {
    const param = fragment.inputs[i];
    if (param.type === 'bool' || paramTypeIsArray(param) || paramTypeIsTuple(param))
      return JSON.stringify(value, (_k, v) => v.type === 'BigNumber' || typeof v === 'number' ? ethers.BigNumber.from(v).toString() : v, 1);
    if (param.type.startsWith('uint') || param.type.startsWith('int')) return ethers.BigNumber.from(value).toString();
    return value;
  })) as string[]];
};

export const ethCall = async (signer: ethers.Signer, to: string, data: string, value: ethers.BigNumberish = '0', blockHash = 'latest') => {
  const address = (await signer.getAddress()).toLowerCase();
  const parsedTo = ethers.utils.getAddress(to).toLowerCase();
  const parsedValue = '0x' + ethers.BigNumber.from(value).toHexString().replace(/^0x0*/, '').padEnd(1, '0');
  try {
    return await (window as any).ethereum.request({
      method: 'eth_call',
      params: [
        {
          from: address,
          to: parsedTo,
          data,
          value: parsedValue,
        },
        blockHash,
      ],
    }) as string;
  } catch (e) {
    const message = (e as any).message as string;
    const formattedMessage = message.toLowerCase().trim();
    if (formattedMessage.startsWith('execution reverted') || formattedMessage.startsWith('vm execution error') || formattedMessage.startsWith('vm exception while processing transaction') || formattedMessage.startsWith('evm: execution reverted') || formattedMessage.startsWith('execution was reverted') || formattedMessage.startsWith('error: transaction reverted'))
      return new Error(message);
    throw e;
  }
};

export const decodeTransactionResult = (iface: ethers.utils.Interface, fragment: ethers.utils.FunctionFragment, data: string) => {
  if (data.trim() === '0x') {
    if ((fragment.outputs ?? []).length === 0) return [];
    throw new Error('Transaction returned no data, are you sure this is a contract?');
  }
  const info = iface.decodeFunctionResult(fragment, data);
  return Array.from(info.map((value, i) => {
    const param = fragment.outputs![i];
    if (param.type === 'bool' || paramTypeIsArray(param) || paramTypeIsTuple(param))
      return JSON.stringify(value, (_k, v) => v.type === 'BigNumber' || typeof v === 'number' ? ethers.BigNumber.from(v).toString() : v, 1);
    if (param.type.startsWith('uint') || param.type.startsWith('int')) return ethers.BigNumber.from(value).toString();
    return value;
  })) as string[];
};
