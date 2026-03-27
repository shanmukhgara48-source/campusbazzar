import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { verifyQRCode } from '../../services/transactionService';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'QRScanner'>;
  route:      RouteProp<HomeStackParamList, 'QRScanner'>;
};

export default function QRScannerScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const [verifying, setVerifying]       = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || verifying) return;
    setScanned(true);
    setVerifying(true);

    try {
      const result = await verifyQRCode(data);

      if (result.ok) {
        Alert.alert(
          'Delivery Confirmed!',
          'QR verified. Transaction marked as complete.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(
          'Verification Failed',
          result.error ?? 'Invalid QR code. Please try again.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }],
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not verify QR. Please try again.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
      ]);
    } finally {
      setVerifying(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={56} color={colors.textTertiary} />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>Allow camera access to scan the buyer's QR code.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            {verifying ? (
              <View style={styles.verifyingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.scanHint}>Verifying QR code…</Text>
              </View>
            ) : scanned ? (
              <Text style={styles.scanHint}>Processing…</Text>
            ) : (
              <Text style={styles.scanHint}>Point the camera at the buyer's QR code</Text>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background, padding: spacing.xl },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: '#fff' },

  camera: { flex: 1 },

  // Dimmed overlay with transparent cut-out
  overlay:       { flex: 1 },
  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME_SIZE },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'flex-start', paddingTop: spacing.xl },

  // Transparent scan frame
  scanFrame: {
    width:  FRAME_SIZE,
    height: FRAME_SIZE,
  },

  // Green corner markers
  corner: {
    position: 'absolute',
    width:  CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.success,
  },
  cornerTL: { top: 0,    left: 0,   borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0,    right: 0,  borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0,   borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0,  borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  scanHint:     { color: '#fff', fontSize: typography.sizes.sm, textAlign: 'center', opacity: 0.9 },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  // Permission screen
  permTitle:   { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary, textAlign: 'center' },
  permSub:     { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  permBtn:     { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md },
  permBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
