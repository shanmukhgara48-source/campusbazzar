import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextValue {
  isOnline:      boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextValue>({
  isOnline:            true,
  isInternetReachable: true,
  connectionType:      null,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkContextValue>({
    isOnline:            true,
    isInternetReachable: true,
    connectionType:      null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      setState({
        isOnline:            netState.isConnected ?? true,
        isInternetReachable: netState.isInternetReachable,
        connectionType:      netState.type,
      });
    });
    return unsubscribe;
  }, []);

  return <NetworkContext.Provider value={state}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  return useContext(NetworkContext);
}
