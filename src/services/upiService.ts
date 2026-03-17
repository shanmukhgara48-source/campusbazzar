import { Linking, Platform } from 'react-native';

export interface UPIPaymentParams {
  upiId:       string;
  payeeName:   string;
  amount:      number;
  transactionNote: string;
  transactionId?:  string;
}

export function buildUPIUrl(params: UPIPaymentParams): string {
  const { upiId, payeeName, amount, transactionNote, transactionId } = params;
  const base = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  return transactionId ? `${base}&tr=${encodeURIComponent(transactionId)}` : base;
}

export async function initiateUPIPayment(params: UPIPaymentParams): Promise<boolean> {
  const url = buildUPIUrl(params);
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  // fallback — open any installed UPI app via intent (Android only)
  if (Platform.OS === 'android') {
    const intent = `intent://pay?pa=${encodeURIComponent(params.upiId)}&pn=${encodeURIComponent(params.payeeName)}&am=${params.amount}&cu=INR#Intent;scheme=upi;end`;
    await Linking.openURL(intent).catch(() => null);
    return true;
  }
  return false;
}

export function formatUPIHandle(handle: string): string {
  return handle.trim().toLowerCase().replace(/\s+/g, '');
}

export function isValidUPIHandle(handle: string): boolean {
  return /^[\w.\-]+@[\w]+$/.test(handle.trim());
}
