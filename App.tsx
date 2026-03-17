import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { FavouritesProvider } from './src/context/FavouritesContext';
import { TransactionProvider } from './src/context/TransactionContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <FavouritesProvider>
            <TransactionProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </TransactionProvider>
          </FavouritesProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
