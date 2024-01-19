import React from 'react';
import {
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { ethers } from 'ethers';

import {
  formatError,
  LogSeverity,
  useStatifiedParam,
} from '../utils';

const Component: React.FC<{
  signer?: ethers.providers.JsonRpcSigner | null;
  network?: ethers.providers.Network | null;
  onSignerChange?: (signer: ethers.providers.JsonRpcSigner | null) => any;
  onNetworkChange?: (network: ethers.providers.Network | null) => any;
  onError?: (
    message: string,
    severity: LogSeverity,
  ) => any;
  className?: string;
}> = ({
  signer,
  network,
  onSignerChange,
  onNetworkChange,
  onError = () => {},
  className = '',
}) => {
  const [_signer, _onSignerChange] = useStatifiedParam(null, signer, onSignerChange);
  const [_network, _onNetworkChange] = useStatifiedParam(null, network, onNetworkChange);

  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [walletListener, setWalletListener] =
    React.useState<(() => Promise<ethers.providers.Web3Provider>) | null>(null);

  const ethereum = (window as any).ethereum;
  const walletConnected =
    _signer !== null && _network !== null && walletAddress !== null;
  const networkName = _network === null
    ? null
    : _network.chainId === 1
    ? 'Ethereum'
    : _network.name.toLowerCase().includes('unknown')
    ? null
    : _network.name.toLowerCase().split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const connectWallet = async () => {
    if (!ethereum) return null;
    const refreshWalletState = async () => {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      _onSignerChange(signer);
      setWalletAddress(await signer.getAddress());
      _onNetworkChange(await provider.getNetwork());
      return provider;
    };
    const provider = await refreshWalletState();
    if (walletListener !== null) {
      try {
        ethereum.off('chainChanged', walletListener);
        ethereum.off('accountsChanged', walletListener);
        ethereum.off('networkChanged', walletListener);
      } catch (e) {
        console.warn(e);
      }
    }
    try {
      ethereum.on('chainChanged', refreshWalletState);
      ethereum.on('accountsChanged', refreshWalletState);
      ethereum.on('networkChanged', refreshWalletState);
    } catch (e) {
      console.warn(e);
    }
    setWalletListener(() => refreshWalletState);
    return provider;
  };

  const disconnectWallet = () => {
    _onNetworkChange(null);
    _onSignerChange(null);
    setWalletAddress(null);
    if (!ethereum) return;
    try {
      ethereum.off('chainChanged', walletListener);
      ethereum.off('accountsChanged', walletListener);
      ethereum.off('networkChanged', walletListener);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <Stack className={'transactory-WalletManager ' + className} spacing={0.5}>
      <Typography variant="subtitle2">
        {walletConnected ? `Connected on chain ${_network.chainId}${networkName !== null ? ` (${networkName})` : ''} to address ${walletAddress}` : 'Wallet not connected'}
      </Typography>
      <Button
        onClick={async () => {
          if (walletConnected) {
            disconnectWallet();
          } else {
            try {
              if (await connectWallet() === null)
                onError('No EVM-compatible browser wallet detected: please install MetaMask or any other compatible wallet', 'error');
            } catch (e) {
              onError('Error connecting to wallet: ' + formatError(e as Error), 'error');
            }
          }
        }}
      >
        {walletConnected ? 'Disconnect' : 'Connect to browser wallet'}
      </Button>
    </Stack>
  );
};

export default Component;
